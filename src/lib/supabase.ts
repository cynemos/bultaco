import { createClient } from '@supabase/supabase-js';

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

// Database helpers
export const uploadImage = async (file: File, path: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${path}/${fileName}`;
  
  const { error } = await supabase.storage
    .from('restoration-photos')
    .upload(filePath, file);
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('restoration-photos')
    .getPublicUrl(filePath);
    
  return publicUrl;
};

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
}) => {
  const { data, error } = await supabase
    .from('photos')
    .insert([photo])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updatePhoto = async (id: string, updates: {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
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
  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
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
  image_url?: string;
  video_url?: string;
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
  const { error } = await supabase
    .from('timeline_events')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
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

export const updateSetting = async (key: string, value: any, description?: string) => {
  const { data, error } = await supabase
    .from('settings')
    .update({ 
      value: JSON.stringify(value),
      description,
      updated_at: new Date().toISOString()
    })
    .eq('key', key)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const addSetting = async (setting: {
  key: string;
  value: any;
  category: string;
  description?: string;
  is_public?: boolean;
}) => {
  const { data, error } = await supabase
    .from('settings')
    .insert([{
      ...setting,
      value: JSON.stringify(setting.value)
    }])
    .select();
  
  if (error) throw error;
  return data[0];
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
  const [photos, events, specs, settings] = await Promise.all([
    getPhotos(),
    getTimelineEvents(),
    getTechnicalSpecs(),
    getSettings()
  ]);
  
  return {
    photos,
    timeline_events: events,
    technical_specs: specs,
    settings,
    exported_at: new Date().toISOString()
  };
};

// Storage management
export const getStorageUsage = async () => {
  try {
    const { data, error } = await supabase.storage
      .from('restoration-photos')
      .list();
    
    if (error) throw error;
    
    let totalSize = 0;
    let fileCount = 0;
    
    if (data) {
      data.forEach(file => {
        if (file.metadata?.size) {
          totalSize += file.metadata.size;
        }
        fileCount++;
      });
    }
    
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
export const getCostStatistics = async () => {
  try {
    const { data: costs, error } = await supabase
      .from('parts_costs')
      .select('part_name, category, condition, price, currency, purchase_date');

    if (error) throw error;

    const totalCost = costs?.reduce((sum, cost) => sum + parseFloat(cost.price.toString()), 0) || 0;

    // Identify base purchase by category 'administrative'
    const basePurchase = costs?.find(cost =>
      cost.category === 'administrative'
    ) || null;
    const basePurchaseCost = basePurchase ? parseFloat(basePurchase.price.toString()) : 0;

    // Filter out base purchase from restoration costs
    const restorationParts = costs?.filter(cost =>
      cost.category !== 'administrative'
    ) || [];
    const restorationCost = restorationParts.reduce((sum, cost) => sum + parseFloat(cost.price.toString()), 0);

    // Calculate costs by category (excluding base purchase)
    const costsByCategory = restorationParts.reduce((acc: any, cost) => {
      acc[cost.category] = (acc[cost.category] || 0) + parseFloat(cost.price.toString());
      return acc;
    }, {});

    // Calculate costs by condition (excluding base purchase)
    const costsByCondition = restorationParts.reduce((acc: any, cost) => {
      acc[cost.condition] = (acc[cost.condition] || 0) + parseFloat(cost.price.toString());
      return acc;
    }, {});

    // Calculate average cost by category
    const averageCostByCategory = Object.entries(costsByCategory).reduce((acc: any, [category, total]) => {
      const count = restorationParts.filter(p => p.category === category).length;
      acc[category] = count > 0 ? (total as number) / count : 0;
      return acc;
    }, {});

    // Calculate parts count by condition
    const countByCondition = restorationParts.reduce((acc: any, cost) => {
      acc[cost.condition] = (acc[cost.condition] || 0) + 1;
      return acc;
    }, {});

    // Calculate ratio new/used
    const newCount = countByCondition.new || 0;
    const usedCount = (countByCondition.used || 0) + (countByCondition.refurbished || 0);
    const totalCountForRatio = newCount + usedCount;
    const newToUsedRatio = totalCountForRatio > 0 ? {
      new: Math.round((newCount / totalCountForRatio) * 100),
      used: Math.round((usedCount / totalCountForRatio) * 100),
      newCount,
      usedCount
    } : { new: 0, used: 0, newCount: 0, usedCount: 0 };

    // Calculate budget evolution over time
    const sortedCosts = [...restorationParts].sort((a, b) =>
      new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime()
    );

    const budgetEvolution = sortedCosts.reduce((acc: any[], cost) => {
      const previousTotal = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      const cumulative = previousTotal + parseFloat(cost.price.toString());
      acc.push({
        date: cost.purchase_date,
        amount: parseFloat(cost.price.toString()),
        cumulative,
        part_name: cost.part_name,
        category: cost.category
      });
      return acc;
    }, []);

    return {
      totalCost,
      basePurchaseCost,
      basePurchase,
      restorationCost,
      costsByCategory,
      costsByCondition,
      totalParts: costs?.length || 0,
      restorationParts: restorationParts.length,
      averageCostByCategory,
      countByCondition,
      newToUsedRatio,
      budgetEvolution
    };
  } catch (error) {
    console.error('Error getting cost statistics:', error);
    return {
      totalCost: 0,
      basePurchaseCost: 0,
      basePurchase: null,
      restorationCost: 0,
      costsByCategory: {},
      costsByCondition: {},
      totalParts: 0,
      restorationParts: 0,
      averageCostByCategory: {},
      countByCondition: {},
      newToUsedRatio: { new: 0, used: 0, newCount: 0, usedCount: 0 },
      budgetEvolution: []
    };
  }
};