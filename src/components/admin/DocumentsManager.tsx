import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, RefreshCw, ExternalLink, Globe, Lock, Upload } from 'lucide-react';
import {
  DOCUMENT_CATEGORIES,
  DocumentCategory,
  SiteDocument,
  deleteDocument,
  formatFileSize,
  getDocumentUrl,
  getDocuments,
  removeDocumentFile,
  saveDocument,
  uploadDocumentFile
} from '../../lib/tools';

const input =
  'w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500';

const emptyForm = () => ({
  title: '',
  category: 'notice' as DocumentCategory,
  description: '',
  external_url: '',
  is_public: false,
  file: null as File | null
});

// Admin → Documents : notices, revue technique, carte grise (privée), attestation FFVE…
const DocumentsManager: React.FC = () => {
  const [docs, setDocs] = useState<SiteDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<SiteDocument | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setDocs(await getDocuments());
      setError('');
    } catch (err) {
      setError(
        err instanceof Error && /documents/.test(err.message)
          ? 'La migration « maintenance_and_documents » n’a pas encore été appliquée dans Supabase.'
          : 'Erreur lors du chargement des documents.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (doc: SiteDocument) => {
    setEditing(doc);
    setForm({
      title: doc.title,
      category: doc.category,
      description: doc.description || '',
      external_url: doc.external_url || '',
      is_public: doc.is_public,
      file: null
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasFile = form.file || editing?.file_path;
    if (!hasFile && !form.external_url.trim()) {
      alert('Ajoutez un fichier ou un lien.');
      return;
    }
    let uploaded: Awaited<ReturnType<typeof uploadDocumentFile>> | null = null;
    try {
      setSaving(true);
      if (form.file) uploaded = await uploadDocumentFile(form.file);
      await saveDocument(
        {
          title: form.title.trim(),
          category: form.category,
          description: form.description.trim() || null,
          is_public: form.is_public,
          external_url: form.file ? null : form.external_url.trim() || null,
          file_path: uploaded?.file_path ?? (form.external_url.trim() && !editing?.file_path ? null : editing?.file_path ?? null),
          file_name: uploaded?.file_name ?? editing?.file_name ?? null,
          file_size: uploaded?.file_size ?? editing?.file_size ?? null,
          mime_type: uploaded?.mime_type ?? editing?.mime_type ?? null
        },
        editing?.id
      );
      // Fichier remplacé : l'ancien est supprimé du stockage
      if (uploaded && editing?.file_path) await removeDocumentFile(editing.file_path);
      setShowForm(false);
      await load();
    } catch (err) {
      if (uploaded) await removeDocumentFile(uploaded.file_path);
      alert(`Erreur lors de l'enregistrement : ${err instanceof Error ? err.message : ''}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (doc: SiteDocument) => {
    if (!confirm(`Supprimer « ${doc.title} » ? Le fichier sera aussi effacé.`)) return;
    try {
      await deleteDocument(doc);
      await load();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const open = async (doc: SiteDocument) => {
    const win = window.open('', '_blank');
    try {
      const url = await getDocumentUrl(doc);
      if (win) win.location.href = url;
    } catch {
      win?.close();
      alert("Impossible d'ouvrir le document");
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Documents</h2>
          <p className="text-zinc-400">
            Les documents <strong>publics</strong> apparaissent sur la page /documents ; les <strong>privés</strong> (carte grise,
            factures…) ne sont visibles qu'ici.
          </p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
          <Plus className="h-5 w-5" /> Ajouter un document
        </button>
      </div>

      {error && <div className="mb-6 p-4 rounded-lg border bg-red-500/20 border-red-500/30 text-red-400">{error}</div>}

      {loading ? (
        <p className="text-zinc-400">Chargement…</p>
      ) : docs.length === 0 && !error ? (
        <p className="text-zinc-500 text-center py-12">Aucun document pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <div key={doc.id} className="bg-zinc-800 rounded-xl p-4 border border-zinc-700 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-white font-medium">{doc.title}</span>
                  {doc.is_public ? (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                      <Globe className="h-3 w-3" /> Public
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300 border border-zinc-600">
                      <Lock className="h-3 w-3" /> Privé
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  {DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label}
                  {' · '}
                  {doc.external_url ? 'Lien externe' : [doc.file_name, formatFileSize(doc.file_size)].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button onClick={() => open(doc)} className="bg-zinc-700 hover:bg-zinc-600 text-white p-2 rounded-lg" title="Ouvrir">
                <ExternalLink className="h-4 w-4" />
              </button>
              <button onClick={() => openEdit(doc)} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg" title="Modifier">
                <Edit2 className="h-4 w-4" />
              </button>
              <button onClick={() => remove(doc)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg" title="Supprimer">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-zinc-900 rounded-xl p-6 w-full max-w-xl border border-zinc-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">{editing ? 'Modifier le document' : 'Ajouter un document'}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <label className="block text-sm text-zinc-300">Titre *
              <input required className={`${input} mt-1`} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="block text-sm text-zinc-300">Catégorie
              <select className={`${input} mt-1`} value={form.category} onChange={e => setForm({ ...form, category: e.target.value as DocumentCategory })}>
                {DOCUMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label className="block text-sm text-zinc-300">Description
              <textarea rows={2} className={`${input} mt-1`} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </label>

            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
              <label className="block text-sm text-zinc-300">
                <span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Fichier (PDF, image… 50 Mo max)</span>
                <input
                  type="file"
                  accept=".pdf,image/*,.doc,.docx,.xls,.xlsx,.txt"
                  className="mt-2 block w-full text-sm text-zinc-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-zinc-700 file:text-white"
                  onChange={e => setForm({ ...form, file: e.target.files?.[0] || null })}
                />
              </label>
              {editing?.file_name && !form.file && <p className="text-xs text-zinc-500">Fichier actuel : {editing.file_name}</p>}
              <div className="text-center text-xs text-zinc-500">— ou —</div>
              <label className="block text-sm text-zinc-300">Lien externe (Google Drive…)
                <input type="url" className={`${input} mt-1`} placeholder="https://" disabled={!!form.file} value={form.external_url} onChange={e => setForm({ ...form, external_url: e.target.value })} />
              </label>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-orange-500" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} />
              <span>
                <span className="text-white">Document public</span>
                <span className="block text-xs text-zinc-500">Visible et téléchargeable par tous sur la page Documents. Laissez décoché pour la carte grise, les factures, etc.</span>
              </span>
            </label>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg">Annuler</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50">
                {saving && <RefreshCw className="h-4 w-4 animate-spin" />} Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DocumentsManager;
