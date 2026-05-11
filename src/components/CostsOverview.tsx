import React, { useState, useEffect } from 'react';
import { Euro, Package, TrendingUp, PieChart, Calendar, Award, Info } from 'lucide-react';
import { getPartsCosts, getCostStatistics } from '../lib/supabase';
import { PartCost } from '../types';

const CostsOverview: React.FC = () => {
  const [partsCosts, setPartsCosts] = useState<PartCost[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { value: 'all', label: 'Toutes', color: 'text-orange-400' },
    { value: 'engine', label: 'Moteur', color: 'text-red-400' },
    { value: 'bodywork', label: 'Carrosserie', color: 'text-blue-400' },
    { value: 'electrical', label: 'Électricité', color: 'text-yellow-400' },
    { value: 'wheels', label: 'Roues & Freins', color: 'text-green-400' },
    { value: 'transmission', label: 'Transmission', color: 'text-teal-400' },
    { value: 'suspension', label: 'Suspension', color: 'text-orange-400' },
    { value: 'accessories', label: 'Accessoires', color: 'text-cyan-400' },
    { value: 'tools', label: 'Outils', color: 'text-pink-400' },
    { value: 'labour', label: 'Main d\'oeuvre', color: 'text-amber-400' },
    { value: 'administrative', label: 'Administratif', color: 'text-zinc-400' }
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
    return categories.slice(1).map(category => {
      const categoryParts = partsCosts.filter(part => part.category === category.value);
      const totalCost = categoryParts.reduce((sum, part) => sum + part.price, 0);
      const count = categoryParts.length;
      return {
        ...category,
        count,
        totalCost,
        percentage: statistics.totalCost > 0 ? (totalCost / statistics.totalCost) * 100 : 0
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-500/20 p-3 rounded-lg">
                <Package className="h-6 w-6 text-red-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatPrice(statistics.basePurchaseCost || 0, 'EUR')}
            </div>
            <div className="text-sm text-zinc-400">Achat épave</div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <Euro className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatPrice(statistics.restorationCost || 0, 'EUR')}
            </div>
            <div className="text-sm text-zinc-400">Coût restauration</div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-500/20 p-3 rounded-lg">
                <Euro className="h-6 w-6 text-orange-400" />
              </div>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {formatPrice(statistics.totalCost || 0, 'EUR')}
            </div>
            <div className="text-sm text-zinc-400">Coût total final</div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <Award className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {statistics.totalParts || 0}
            </div>
            <div className="text-sm text-zinc-400">Pièces + épave</div>
          </div>
        </div>

        {/* Investment Breakdown */}
        <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-xl p-8 border border-orange-500/30 mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-orange-400 mb-4">Répartition de l'investissement</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400 mb-2">
                  {formatPrice(statistics.basePurchaseCost || 0, 'EUR')}
                </div>
                <div className="text-zinc-300">Achat de l'épave</div>
                <div className="text-zinc-500 text-sm">Base du projet</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {formatPrice(statistics.restorationCost || 0, 'EUR')}
                </div>
                <div className="text-zinc-300">Coût de restauration</div>
                <div className="text-zinc-500 text-sm">Pièces et main d'œuvre</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  {formatPrice(statistics.totalCost || 0, 'EUR')}
                </div>
                <div className="text-zinc-300">Investissement total</div>
                <div className="text-zinc-500 text-sm">Prix de revient final</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
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
              Pièces et Composants
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
                <p className="text-zinc-400">Aucune pièce dans cette catégorie pour le moment</p>
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
                  Cette restauration vise à redonner à la Bultaco Sherpa 350 de 1976 
                  son état d'origine, en respectant les spécifications constructeur.
                </p>
                <p className="text-zinc-300">
                  Chaque pièce est soigneusement sélectionnée pour préserver 
                  l'authenticité de cette machine légendaire du trial.
                </p>
                <div className="pt-3 border-t border-orange-500/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Début du projet:</span>
                    <span className="text-orange-400">Août 2024</span>
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
                  const count = partsCosts.filter(p => p.condition === condition).length;
                  const percentage = ((cost as number) / (statistics.totalCost || 1)) * 100;
                  
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
