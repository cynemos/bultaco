import { supabase } from './supabase';

// ---------- Carnet d'entretien ----------

export type MaintenanceType = 'entretien' | 'vidange' | 'reglage' | 'reparation' | 'controle' | 'sortie' | 'autre';

export const MAINTENANCE_TYPES: { value: MaintenanceType; label: string; color: string }[] = [
  { value: 'entretien', label: 'Entretien', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'vidange', label: 'Vidange', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'reglage', label: 'Réglage', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { value: 'reparation', label: 'Réparation', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { value: 'controle', label: 'Contrôle', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { value: 'sortie', label: 'Sortie', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  { value: 'autre', label: 'Autre', color: 'bg-zinc-600/30 text-zinc-300 border-zinc-500/30' }
];

export interface MaintenanceEntry {
  id: string;
  date: string;
  type: MaintenanceType;
  title: string;
  description?: string | null;
  mileage?: number | null;
  cost?: number | null;
  created_at?: string;
}

export type MaintenanceInput = Omit<MaintenanceEntry, 'id' | 'created_at'>;

export const getMaintenanceEntries = async (): Promise<MaintenanceEntry[]> => {
  const { data, error } = await supabase
    .from('maintenance_entries')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const saveMaintenanceEntry = async (entry: MaintenanceInput, id?: string) => {
  const query = id
    ? supabase.from('maintenance_entries').update(entry).eq('id', id)
    : supabase.from('maintenance_entries').insert([entry]);
  const { error } = await query;
  if (error) throw error;
};

export const deleteMaintenanceEntry = async (id: string) => {
  const { error } = await supabase.from('maintenance_entries').delete().eq('id', id);
  if (error) throw error;
};

// ---------- Documents ----------

export type DocumentCategory = 'notice' | 'technique' | 'administratif' | 'historique' | 'autre';

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'notice', label: 'Notices et manuels' },
  { value: 'technique', label: 'Revue technique, schémas' },
  { value: 'administratif', label: 'Administratif (carte grise, FFVE…)' },
  { value: 'historique', label: 'Historique, presse, catalogues' },
  { value: 'autre', label: 'Autre' }
];

export interface SiteDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  description?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  external_url?: string | null;
  is_public: boolean;
  created_at?: string;
}

const DOCUMENTS_BUCKET = 'documents';

export const getDocuments = async (): Promise<SiteDocument[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('category')
    .order('title');
  if (error) throw error;
  return data || [];
};

export const uploadDocumentFile = async (file: File) => {
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || 'application/octet-stream' });
  if (error) throw error;
  return { file_path: path, file_name: file.name, file_size: file.size, mime_type: file.type || null };
};

export const removeDocumentFile = async (path?: string | null) => {
  if (!path) return;
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
  if (error) console.error('Impossible de supprimer le fichier :', error);
};

export const saveDocument = async (doc: Omit<SiteDocument, 'id' | 'created_at'>, id?: string) => {
  const query = id
    ? supabase.from('documents').update(doc).eq('id', id)
    : supabase.from('documents').insert([doc]);
  const { error } = await query;
  if (error) throw error;
};

export const deleteDocument = async (doc: SiteDocument) => {
  const { error } = await supabase.from('documents').delete().eq('id', doc.id);
  if (error) throw error;
  await removeDocumentFile(doc.file_path);
};

// Lien de téléchargement : lien externe tel quel, ou lien signé valable 1 h
// (le stockage « documents » est privé ; seuls les documents publics sont accessibles aux visiteurs)
export const getDocumentUrl = async (doc: SiteDocument, download = false): Promise<string> => {
  if (doc.external_url) return doc.external_url;
  if (!doc.file_path) throw new Error('Document sans fichier');
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(doc.file_path, 3600, download ? { download: doc.file_name || true } : undefined);
  if (error) throw error;
  return data.signedUrl;
};

export const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
};
