import React, { useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteSettings } from '../contexts/SettingsContext';

// Comparateur avant / après :
// - les photos sont affichées en entier (aucun recadrage), au format de la photo « avant » ;
// - « avant » à gauche du volet, « après » à droite ;
// - souris, doigt ou stylet (pointer events), clic n'importe où pour placer le volet ;
// - clavier : flèches, Origine / Fin.
const BeforeAfter: React.FC = () => {
  const { settings } = useSiteSettings();
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [ratio, setRatio] = useState(4 / 3);
  const containerRef = useRef<HTMLDivElement>(null);

  const beforeUrl = String(settings.before_image_url);
  const afterUrl = String(settings.after_image_url);

  const moveTo = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const percent = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, percent)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    moveTo(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging) moveTo(e.clientX);
  };

  const stopDragging = () => setDragging(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const next: Record<string, number> = {
      ArrowLeft: position - step,
      ArrowRight: position + step,
      Home: 0,
      End: 100
    };
    if (e.key in next) {
      e.preventDefault();
      setPosition(Math.max(0, Math.min(100, next[e.key])));
    }
  };

  // Le cadre prend le format réel de la photo « avant » (bornée pour rester lisible)
  const handleBeforeLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setRatio(Math.max(0.6, Math.min(2.2, naturalWidth / naturalHeight)));
    }
  };

  const presets = [
    { label: 'Avant', value: 100 },
    { label: '50 / 50', value: 50 },
    { label: 'Après', value: 0 }
  ];

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Avant / Après
          </h2>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Faites glisser le volet pour découvrir la transformation de la moto
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-3 sm:p-6 border border-zinc-800">
          <div
            ref={containerRef}
            className={`relative w-full mx-auto overflow-hidden rounded-xl bg-black select-none touch-pan-y ${
              dragging ? 'cursor-grabbing' : 'cursor-ew-resize'
            }`}
            style={{ aspectRatio: String(ratio), maxHeight: '75vh', maxWidth: `calc(75vh * ${ratio})` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
          >
            {/* Après : couche du dessous, visible à droite du volet */}
            <img
              src={afterUrl}
              alt="La moto après restauration"
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />

            {/* Avant : couche du dessus, découpée à gauche du volet */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
              <img
                src={beforeUrl}
                alt="La moto avant restauration"
                draggable={false}
                onLoad={handleBeforeLoad}
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            </div>

            {/* Étiquettes : chacune s'efface quand son côté est presque masqué */}
            <div
              className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg pointer-events-none transition-opacity"
              style={{ opacity: position > 12 ? 1 : 0 }}
            >
              <span className="text-white font-semibold text-sm tracking-wide">AVANT</span>
              <p className="text-zinc-300 text-xs hidden sm:block">Épave d'origine</p>
            </div>
            <div
              className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg pointer-events-none text-right transition-opacity"
              style={{ opacity: position < 88 ? 1 : 0 }}
            >
              <span className="text-white font-semibold text-sm tracking-wide">APRÈS</span>
              <p className="text-zinc-300 text-xs hidden sm:block">Restaurée</p>
            </div>

            {/* Volet */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)] pointer-events-none"
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            />
            <div
              role="slider"
              tabIndex={0}
              aria-label="Position du volet avant / après"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(position)}
              aria-valuetext={`${Math.round(position)} % de la photo avant`}
              onKeyDown={handleKeyDown}
              className={`absolute top-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-orange-500 border-4 border-white shadow-lg flex items-center justify-center outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ${
                dragging ? 'scale-110' : ''
              } transition-transform`}
              style={{ left: `${position}%`, transform: 'translate(-50%, -50%)' }}
            >
              <ChevronLeft className="h-4 w-4 text-white -mr-1" />
              <ChevronRight className="h-4 w-4 text-white -ml-1" />
            </div>
          </div>

          {/* Raccourcis */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {presets.map(preset => (
              <button
                key={preset.label}
                onClick={() => setPosition(preset.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  Math.round(position) === preset.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-orange-400'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfter;
