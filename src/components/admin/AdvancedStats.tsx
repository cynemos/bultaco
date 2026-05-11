import React from 'react';
import { TrendingUp, Package, PieChart, BarChart3, DollarSign } from 'lucide-react';

interface AdvancedStatsProps {
  statistics: any;
}

const AdvancedStats: React.FC<AdvancedStatsProps> = ({ statistics }) => {
  const categories = [
    { value: 'engine', label: 'Moteur', color: 'text-red-400' },
    { value: 'bodywork', label: 'Carrosserie', color: 'text-blue-400' },
    { value: 'electrical', label: 'Électricité', color: 'text-yellow-400' },
    { value: 'wheels', label: 'Roues & Freins', color: 'text-green-400' },
    { value: 'transmission', label: 'Transmission', color: 'text-teal-400' },
    { value: 'suspension', label: 'Suspension', color: 'text-orange-400' },
    { value: 'accessories', label: 'Accessoires', color: 'text-cyan-400' },
    { value: 'tools', label: 'Outils', color: 'text-pink-400' },
    { value: 'labour', label: 'Main d\'oeuvre', color: 'text-amber-400' }
  ];

  const formatPrice = (price: number, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const maxCumulative = statistics.budgetEvolution && statistics.budgetEvolution.length > 0
    ? Math.max(...statistics.budgetEvolution.map((e: any) => e.cumulative))
    : 1;

  return (
    <div className="space-y-8">
      {/* Average Cost by Category */}
      <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
        <div className="flex items-center mb-6">
          <DollarSign className="h-5 w-5 text-green-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Coût moyen par catégorie</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(statistics.averageCostByCategory || {}).map(([category, avgCost]) => {
            const categoryInfo = categories.find(c => c.value === category);
            const count = statistics.countByCondition ?
              Object.values(statistics.costsByCategory || {}).length : 0;
            return (
              <div key={category} className="bg-zinc-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${categoryInfo?.color || 'text-zinc-400'}`}>
                    {categoryInfo?.label || category}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {statistics.costsByCategory && statistics.costsByCategory[category]
                      ? `(${Object.keys(statistics.costsByCategory).filter(k => k === category).length} pièce${Object.keys(statistics.costsByCategory).filter(k => k === category).length > 1 ? 's' : ''})`
                      : ''}
                  </span>
                </div>
                <div className="text-xl font-bold text-white">
                  {formatPrice(avgCost as number)}
                </div>
                <div className="text-xs text-zinc-400 mt-1">Moyenne par pièce</div>
              </div>
            );
          })}
        </div>
        {Object.keys(statistics.averageCostByCategory || {}).length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            Aucune donnée disponible
          </div>
        )}
      </div>

      {/* New vs Used Ratio */}
      <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
        <div className="flex items-center mb-6">
          <PieChart className="h-5 w-5 text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Ratio Pièces Neuves / Occasion</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-white font-medium">Pièces neuves</span>
              </div>
              <span className="text-2xl font-bold text-green-400">
                {statistics.newToUsedRatio?.new || 0}%
              </span>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="text-sm text-zinc-400">Nombre de pièces</div>
              <div className="text-xl font-bold text-white">
                {statistics.newToUsedRatio?.newCount || 0}
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-white font-medium">Pièces d'occasion</span>
              </div>
              <span className="text-2xl font-bold text-orange-400">
                {statistics.newToUsedRatio?.used || 0}%
              </span>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="text-sm text-zinc-400">Nombre de pièces</div>
              <div className="text-xl font-bold text-white">
                {statistics.newToUsedRatio?.usedCount || 0}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="w-full bg-zinc-700 rounded-full h-4 overflow-hidden flex">
            <div
              className="bg-green-500 h-4 transition-all duration-300"
              style={{ width: `${statistics.newToUsedRatio?.new || 0}%` }}
            ></div>
            <div
              className="bg-orange-500 h-4 transition-all duration-300"
              style={{ width: `${statistics.newToUsedRatio?.used || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Budget Evolution Chart */}
      <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
        <div className="flex items-center mb-6">
          <TrendingUp className="h-5 w-5 text-purple-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Évolution du budget</h3>
        </div>
        <div className="space-y-6">
          {/* Chart */}
          <div className="relative h-64 bg-zinc-900/50 rounded-lg p-4">
            <div className="absolute inset-0 flex items-end p-4 space-x-1">
              {statistics.budgetEvolution && statistics.budgetEvolution.length > 0 ? (
                statistics.budgetEvolution.map((item: any, index: number) => {
                  const heightPercentage = (item.cumulative / maxCumulative) * 100;
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t hover:from-orange-600 hover:to-orange-500 transition-all cursor-pointer group relative"
                      style={{ height: `${heightPercentage}%` }}
                      title={`${item.part_name}: ${formatPrice(item.amount)} - Total: ${formatPrice(item.cumulative)}`}
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-zinc-950 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        <div className="font-semibold">{item.part_name}</div>
                        <div>{formatPrice(item.amount)}</div>
                        <div className="text-zinc-400">Total: {formatPrice(item.cumulative)}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                  Aucune donnée d'évolution
                </div>
              )}
            </div>
          </div>

          {/* Legend & Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-zinc-400">Total dépensé</span>
              </div>
              <div className="text-xl font-bold text-white">
                {formatPrice(statistics.restorationCost || 0)}
              </div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-zinc-400">Nombre d'achats</span>
              </div>
              <div className="text-xl font-bold text-white">
                {statistics.budgetEvolution?.length || 0}
              </div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-sm text-zinc-400">Dépense moyenne</span>
              </div>
              <div className="text-xl font-bold text-white">
                {statistics.budgetEvolution?.length > 0
                  ? formatPrice(statistics.restorationCost / statistics.budgetEvolution.length)
                  : formatPrice(0)}
              </div>
            </div>
          </div>

          {/* Recent Purchases Timeline */}
          {statistics.budgetEvolution && statistics.budgetEvolution.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-zinc-400 mb-4">Derniers achats</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[...statistics.budgetEvolution].reverse().slice(0, 10).map((item: any, index: number) => {
                  const categoryInfo = categories.find(c => c.value === item.category);
                  return (
                    <div key={index} className="flex items-center justify-between bg-zinc-900/50 rounded-lg p-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="text-xs text-zinc-500 w-16">{formatDate(item.date)}</div>
                        <div className={`text-xs ${categoryInfo?.color || 'text-zinc-400'}`}>
                          {categoryInfo?.label || item.category}
                        </div>
                        <div className="text-sm text-white truncate">{item.part_name}</div>
                      </div>
                      <div className="text-sm font-semibold text-orange-400 ml-4">
                        {formatPrice(item.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedStats;
