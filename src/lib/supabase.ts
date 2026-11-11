import { createClient } from '@supabase/supabase-js';
import {
  ADMIN_CATEGORY,
  LABOUR_CATEGORY,
  PURCHASE_CATEGORY,
  isPartCategory
} from './costCategories';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Images
const PHOTO_BUCKET = 'restoration-photos';
const MAX_IMAGE_SIZE = 2000; // px, plus grand côté
const JPEG_QUALITY = 0.85;

// Réduit une photo trop grande (photos de téléphone) avant l'envoi :
// chargement plus rapide du site et moins d'espace de stockage utilisé.
const compressImage = async (file: File): Promise<Blob> => {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // format non pris en charge par le navigateur : envoi tel quel
  }
};

export const uploadImage = async (file: File, path: string) => {
  const image = await compressImage(file);
  const fileExt = image === file ? file.name.split('.').pop() : 'jpg';
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(filePath, image, { contentType: image.type || file.type, cacheControl: '31536000' });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(filePath);

  return publicUrl;
};

// Supprime du stockage un fichier envoyé par le site (ignore les images externes)
export const removeImageByUrl = async (url?: string | null) => {
  if (!url) return;
  const marker = `/object/public/${PHOTO_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;
  const filePath = decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([filePath]);
  if (error) console.error("Impossible de supprimer l'image du stockage :", error);
};

// Images hébergées ailleurs que dans le stockage du site (servimg, Pexels…)
// Elles peuvent disparaître si le service les supprime : on les rapatrie.
export interface ExternalImage {
  table: 'photos' | 'timeline_events' | 'settings';
  id: string; // id de la ligne (ou clé du paramètre)
  field: 'url' | 'image_url' | 'value';
  url: string;
  label: string;
  folder: string;
}

const isOwnStorageUrl = (url: string) => url.includes(`/object/public/${PHOTO_BUCKET}/`);
const isHttpUrl = (url: unknown): url is string => typeof url === 'string' && /^https?:\/\//.test(url);

export const listExternalImages = async (): Promise<ExternalImage[]> => {
  const [photos, events, settings] = await Promise.all([
    supabase.from('photos').select('id, url, title'),
    supabase.from('timeline_events').select('id, image_url, title'),
    supabase.from('settings').select('key, value, description').in('key', ['hero_image_url', 'before_image_url', 'after_image_url'])
  ]);
  const error = photos.error || events.error || settings.error;
  if (error) throw error;

  const found: ExternalImage[] = [];
  for (const p of photos.data || []) {
    if (isHttpUrl(p.url) && !isOwnStorageUrl(p.url)) {
      found.push({ table: 'photos', id: p.id, field: 'url', url: p.url, label: `Galerie : ${p.title}`, folder: 'photos' });
    }
  }
  for (const e of events.data || []) {
    if (isHttpUrl(e.image_url) && !isOwnStorageUrl(e.image_url)) {
      found.push({ table: 'timeline_events', id: e.id, field: 'image_url', url: e.image_url, label: `Chronologie : ${e.title}`, folder: 'timeline' });
    }
  }
  for (const row of settings.data || []) {
    if (isHttpUrl(row.value) && !isOwnStorageUrl(row.value)) {
      found.push({ table: 'settings', id: row.key, field: 'value', url: row.value, label: `Paramètre : ${row.description || row.key}`, folder: 'site' });
    }
  }
  return found;
};

// Télécharge l'image externe, l'enregistre dans le stockage du site et met à jour la ligne
export const rehostImage = async (image: ExternalImage): Promise<string> => {
  const response = await fetch(image.url);
  if (!response.ok) throw new Error(`Image inaccessible (${response.status})`);
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error("Le lien ne pointe pas vers une image");
  const name = image.url.split('?')[0].split('/').pop() || 'image.jpg';
  const newUrl = await uploadImage(new File([blob], name, { type: blob.type }), image.folder);

  const query = image.table === 'settings'
    ? supabase.from('settings').update({ value: newUrl }).eq('key', image.id)
    : supabase.from(image.table).update({ [image.field]: newUrl }).eq('id', image.id);
  const { error } = await query;
  if (error) {
    await removeImageByUrl(newUrl); // évite un fichier orphelin
    throw error;
  }
  return newUrl;
};

// Database helpers
export const getPhotos = async () => {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const addPhoto = async (photo: {
  url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  date?: string;
  timeline_event_id?: string | null;
}) => {
  const { data, error } = await supabase
    .from('photos')
    .insert([photo])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updatePhoto = async (id: string, updates: {
  url?: string;
  date?: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  timeline_event_id?: string | null;
}) => {
  const { data, error } = await supabase
    .from('photos')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deletePhoto = async (id: string) => {
  const { data, error } = await supabase
    .from('photos')
    .delete()
    .eq('id', id)
    .select('url');

  if (error) throw error;
  await removeImageByUrl(data?.[0]?.url);
};

export const getTimelineEvents = async () => {
  const { data, error } = await supabase
    .from('timeline_events')
    .select('*')
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const addTimelineEvent = async (event: {
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  category: string;
  image_url?: string;
  video_url?: string;
}) => {
  const { data, error } = await supabase
    .from('timeline_events')
    .insert([event])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateTimelineEvent = async (id: string, updates: {
  date?: string;
  title?: string;
  description?: string;
  status?: 'completed' | 'in-progress' | 'pending';
  category?: string;
  image_url?: string | null;
  video_url?: string | null;
}) => {
  const { data, error } = await supabase
    .from('timeline_events')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteTimelineEvent = async (id: string) => {
  const { data, error } = await supabase
    .from('timeline_events')
    .delete()
    .eq('id', id)
    .select('image_url');

  if (error) throw error;
  await removeImageByUrl(data?.[0]?.image_url);
};

// Rattache (ou détache) en une fois des photos ou des dépenses à une étape
export const setStepLinks = async (
  table: 'photos' | 'parts_costs',
  stepId: string,
  selectedIds: string[],
  previouslyLinkedIds: string[]
) => {
  const toLink = selectedIds.filter(id => !previouslyLinkedIds.includes(id));
  const toUnlink = previouslyLinkedIds.filter(id => !selectedIds.includes(id));
  if (toLink.length) {
    const { error } = await supabase.from(table).update({ timeline_event_id: stepId }).in('id', toLink);
    if (error) throw error;
  }
  if (toUnlink.length) {
    const { error } = await supabase.from(table).update({ timeline_event_id: null }).in('id', toUnlink);
    if (error) throw error;
  }
};

// Technical Specs helpers
export const getTechnicalSpecs = async () => {
  const { data, error } = await supabase
    .from('technical_specs')
    .select('*')
    .order('category', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const addTechnicalSpec = async (spec: {
  category: string;
  part: string;
  original_spec?: string;
  restored_spec?: string;
  action: string;
  status: 'restored' | 'replaced' | 'upgraded';
  notes?: string;
}) => {
  const { data, error } = await supabase
    .from('technical_specs')
    .insert([spec])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateTechnicalSpec = async (id: string, updates: {
  category?: string;
  part?: string;
  original_spec?: string;
  restored_spec?: string;
  action?: string;
  status?: 'restored' | 'replaced' | 'upgraded';
  notes?: string;
}) => {
  const { data, error } = await supabase
    .from('technical_specs')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteTechnicalSpec = async (id: string) => {
  const { error } = await supabase
    .from('technical_specs')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Settings helpers
export const getSettings = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('category', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const getSettingByKey = async (key: string) => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('key', key)
    .single();
  
  if (error) throw error;
  return data;
};

// Enregistre plusieurs paramètres d'un coup (création ou mise à jour selon la clé).
// La colonne value est en jsonb : on envoie la valeur telle quelle, sans JSON.stringify.
export const saveSettings = async (rows: {
  key: string;
  value: unknown;
  category: string;
  description?: string;
  is_public: boolean;
}[]) => {
  const { error } = await supabase
    .from('settings')
    .upsert(rows, { onConflict: 'key' });

  if (error) throw error;
};

export const deleteSetting = async (id: string) => {
  const { error } = await supabase
    .from('settings')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Backup and restore
export const exportData = async () => {
  const [photos, events, specs, settings, partsCosts, invoices] = await Promise.all([
    getPhotos(),
    getTimelineEvents(),
    getTechnicalSpecs(),
    getSettings(),
    getPartsCosts(),
    getInvoices()
  ]);

  return {
    photos,
    timeline_events: events,
    technical_specs: specs,
    settings,
    parts_costs: partsCosts,
    invoices,
    exported_at: new Date().toISOString()
  };
};

// Storage management
export const getStorageUsage = async () => {
  try {
    let totalSize = 0;
    let fileCount = 0;

    // Parcourt récursivement le bucket (les photos sont rangées dans des sous-dossiers)
    const walk = async (prefix: string): Promise<void> => {
      const pageSize = 100;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase.storage
          .from('restoration-photos')
          .list(prefix, { limit: pageSize, offset });

        if (error) throw error;
        if (!data || data.length === 0) break;

        for (const item of data) {
          const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
          if (item.id === null) {
            // Dossier : on descend dedans
            await walk(fullPath);
          } else {
            totalSize += item.metadata?.size ?? 0;
            fileCount++;
          }
        }

        if (data.length < pageSize) break;
      }
    };

    await walk('');

    return {
      totalSize,
      fileCount,
      formattedSize: formatBytes(totalSize)
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return { totalSize: 0, fileCount: 0, formattedSize: '0 B' };
  }
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Parts Costs helpers
export const getPartsCosts = async () => {
  const { data, error } = await supabase
    .from('parts_costs')
    .select(`
      *,
      invoices (
        invoice_number,
        supplier,
        google_drive_url
      )
    `)
    .order('purchase_date', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const addPartCost = async (partCost: {
  part_name: string;
  category: string;
  condition: string;
  price: number;
  currency: string;
  supplier?: string;
  purchase_date: string;
  invoice_id?: string;
  timeline_event_id?: string | null;
  notes?: string;
}) => {
  const { data, error } = await supabase
    .from('parts_costs')
    .insert([partCost])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updatePartCost = async (id: string, updates: {
  part_name?: string;
  category?: string;
  condition?: string;
  price?: number;
  currency?: string;
  supplier?: string;
  purchase_date?: string;
  invoice_id?: string | null;
  timeline_event_id?: string | null;
  notes?: string;
}) => {
  const { data, error } = await supabase
    .from('parts_costs')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deletePartCost = async (id: string) => {
  const { error } = await supabase
    .from('parts_costs')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Invoices helpers
export const getInvoices = async () => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('invoice_date', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const addInvoice = async (invoice: {
  invoice_number: string;
  supplier: string;
  total_amount: number;
  currency: string;
  invoice_date: string;
  google_drive_url?: string;
  description?: string;
}) => {
  const { data, error } = await supabase
    .from('invoices')
    .insert([invoice])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateInvoice = async (id: string, updates: {
  invoice_number?: string;
  supplier?: string;
  total_amount?: number;
  currency?: string;
  invoice_date?: string;
  google_drive_url?: string;
  description?: string;
}) => {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteInvoice = async (id: string) => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Cost statistics
//
// Postes de dépenses :
//   - achat de la moto (purchase)
//   - pièces (toutes les catégories de pièces)
//   - main d'œuvre (labour)
//   - administratif (administrative : assurance, FFVE, carte grise…)
// Coût de restauration = pièces + main d'œuvre.
// Coût total = achat + restauration + administratif.
const emptyCostStatistics = () => ({
  totalCost: 0,
  purchaseCost: 0,
  partsCost: 0,
  labourCost: 0,
  administrativeCost: 0,
  restorationCost: 0,
  basePurchaseCost: 0,
  basePurchase: null as any,
  costsByCategory: {} as Record<string, number>,
  countByCategory: {} as Record<string, number>,
  costsByCondition: {} as Record<string, number>,
  countByCondition: {} as Record<string, number>,
  averageCostByCategory: {} as Record<string, number>,
  totalParts: 0,
  restorationParts: 0,
  newToUsedRatio: { new: 0, used: 0, newCount: 0, usedCount: 0 },
  budgetEvolution: [] as any[]
});

export type CostStatistics = ReturnType<typeof emptyCostStatistics>;

export const getCostStatistics = async (): Promise<CostStatistics> => {
  try {
    const { data, error } = await supabase
      .from('parts_costs')
      .select('part_name, category, condition, price, currency, purchase_date');

    if (error) throw error;

    const costs = (data || []).map(cost => ({ ...cost, price: Number(cost.price) || 0 }));
    const sum = (list: typeof costs) => list.reduce((total, cost) => total + cost.price, 0);
    const byDate = (a: { purchase_date: string }, b: { purchase_date: string }) =>
      new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime();

    const purchases = costs.filter(cost => cost.category === PURCHASE_CATEGORY).sort(byDate);
    const parts = costs.filter(cost => isPartCategory(cost.category));
    const labour = costs.filter(cost => cost.category === LABOUR_CATEGORY);
    const administrative = costs.filter(cost => cost.category === ADMIN_CATEGORY);
    const restoration = [...parts, ...labour];

    const purchaseCost = sum(purchases);
    const partsCost = sum(parts);
    const labourCost = sum(labour);
    const administrativeCost = sum(administrative);
    const restorationCost = partsCost + labourCost;

    // Répartition par catégorie (tout sauf l'achat de la moto)
    const costsByCategory: Record<string, number> = {};
    const countByCategory: Record<string, number> = {};
    for (const cost of costs) {
      if (cost.category === PURCHASE_CATEGORY) continue;
      costsByCategory[cost.category] = (costsByCategory[cost.category] || 0) + cost.price;
      countByCategory[cost.category] = (countByCategory[cost.category] || 0) + 1;
    }
    const averageCostByCategory = Object.fromEntries(
      Object.entries(costsByCategory).map(([category, total]) => [category, total / countByCategory[category]])
    );

    // État des pièces (neuf / occasion / reconditionné) : pièces uniquement
    const costsByCondition: Record<string, number> = {};
    const countByCondition: Record<string, number> = {};
    for (const part of parts) {
      costsByCondition[part.condition] = (costsByCondition[part.condition] || 0) + part.price;
      countByCondition[part.condition] = (countByCondition[part.condition] || 0) + 1;
    }

    const newCount = countByCondition.new || 0;
    const usedCount = (countByCondition.used || 0) + (countByCondition.refurbished || 0);
    const ratioTotal = newCount + usedCount;
    const newToUsedRatio = ratioTotal > 0
      ? {
          new: Math.round((newCount / ratioTotal) * 100),
          used: Math.round((usedCount / ratioTotal) * 100),
          newCount,
          usedCount
        }
      : { new: 0, used: 0, newCount: 0, usedCount: 0 };

    // Évolution du budget de restauration (pièces + main d'œuvre)
    let cumulative = 0;
    const budgetEvolution = [...restoration].sort(byDate).map(cost => {
      cumulative += cost.price;
      return {
        date: cost.purchase_date,
        amount: cost.price,
        cumulative,
        part_name: cost.part_name,
        category: cost.category
      };
    });

    return {
      totalCost: sum(costs),
      purchaseCost,
      partsCost,
      labourCost,
      administrativeCost,
      restorationCost,
      basePurchaseCost: purchaseCost,
      basePurchase: purchases[0] || null,
      costsByCategory,
      countByCategory,
      costsByCondition,
      countByCondition,
      averageCostByCategory,
      totalParts: parts.length,
      restorationParts: restoration.length,
      newToUsedRatio,
      budgetEvolution
    };
  } catch (error) {
    console.error('Error getting cost statistics:', error);
    return emptyCostStatistics();
  }
};
