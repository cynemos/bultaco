import React from 'react';
import { Wine as Engine, Gauge, Zap, Settings, Trophy, Calendar, MapPin, Award } from 'lucide-react';
import { getTechnicalSpecs } from '../lib/supabase';
import { TechnicalSpec } from '../types';

const TechnicalSpecs: React.FC = () => {
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

  // Caractéristiques techniques détaillées
  const technicalData = {
    identification: [
      { label: 'Numéro de châssis', value: '18301224' },
      { label: 'Numéro de moteur', value: 'JM-15901843' },
      { label: 'Identification modèle', value: 'Le numéro de châssis permet d\'identifier l\'année et le modèle exact de la moto. Le préfixe "183" correspond à la Sherpa 350T de 1976.' },
      { label: 'Identification moteur', value: 'Le numéro moteur JM indique un moteur Bultaco Trial 350cc. Les numéros de série permettent de vérifier la concordance châssis/moteur.' }
    ],
    general: [
      { label: 'Modèle', value: 'Bultaco Sherpa 350T' },
      { label: 'Année', value: '1976' },
      { label: 'Type', value: 'Trial' },
      { label: 'Pays d\'origine', value: 'Espagne' },
      { label: 'Constructeur', value: 'Bultaco (Bultó)' },
      { label: 'Production', value: '1975-1979' }
    ],
    engine: [
      { label: 'Type moteur', value: 'Monocylindre 2 temps refroidi par air' },
      { label: 'Cylindrée', value: '325 cc' },
      { label: 'Alésage x Course', value: '83 x 60 mm' },
      { label: 'Taux de compression', value: '11.5:1' },
      { label: 'Puissance', value: '22 ch à 6000 tr/min' },
      { label: 'Allumage', value: 'Magneto Motoplat' },
      { label: 'Carburation', value: 'Bing 84' },
      { label: 'Graissage', value: 'Mélange essence-huile 3%' },
      { label: 'Démarrage', value: 'Kick starter' }
    ],
    transmission: [
      { label: 'Boîte de vitesses', value: '5 rapports' },
      { label: 'Embrayage', value: 'Multidisque à bain d\'huile' },
      { label: 'Transmission primaire', value: 'Engrenages droits' },
      { label: 'Transmission secondaire', value: 'Chaîne' }
    ],
    chassis: [
      { label: 'Cadre', value: 'Tube acier soudé, simple berceau' },
      { label: 'Suspension avant', value: 'Fourche télescopique Betor Ø35mm, débattement 160mm' },
      { label: 'Suspension arrière', value: 'Monoamortisseur Betor, débattement 100mm' },
      { label: 'Frein avant', value: 'Tambour Betor 200mm' },
      { label: 'Frein arrière', value: 'Tambour Betor 160mm' },
      { label: 'Jantes', value: 'Akront aluminium' },
      { label: 'Pneu avant', value: '2.75-21"' },
      { label: 'Pneu arrière', value: '4.00-18"' }
    ],
    dimensions: [
      { label: 'Longueur', value: '2050 mm' },
      { label: 'Largeur', value: '830 mm' },
      { label: 'Hauteur de selle', value: '830 mm' },
      { label: 'Empattement', value: '1320 mm' },
      { label: 'Garde au sol', value: '300 mm' },
      { label: 'Poids à sec', value: '88 kg' },
      { label: 'Capacité réservoir', value: '6.5 litres' },
      { label: 'Capacité huile boîte', value: '0.7 litre' }
    ]
  };

  // Palmarès et histoire
  const achievements = [
    {
      year: '1975',
      title: 'Champion du Monde Trial',
      rider: 'Martin Lampkin',
      details: 'Premier titre mondial pour Bultaco en trial'
    },
    {
      year: '1976',
      title: 'Champion du Monde Trial',
      rider: 'Yrjö Vesterinen',
      details: 'Deuxième titre consécutif avec la Sherpa 350T'
    },
    {
      year: '1977',
      title: 'Champion du Monde Trial',
      rider: 'Yrjö Vesterinen',
      details: 'Troisième titre mondial consécutif pour Bultaco'
    },
    {
      year: '1978',
      title: 'Champion du Monde Trial',
      rider: 'Yrjö Vesterinen',
      details: 'Troisième titre consécutif pour Vesterinen'
    },
    {
      year: '1979',
      title: 'Champion du Monde Trial',
      rider: 'Bernie Schreiber',
      details: 'Cinquième titre consécutif pour Bultaco'
    }
  ];

  // Group specs by category for display
  const groupedSpecs = [
    {
      category: 'Moteur',
      icon: Engine,
      items: specs.filter(spec => spec.category === 'engine')
    },
    {
      category: 'Électricité',
      icon: Zap,
      items: specs.filter(spec => spec.category === 'electrical')
    },
    {
      category: 'Carrosserie',
      icon: Settings,
      items: specs.filter(spec => spec.category === 'bodywork')
    },
    {
      category: 'Performances',
      icon: Gauge,
      items: specs.filter(spec => spec.category === 'performance')
    }
  ].filter(group => group.items.length > 0); // Only show categories with specs

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

  return (
    <section className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Spécifications Techniques
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Caractéristiques techniques détaillées et palmarès de la Bultaco Sherpa 350T
          </p>
        </div>

        {/* Technical Specifications */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Caractéristiques techniques</h2>

          {/* Identification Section - Full Width */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl p-6 border border-orange-500/30">
              <div className="flex items-center mb-6">
                <div className="bg-orange-500/20 p-3 rounded-lg mr-4">
                  <Award className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Identification du véhicule</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="text-zinc-400 text-sm mb-1">Numéro de châssis</div>
                  <div className="text-white font-bold text-2xl mb-2">18301224</div>
                  <div className="text-zinc-400 text-sm leading-relaxed">
                    Le numéro de châssis permet d'identifier l'année et le modèle exact de la moto.
                    Le préfixe "183" correspond à la Sherpa 350T de 1976.
                  </div>
                </div>
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <div className="text-zinc-400 text-sm mb-1">Numéro de moteur</div>
                  <div className="text-white font-bold text-2xl mb-2">JM-15901843</div>
                  <div className="text-zinc-400 text-sm leading-relaxed">
                    Le numéro moteur JM indique un moteur Bultaco Trial 350cc.
                    Les numéros de série permettent de vérifier la concordance châssis/moteur.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Général */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center mb-6">
                <div className="bg-orange-500/20 p-3 rounded-lg mr-4">
                  <MapPin className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Informations générales</h3>
              </div>
              <div className="space-y-3">
                {technicalData.general.map((spec, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-b-0">
                    <span className="text-zinc-400">{spec.label}</span>
                    <span className="text-white font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Moteur */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center mb-6">
                <div className="bg-red-500/20 p-3 rounded-lg mr-4">
                  <Engine className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Moteur</h3>
              </div>
              <div className="space-y-3">
                {technicalData.engine.map((spec, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-b-0">
                    <span className="text-zinc-400">{spec.label}</span>
                    <span className="text-white font-medium text-right">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transmission */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center mb-6">
                <div className="bg-blue-500/20 p-3 rounded-lg mr-4">
                  <Settings className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Transmission</h3>
              </div>
              <div className="space-y-3">
                {technicalData.transmission.map((spec, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-b-0">
                    <span className="text-zinc-400">{spec.label}</span>
                    <span className="text-white font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Châssis */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center mb-6">
                <div className="bg-green-500/20 p-3 rounded-lg mr-4">
                  <Gauge className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Châssis & Suspensions</h3>
              </div>
              <div className="space-y-3">
                {technicalData.chassis.map((spec, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-b-0">
                    <span className="text-zinc-400">{spec.label}</span>
                    <span className="text-white font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dimensions */}
          <div className="mt-8">
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center mb-6">
                <div className="bg-purple-500/20 p-3 rounded-lg mr-4">
                  <Gauge className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Dimensions & Poids</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {technicalData.dimensions.map((spec, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-b-0">
                    <span className="text-zinc-400">{spec.label}</span>
                    <span className="text-white font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Palmarès */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Palmarès en Championnat du Monde</h2>
          <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl p-8 border border-orange-500/30 mb-8">
            <div className="text-center mb-6">
              <Trophy className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-orange-400 mb-2">5 Titres Mondiaux Consécutifs</h3>
              <p className="text-zinc-300">La Bultaco Sherpa 350T a dominé le trial mondial de 1975 à 1979</p>
            </div>
          </div>

          <div className="grid gap-6">
            {achievements.map((achievement, index) => (
              <div key={index} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-orange-500/20 p-3 rounded-lg">
                      <Calendar className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-white">{achievement.year}</h4>
                      <p className="text-orange-400 font-medium">{achievement.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <Award className="h-5 w-5 text-yellow-400" />
                      <span className="text-white font-semibold">{achievement.rider}</span>
                    </div>
                  </div>
                </div>
                <p className="text-zinc-400">{achievement.details}</p>
              </div>
            ))}
          </div>
        </div>

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
                        {item.notes && (
                          <p className="text-zinc-500 text-xs mt-2 italic">{item.notes}</p>
                        )}
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
        <div className="mt-16 bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl p-8 border border-orange-500/30">
          <h3 className="text-2xl font-bold text-center text-orange-400 mb-6">L'Héritage Bultaco</h3>
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-zinc-300 leading-relaxed mb-6">
              La Bultaco Sherpa 350T de 1976 représente l'apogée de l'ingénierie espagnole en matière de trial. 
              Conçue par Francisco Xavier "Paco" Bultó, cette machine révolutionnaire a redéfini les standards 
              du trial mondial grâce à son moteur 2 temps performant et son châssis ultra-léger.
            </p>
            <p className="text-zinc-300 leading-relaxed">
              Avec ses 4 titres mondiaux consécutifs, la Sherpa 350T reste l'une des motos de trial les plus 
              titrées de l'histoire. Sa restauration à l'identique permet de préserver ce patrimoine mécanique 
              exceptionnel et de perpétuer la légende Bultaco.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnicalSpecs;