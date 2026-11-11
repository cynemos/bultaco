import React, { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateFr } from '../lib/format';

export interface ViewerPhoto {
  id: string;
  url: string;
  title: string;
  description?: string;
  date?: string;
}

interface PhotoViewerProps {
  photos: ViewerPhoto[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

// Visionneuse plein écran : précédente / suivante (boutons, flèches du clavier,
// glisser au doigt), Échap pour fermer, légende avec titre, date et description.
const PhotoViewer: React.FC<PhotoViewerProps> = ({ photos, index, onIndexChange, onClose }) => {
  const startX = useRef<number | null>(null);
  const count = photos.length;
  const photo = photos[index];

  const go = (delta: number) => onIndexChange((index + delta + count) % count);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (count > 1 && e.key === 'ArrowLeft') onIndexChange((index - 1 + count) % count);
      if (count > 1 && e.key === 'ArrowRight') onIndexChange((index + 1) % count);
    };
    window.addEventListener('keydown', onKey);
    // Empêche la page de défiler derrière la visionneuse
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [index, count, onClose, onIndexChange]);

  // Précharge les photos voisines pour un défilement fluide
  useEffect(() => {
    if (count < 2) return;
    [photos[(index + 1) % count], photos[(index - 1 + count) % count]].forEach(p => {
      const img = new Image();
      img.src = p.url;
    });
  }, [index, count, photos]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 text-zinc-400 text-sm" onClick={e => e.stopPropagation()}>
        <span>{count > 1 ? `${index + 1} / ${count}` : ''}</span>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 hover:text-white" aria-label="Fermer">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div
        className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-16 select-none touch-pan-y"
        onPointerDown={e => {
          startX.current = e.clientX;
        }}
        onPointerUp={e => {
          if (startX.current === null || count < 2) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 50) {
            e.stopPropagation();
            go(dx < 0 ? 1 : -1);
          }
        }}
      >
        <img
          key={photo.id}
          src={photo.url}
          alt={photo.title}
          draggable={false}
          onClick={e => e.stopPropagation()}
          className="max-h-full max-w-full object-contain rounded-lg"
        />
        {count > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); go(-1); }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-orange-500 p-2 sm:p-3 rounded-full text-white"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); go(1); }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-orange-500 p-2 sm:p-3 rounded-full text-white"
              aria-label="Photo suivante"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      <div className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
        <p className="text-white font-medium">{photo.title}</p>
        {(photo.date || photo.description) && (
          <p className="text-zinc-400 text-sm mt-1 max-w-3xl mx-auto">
            {photo.date && <span>{formatDateFr(photo.date)}</span>}
            {photo.date && photo.description && ' · '}
            {photo.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default PhotoViewer;
