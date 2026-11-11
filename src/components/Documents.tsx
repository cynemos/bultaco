import React, { useEffect, useState } from 'react';
import { FileText, ExternalLink, Download, FileImage } from 'lucide-react';
import { DOCUMENT_CATEGORIES, SiteDocument, formatFileSize, getDocumentUrl, getDocuments } from '../lib/tools';

// Page publique « Documents » : notices, revue technique, documents historiques…
// Seuls les documents marqués « public » dans l'admin apparaissent ici.
const Documents: React.FC = () => {
  const [docs, setDocs] = useState<SiteDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    getDocuments()
      .then(all => setDocs(all.filter(d => d.is_public)))
      .catch(err => {
        console.error('Erreur lors du chargement des documents:', err);
        setError("Les documents ne sont pas encore disponibles.");
      })
      .finally(() => setLoading(false));
  }, []);

  const open = async (doc: SiteDocument, download = false) => {
    // Fenêtre ouverte tout de suite (sinon le navigateur bloque l'ouverture après l'attente)
    const win = download ? null : window.open('', '_blank');
    try {
      setOpening(doc.id);
      const url = await getDocumentUrl(doc, download);
      if (win) win.location.href = url;
      else window.location.href = url;
    } catch (err) {
      win?.close();
      alert("Impossible d'ouvrir ce document pour le moment.");
      console.error(err);
    } finally {
      setOpening(null);
    }
  };

  const groups = DOCUMENT_CATEGORIES.map(category => ({
    ...category,
    docs: docs.filter(d => d.category === category.value)
  })).filter(g => g.docs.length > 0);

  return (
    <section className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Documents
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Notices, revue technique et documents d'époque réunis au même endroit
          </p>
        </div>

        {loading ? (
          <p className="text-center text-zinc-400">Chargement des documents…</p>
        ) : error ? (
          <p className="text-center text-zinc-500">{error}</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
            <FileText className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">Aucun document publié pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map(group => (
              <div key={group.value}>
                <h2 className="text-xl font-semibold text-white mb-4">{group.label}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {group.docs.map(doc => {
                    const Icon = doc.mime_type?.startsWith('image/') ? FileImage : FileText;
                    return (
                      <article key={doc.id} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 flex flex-col">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="bg-orange-500/20 p-2.5 rounded-lg">
                            <Icon className="h-5 w-5 text-orange-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-white">{doc.title}</h3>
                            <p className="text-xs text-zinc-500">
                              {doc.external_url ? 'Lien externe' : [doc.file_name?.split('.').pop()?.toUpperCase(), formatFileSize(doc.file_size)].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                        {doc.description && <p className="text-sm text-zinc-400 mb-4 flex-1">{doc.description}</p>}
                        <div className="flex gap-2 mt-auto">
                          <button
                            onClick={() => open(doc)}
                            disabled={opening === doc.id}
                            className="flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg disabled:opacity-50"
                          >
                            <ExternalLink className="h-4 w-4" /> Ouvrir
                          </button>
                          {!doc.external_url && (
                            <button
                              onClick={() => open(doc, true)}
                              disabled={opening === doc.id}
                              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg disabled:opacity-50"
                            >
                              <Download className="h-4 w-4" /> Télécharger
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Documents;
