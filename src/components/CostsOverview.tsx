import React, { useState, useEffect } from 'react';
import { Euro, Package, PieChart, Info, Wrench, FileText, Bike, Clock } from 'lucide-react';
import { getPartsCosts, getCostStatistics, CostStatistics } from '../lib/supabase';
import { COST_CATEGORIES, PURCHASE_CATEGORY } from '../lib/costCategories';
import { useSiteSettings } from '../contexts/SettingsContext';
import BudgetChart from './BudgetChart';
import { formatMonthYear } from '../lib/siteSettings';
import { PartCost } from '../types';

const CostsOverview: React.FC = () => {
  const [partsCosts, setPartsCosts] = useState<PartCost[]>([]);
  const [statistics, setStatistics] = useState<Partial<CostStatistics>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { settings } = useSiteSettings();
  const workHours = Math.max(0, Number(settings.work_hours) || 0);
  const hourlyRate = Math.max(0, Number(settings.work_hourly_rate) || 0);
  const formatHours = (hours: number) => `${new Intl.NumberFormat('fr-FR').format(hours)} h`;

  const categories = [
    { value: 'all', label: 'Toutes', color: 'text-orange-400' },
    ...COST_CATEGORIES
  ];

  const conditions = [
    { value: 'new', label: 'Neuf', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { value: 'used', label: 'Occasion', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { value: 'refurbished', label: 'Reconditionné', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [costsData, statsData] = await Promise.all([
        getPartsCosts(),
        getCostStatistics()
      ]);
      
      setPartsCosts(costsData || []);
      setStatistics(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const getConditionColor = (condition: string) => {
    const conditionOption = conditions.find(c => c.value === condition);
    return conditionOption?.color || 'bg-zinc-700 text-zinc-400 border-zinc-600';
  };

  const filteredParts = partsCosts.filter(part => 
    selectedCategory === 'all' || part.category === selectedCategory
  );

  const getCategoryStats = () => {
    // L'achat de la moto est affiché à part : on le retire de la répartition
    const totalWithoutPurchase = (statistics.totalCost || 0) - (statistics.purchaseCost || 0);
    return COST_CATEGORIES.filter(category => category.value !== PURCHASE_CATEGORY).map(category => {
      const categoryParts = partsCosts.filter(part => part.category === category.value);
      const totalCost = categoryParts.reduce((sum, part) => sum + part.price, 0);
      const count = categoryParts.length;
      return {
        ...category,
        count,
        totalCost,
        percentage: totalWithoutPurchase > 0 ? (totalCost / totalWithoutPurchase) * 100 : 0
      };
    }).filter(cat => cat.count > 0);
  };

  if (loading) {
    return (
      <section className="pt-24 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-zinc-400">Chargement des données de coût...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Coût de la Restauration
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Transparence totale sur l'investissement nécessaire pour redonner vie à cette légende
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Achat de la moto', value: statistics.purchaseCost, icon: Bike, tint: 'bg-rose-500/20 text-rose-400', hint: "Prix d'achat de l'épave" },
            { label: 'Pièces', value: statistics.partsCost, icon: Package, tint: 'bg-blue-500/20 text-blue-400', hint: `${statistics.totalParts || 0} pièces et fournitures` },
            {
              label: "Main d'œuvre",
              value: statistics.labourCost,
              // Travail fait soi-même : on affiche les heures plutôt que 0 €
              display: !statistics.labourCost && workHours > 0 ? `≈ ${formatHours(workHours)}` : undefined,
              icon: Wrench,
              tint: 'bg-teal-500/20 text-teal-400',
              hint: workHours > 0
                ? (statistics.labourCost ? `+ ≈ ${formatHours(workHours)} de travail personnel` : 'Tout fait maison : 0 € dépensé')
                : 'Usinage, prestations'
            },
            { label: 'Administratif', value: statistics.administrativeCost, icon: FileText, tint: 'bg-indigo-500/20 text-indigo-400', hint: 'Assurance, FFVE, carte grise…' }
          ].map(card => (
            <div key={card.label} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className={`inline-flex p-3 rounded-lg mb-4 ${card.tint}`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {'display' in card && card.display ? card.display : formatPrice(card.value || 0, 'EUR')}
              </div>
              <div className="text-sm text-zinc-300">{card.label}</div>
              <div className="text-xs text-zinc-500 mt-1">{card.hint}</div>
            </div>
          ))}
        </div>

        {/* Investment Breakdown */}
        <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl p-8 border border-orange-500/30 mb-12">
          <h2 className="text-2xl font-bold text-orange-400 mb-6 text-center">Répartition de l'investissement</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {formatPrice(statistics.restorationCost || 0, 'EUR')}
              </div>
              <div className="text-zinc-300">Coût de restauration</div>
              <div className="text-zinc-500 text-sm">Pièces + main d'œuvre</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-rose-400 mb-2">
                {formatPrice((statistics.purchaseCost || 0) + (statistics.administrativeCost || 0), 'EUR')}
              </div>
              <div className="text-zinc-300">Achat et administratif</div>
              <div className="text-zinc-500 text-sm">Moto + frais de mise en circulation</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 text-3xl font-bold text-orange-400 mb-2">
                <Euro className="h-7 w-7" />
                {formatPrice(statistics.totalCost || 0, 'EUR')}
              </div>
              <div className="text-zinc-300">Investissement total</div>
              <div className="text-zinc-500 text-sm">Prix de revient final</div>
            </div>
          </div>
        </div>

        {/* Évolution du budget */}
        <BudgetChart points={statistics.budgetEvolution || []} />

        {/* Travail personnel */}
        {workHours > 0 && (
          <div className="bg-zinc-900 rounded-xl p-6 sm:p-8 border border-teal-500/30 mb-12 flex flex-col sm:flex-row items-center gap-6">
            <div className="bg-teal-500/20 p-4 rounded-2xl">
              <Clock className="h-10 w-10 text-teal-400" />
            </div>
            <div className="text-center sm:text-left">
              <div className="text-3xl font-bold text-teal-400">≈ {formatHours(workHours)} de travail</div>
              <p className="text-zinc-300 mt-2">
                Démontage, mécanique, peinture, remontage : toute la main d'œuvre a été réalisée à la maison.
                Ce temps n'apparaît pas dans le prix de revient, mais c'est la vraie richesse de cette restauration.
              </p>
              {hourlyRate > 0 && (
                <p className="text-zinc-500 text-sm mt-2">
                  À titre indicatif, à {formatPrice(hourlyRate, 'EUR')}/h, ce travail représenterait environ{' '}
                  <span className="text-teal-300 font-semibold">{formatPrice(workHours * hourlyRate, 'EUR')}</span>
                  {' '}(non compté dans le total).
                </p>
              )}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories
              .filter(category => category.value === 'all' || partsCosts.some(p => p.category === category.value))
              .map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category.value
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-orange-400'
                }`}
              >
                {category.label}
                {category.value !== 'all' && (
                  <span className="ml-2 text-xs opacity-75">
                    ({partsCosts.filter(p => p.category === category.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Parts List */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6">
              Détail des dépenses
              {selectedCategory !== 'all' && (
                <span className="text-orange-400 ml-2">
                  - {categories.find(c => c.value === selectedCategory)?.label}
                </span>
              )}
            </h2>
            
            <div className="space-y-4">
              {filteredParts.map((part) => (
                <div key={part.id} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 hover:border-orange-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-white font-semibold">{part.part_name}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getConditionColor(part.condition)}`}>
                          {conditions.find(c => c.value === part.condition)?.label}
                        </span>
                        <span className="bg-zinc-700 px-2 py-1 rounded text-xs text-zinc-300">
                          {categories.find(c => c.value === part.category)?.label}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-zinc-500">Prix:</span>
                          <span className="text-orange-400 ml-2 font-semibold">
                            {formatPrice(part.price, part.currency)}
                          </span>
                        </div>
                        {part.supplier && (
                          <div>
                            <span className="text-zinc-500">Fournisseur:</span>
                            <span className="text-zinc-300 ml-2">{part.supplier}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-zinc-500">Date:</span>
                          <span className="text-zinc-300 ml-2">
                            {new Date(part.purchase_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      
                      {part.notes && (
                        <p className="text-zinc-400 text-sm mt-2 italic">{part.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredParts.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">Aucune dépense dans cette catégorie pour le moment</p>
              </div>
            )}
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Cost by Category */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center mb-6">
                <PieChart className="h-6 w-6 text-orange-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">Répartition des coûts</h3>
              </div>
              <div className="space-y-4">
                {getCategoryStats().map((category) => (
                  <div key={category.value} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`text-sm font-medium ${category.color}`}>
                        {category.label}
                      </div>
                      <span className="text-xs text-zinc-500">({category.count})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-16 bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <div className="text-sm text-zinc-400 w-20 text-right">
                        {formatPrice(category.totalCost, 'EUR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Info */}
            <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl p-6 border border-orange-500/30">
              <div className="flex items-center mb-4">
                <Info className="h-6 w-6 text-orange-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">À propos du projet</h3>
              </div>
              <div className="space-y-3 text-sm">
                <p className="text-zinc-300">
                  Cette restauration vise à redonner à la Bultaco {String(settings.bike_model)} de {String(settings.bike_year)}{' '}
                  son état d'origine, en respectant les spécifications constructeur.
                </p>
                <p className="text-zinc-300">
                  Chaque pièce est soigneusement sélectionnée pour préserver 
                  l'authenticité de cette machine légendaire du trial.
                </p>
                <div className="pt-3 border-t border-orange-500/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Début du projet:</span>
                    <span className="text-orange-400">{formatMonthYear(String(settings.project_start_date))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost by Condition */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-6">État des pièces</h3>
              <div className="space-y-4">
                {Object.entries(statistics.costsByCondition || {}).map(([condition, cost]) => {
                  const conditionInfo = conditions.find(c => c.value === condition);
                  const count = statistics.countByCondition?.[condition] || 0;
                  const percentage = ((cost as number) / (statistics.partsCost || 1)) * 100;
                  
                  return (
                    <div key={condition} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${conditionInfo?.color || 'bg-zinc-700 text-zinc-400 border-zinc-600'}`}>
                          {conditionInfo?.label || condition}
                        </span>
                        <span className="text-xs text-zinc-500">({count})</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-16 bg-zinc-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-sm text-zinc-400 w-20 text-right">
                          {formatPrice(cost as number, 'EUR')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CostsOverview;
