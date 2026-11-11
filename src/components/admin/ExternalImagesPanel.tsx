import React, { useEffect, useState } from 'react';
import { DownloadCloud, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { ExternalImage, listExternalImages, rehostImage } from '../../lib/supabase';

interface ExternalImagesPanelProps {
  onDone?: () => void;
}

// Repère les images hébergées hors du stockage du site (servimg, Pexels…)
// et les copie dans le stockage Supabase pour qu'elles ne disparaissent pas.
const ExternalImagesPanel: React.FC<ExternalImagesPanelProps> = ({ onDone }) => {
  const [images, setImages] = useState<ExternalImage[] | null>(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, 'ok' | string>>({});

  const load = async () => {
    try {
      setImages(await listExternalImages());
    } catch (error) {
      console.error('Erreur lors de la recherche des images externes:', error);
      setImages([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const keyOf = (image: ExternalImage) => `${image.table}:${image.id}`;

  const rehostAll = async () => {
    if (!images) return;
    setRunning(true);
    const next: Record<string, 'ok' | string> = {};
    for (const image of images) {
      try {
        await rehostImage(image);
        next[keyOf(image)] = 'ok';
      } catch (error) {
        next[keyOf(image)] = error instanceof Error ? error.message : 'Erreur inconnue';
      }
      setResults({ ...next });
    }
    setRunning(false);
    await load();
    onDone?.();
  };

  if (images === null) {
    return (
      <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700 mb-8 text-zinc-400 text-sm">
        Recherche des images hébergées ailleurs…
      </div>
    );
  }

  const failures = Object.entries(results).filter(([, r]) => r !== 'ok');
  const successes = Object.values(results).filter(r => r === 'ok').length;

  return (
    <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <DownloadCloud className="h-5 w-5 text-orange-400" />
          <h3 className="font-semibold text-white">Images hébergées ailleurs</h3>
        </div>
        {images.length > 0 && (
          <button
            onClick={rehostAll}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
            {running ? 'Rapatriement…' : `Rapatrier ${images.length} image${images.length > 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {images.length === 0 ? (
        <p className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle className="h-4 w-4" />
          Toutes les images sont dans votre stockage : rien ne dépend d'un service extérieur.
        </p>
      ) : (
        <>
          <p className="text-zinc-400 text-sm mb-4">
            Ces images sont sur d'autres sites (servimg, Pexels…) et pourraient disparaître. Le rapatriement les copie
            dans votre stockage et met à jour les liens automatiquement.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {images.map(image => (
              <div key={keyOf(image)} className="flex items-center gap-3 bg-zinc-900/50 rounded-lg p-2">
                <img src={image.url} alt="" loading="lazy" className="h-12 w-16 object-cover rounded" />
                <div className="min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{image.label}</div>
                  <div className="text-xs text-zinc-500 truncate">{new URL(image.url).hostname}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {successes > 0 && (
        <p className="mt-4 text-sm text-green-400">{successes} image{successes > 1 ? 's' : ''} rapatriée{successes > 1 ? 's' : ''}.</p>
      )}
      {failures.length > 0 && (
        <div className="mt-3 text-sm text-red-400 space-y-1">
          {failures.map(([key, message]) => (
            <p key={key} className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {message}
            </p>
          ))}
          <p className="text-zinc-500">
            Pour une image qui refuse d'être copiée : enregistrez-la sur votre ordinateur, puis remplacez-la depuis
            l'onglet concerné (Photos ou Chronologie).
          </p>
        </div>
      )}
    </div>
  );
};

export default ExternalImagesPanel;
