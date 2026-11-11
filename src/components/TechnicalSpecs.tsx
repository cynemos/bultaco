import React from 'react';
import { Wine as Engine, Gauge, Zap, Settings, Trophy, Calendar, MapPin, Award, Ruler, Wrench } from 'lucide-react';
import { getTechnicalSpecs } from '../lib/supabase';
import { TechnicalSpec } from '../types';
import { useSiteSettings } from '../contexts/SettingsContext';
import { SectionIcon } from '../lib/siteContent';

// Icône et couleur de chaque type de rubrique de la fiche technique
const SECTION_STYLE: Record<SectionIcon, { icon: React.ElementType; tint: string }> = {
  general: { icon: MapPin, tint: 'bg-orange-500/20 text-orange-400' },
  engine: { icon: Engine, tint: 'bg-red-500/20 text-red-400' },
  transmission: { icon: Settings, tint: 'bg-blue-500/20 text-blue-400' },
  chassis: { icon: Gauge, tint: 'bg-green-500/20 text-green-400' },
  dimensions: { icon: Ruler, tint: 'bg-purple-500/20 text-purple-400' },
  electrical: { icon: Zap, tint: 'bg-yellow-500/20 text-yellow-400' },
  other: { icon: Wrench, tint: 'bg-zinc-500/20 text-zinc-300' }
};

const TechnicalSpecs: React.FC = () => {
  const { settings, content, fill } = useSiteSettings();
  const [specs, setSpecs] = React.useState<TechnicalSpec[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadSpecs();
  }, []);

  const loadSpecs = async () => {
    try {
      setLoading(true);
      const data = await getTechnicalSpecs();
      setSpecs(data || []);
    } catch (error) {
      console.error('Error loading technical specs:', error);
    } finally {
      setLoading(false);
    }
  };

  const { identification, sections } = content.techSheet;
  const { headline, subtitle, entries } = content.palmares;

  // Rubriques de la fiche : les lignes dont la valeur est vide après remplacement sont masquées
  const filledSections = sections.map(section => ({
    ...section,
    items: section.items
      .map(item => ({ label: fill(item.label), value: fill(item.value).trim() }))
      .filter(item => item.label && item.value)
  }));
  // La rubrique « Dimensions » s'affiche en pleine largeur, comme avant
  const wideSections = filledSections.filter(s => s.icon === 'dimensions');
  const gridSections = filledSections.filter(s => s.icon !== 'dimensions');

  const heritage = fill(String(settings.tech_heritage_text))
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);

  // Group specs by category for display
  const groupedSpecs = [
    { category: 'Moteur', icon: Engine, items: specs.filter(spec => spec.category === 'engine') },
    { category: 'Électricité', icon: Zap, items: specs.filter(spec => spec.category === 'electrical') },
    { category: 'Carrosserie', icon: Settings, items: specs.filter(spec => spec.category === 'bodywork') },
    { category: 'Performances', icon: Gauge, items: specs.filter(spec => spec.category === 'performance') }
  ].filter(group => group.items.length > 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'restored': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'replaced': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'upgraded': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-zinc-700 text-zinc-400 border-zinc-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'restored': return 'Restauré';
      case 'replaced': return 'Remplacé';
      case 'upgraded': return 'Amélioré';
      default: return 'Original';
    }
  };

  const renderSection = (section: (typeof filledSections)[number], key: number, wide = false) => {
    const style = SECTION_STYLE[section.icon] || SECTION_STYLE.other;
    const Icon = style.icon;
    return (
      <div key={key} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <div className="flex items-center mb-6">
          <div className={`p-3 rounded-lg mr-4 ${style.tint}`}>
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold text-white">{section.title}</h3>
        </div>
        <div className={wide ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-x-6' : 'space-y-3'}>
          {section.items.map((spec, index) => (
            <div key={index} className="flex justify-between items-center gap-4 py-2 border-b border-zinc-800 last:border-b-0">
              <span className="text-zinc-400">{spec.label}</span>
              <span className="text-white font-medium text-right">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Spécifications Techniques
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Caractéristiques techniques détaillées et palmarès de la Bultaco {String(settings.bike_model)}
          </p>
        </div>

        {/* Technical Specifications */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Caractéristiques techniques</h2>

          {identification.length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl p-6 border border-orange-500/30">
                <div className="flex items-center mb-6">
                  <div className="bg-orange-500/20 p-3 rounded-lg mr-4">
                    <Award className="h-6 w-6 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Identification du véhicule</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {identification.map((card, index) => (
                    <div key={index} className="bg-zinc-900/50 rounded-lg p-4">
                      <div className="text-zinc-400 text-sm mb-1">{fill(card.label)}</div>
                      <div className="text-white font-bold text-2xl mb-2">{fill(card.value)}</div>
                      {card.note && (
                        <div className="text-zinc-400 text-sm leading-relaxed">{fill(card.note)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {gridSections.map((section, index) => renderSection(section, index))}
          </div>

          {wideSections.map((section, index) => (
            <div key={index} className="mt-8">
              {renderSection(section, index, true)}
            </div>
          ))}
        </div>

        {/* Palmarès */}
        {entries.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Palmarès en Championnat du Monde</h2>
            <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl p-8 border border-orange-500/30 mb-8">
              <div className="text-center">
                <Trophy className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-orange-400 mb-2">{headline}</h3>
                <p className="text-zinc-300">{subtitle}</p>
              </div>
            </div>

            <div className="grid gap-6">
              {entries.map((achievement, index) => (
                <div key={index} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-orange-500/20 p-3 rounded-lg">
                        <Calendar className="h-6 w-6 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-white">{achievement.year}</h4>
                        <p className="text-orange-400 font-medium">{achievement.title}</p>
                      </div>
                    </div>
                    {achievement.rider && (
                      <div className="flex items-center space-x-2">
                        <Award className="h-5 w-5 text-yellow-400" />
                        <span className="text-white font-semibold">{achievement.rider}</span>
                      </div>
                    )}
                  </div>
                  {achievement.details && <p className="text-zinc-400">{achievement.details}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Restoration */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Détail de la restauration</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-zinc-400">Chargement des spécifications...</div>
            </div>
          ) : groupedSpecs.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {groupedSpecs.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <div key={index} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                    <div className="flex items-center mb-6">
                      <div className="bg-orange-500/20 p-3 rounded-lg mr-4">
                        <IconComponent className="h-6 w-6 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">{section.category}</h3>
                    </div>
                    <div className="space-y-4">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="bg-zinc-800/50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-white">{item.part}</span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                              {getStatusLabel(item.status)}
                            </span>
                          </div>
                          <p className="text-zinc-400 text-sm">{item.action}</p>
                          {item.notes && <p className="text-zinc-500 text-xs mt-2 italic">{item.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-zinc-500">Aucune spécification technique disponible pour le moment</div>
            </div>
          )}
        </div>

        {/* Histoire et Contexte */}
        {heritage.length > 0 && (
          <div className="mt-16 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl p-8 border border-orange-500/30">
            <h3 className="text-2xl font-bold text-center text-orange-400 mb-6">L'Héritage Bultaco</h3>
            <div className="max-w-4xl mx-auto text-center space-y-6">
              {heritage.map((paragraph, index) => (
                <p key={index} className="text-zinc-300 leading-relaxed whitespace-pre-line">{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TechnicalSpecs;
