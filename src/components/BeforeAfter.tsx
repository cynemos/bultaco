import React, { useState, useRef } from 'react';
import { ArrowLeftRight } from 'lucide-react';

const BeforeAfter: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateSliderPosition(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateSliderPosition(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.touches[0]);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      updateSliderPosition(e.touches[0]);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const updateSliderPosition = (event: React.MouseEvent | Touch) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Avant / Après
          </h2>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Glissez le curseur pour découvrir la transformation spectaculaire de la Sherpa
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div
            ref={containerRef}
            className="relative w-full h-96 md:h-[500px] overflow-hidden rounded-xl cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Before Image */}
            <div className="absolute inset-0">
              <img
                src="https://i.servimg.com/u/f28/12/40/02/10/trial-13.jpg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop"
                alt="Avant restauration"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-white font-semibold">AVANT</span>
                <p className="text-zinc-300 text-sm">État d'origine - Épave</p>
              </div>
            </div>

            {/* After Image */}
            <div
              className="absolute inset-0 transition-all duration-75"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src="https://i28.servimg.com/u/f28/12/40/02/10/motojo10.jpg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop"
                alt="Après restauration"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="text-white font-semibold">APRÈS</span>
                <p className="text-zinc-300 text-sm">Restaurée - Comme neuve</p>
              </div>
            </div>

            {/* Slider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-orange-500 z-10 transition-all duration-75"
              style={{ left: `${sliderPosition}%` }}
            >
              {/* Slider Handle */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-orange-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                <ArrowLeftRight className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-4 bg-zinc-800 px-6 py-3 rounded-lg">
              <span className="text-zinc-400">Glissez pour comparer</span>
              <div className="w-32 bg-zinc-700 rounded-full h-2 relative">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-75"
                  style={{ width: `${sliderPosition}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfter;