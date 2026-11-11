import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Cog, Clock } from 'lucide-react';
import { useSiteSettings } from '../contexts/SettingsContext';

const HeroSection: React.FC = () => {
  const { settings } = useSiteSettings();
  const year = String(settings.bike_year);
  const model = String(settings.bike_model);
  const workHours = Math.max(0, Number(settings.work_hours) || 0);
  const heroImage = String(settings.hero_image_url || '');
  const overlay = Math.max(0, Math.min(95, Number(settings.hero_overlay_opacity) || 0)) / 100;
  const [imageError, setImageError] = useState(false);
  useEffect(() => setImageError(false), [heroImage]);
  const registration = settings.first_registration_date
    ? new Date(String(settings.first_registration_date)).toLocaleDateString('fr-FR')
    : '';
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Image de fond + voile réglable (Admin → Paramètres → Affichage) */}
      <div className="absolute inset-0 z-0 bg-zinc-950">
        {heroImage && !imageError && (
          <img
            src={heroImage}
            alt=""
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        )}
        <div
          className="absolute inset-0 z-10"
          style={{
            background: `linear-gradient(135deg, rgba(24,24,27,${overlay}) 0%, rgba(0,0,0,${Math.min(1, overlay * 0.85)}) 100%)`
          }}
        />
      </div>

      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
            {String(settings.site_title)}
          </h1>
          <p className="text-2xl md:text-3xl text-zinc-300 font-light mb-8">
            Renaissance d'une légende de {year}
          </p>
        </div>

        <div className={`grid sm:grid-cols-2 gap-8 mb-12 ${workHours > 0 ? 'lg:grid-cols-4' : 'md:grid-cols-3'}`}>
          <div className="bg-zinc-900/60 backdrop-blur-sm p-6 rounded-xl border border-orange-500/20">
            <Calendar className="h-8 w-8 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Année modèle</h3>
            <p className="text-zinc-400">{year} - Modèle authentique</p>
            {registration && (
              <p className="text-zinc-500 text-sm mt-1">1re mise en circulation : {registration}</p>
            )}
          </div>
          
          <div className="bg-zinc-900/60 backdrop-blur-sm p-6 rounded-xl border border-orange-500/20">
            <MapPin className="h-8 w-8 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Origine</h3>
            <p className="text-zinc-400">Bultaco, Espagne</p>
          </div>
          
          <div className="bg-zinc-900/60 backdrop-blur-sm p-6 rounded-xl border border-orange-500/20">
            <Cog className="h-8 w-8 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">État initial</h3>
            <p className="text-zinc-400">Épave - Moteur bloqué</p>
          </div>

          {workHours > 0 && (
            <div className="bg-zinc-900/60 backdrop-blur-sm p-6 rounded-xl border border-orange-500/20">
              <Clock className="h-8 w-8 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Travail</h3>
              <p className="text-zinc-400">≈ {new Intl.NumberFormat('fr-FR').format(workHours)} heures</p>
              <p className="text-zinc-500 text-sm mt-1">100 % fait maison</p>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-orange-400">Le Projet</h2>
          <p className="text-lg text-zinc-300 leading-relaxed mb-8">
            Cette Bultaco {model} de {year}, icône du trial espagnol, était à l'abandon depuis des décennies. 
            Moteur grippé, carrosserie rouillée, électricité défaillante... Un défi de taille pour redonner vie 
            à cette machine légendaire qui a marqué l'histoire du trial mondial.
          </p>
          <p className="text-lg text-zinc-300 leading-relaxed">
            Suivez chaque étape de cette restauration méticuleuse : du démontage complet à la remise en route, 
            en passant par la réfection du moteur, la restauration de la carrosserie et la modernisation 
            discrète de certains composants pour allier authenticité et fiabilité.
          </p>
        </div>

        <div className="mt-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-3 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
            <span>Découvrir la restauration</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="animate-bounce">
          <div className="w-1 h-16 bg-gradient-to-b from-orange-500 to-transparent rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;