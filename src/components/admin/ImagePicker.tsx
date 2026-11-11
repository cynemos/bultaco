import React, { useEffect, useState } from 'react';
import { X, Search } from 'lucide-react';
import { getPhotos } from '../../lib/supabase';

interface PickerPhoto {
  id: string;
  url: string;
  title: string;
  date?: string;
}

interface ImagePickerProps {
  title: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

// Fenêtre de choix d'une photo de la galerie (pour les réglages d'image)
const ImagePicker: React.FC<ImagePickerProps> = ({ title, onSelect, onClose }) => {
  const [photos, setPhotos] = useState<PickerPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getPhotos()
      .then(data => setPhotos(data || []))
      .catch(error => console.error('Erreur lors du chargement des photos:', error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const term = search.trim().toLowerCase();
  const visible = term ? photos.filter(p => p.title?.toLowerCase().includes(term)) : photos;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 p-4 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une photo…"
              className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="overflow-y-auto p-4">
          {loading ? (
            <p className="text-zinc-400 text-center py-8">Chargement des photos…</p>
          ) : visible.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">Aucune photo trouvée</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {visible.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => onSelect(photo.url)}
                  className="group text-left rounded-lg overflow-hidden border border-zinc-700 hover:border-orange-500 focus:border-orange-500 outline-none"
                >
                  <img src={photo.url} alt="" loading="lazy" className="w-full h-28 object-cover group-hover:opacity-90" />
                  <span className="block px-2 py-1 text-xs text-zinc-300 truncate">{photo.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePicker;
