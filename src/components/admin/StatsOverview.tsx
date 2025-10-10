import React, { useState, useEffect } from 'react';
import { Image, Calendar, CheckCircle, Clock, TrendingUp, Users, Euro, Package, Settings } from 'lucide-react';
import { getPhotos, getTimelineEvents, getTechnicalSpecs, getCostStatistics } from '../../lib/supabase';
import AdvancedStats from './AdvancedStats';

const StatsOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalPhotos: 0,
    completedEvents: 0,
    inProgressEvents: 0,
    pendingEvents: 0,
    totalSpecs: 0,
    totalCost: 0,
    basePurchaseCost: 0,
    restorationParts: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [costStatistics, setCostStatistics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [photos, events, specs, costStats] = await Promise.all([
        getPhotos(),
        getTimelineEvents(),
        getTechnicalSpecs(),
        getCostStatistics()
      ]);

      const completedEvents = events?.filter(e => e.status === 'completed').length || 0;
      const inProgressEvents = events?.filter(e => e.status === 'in-progress').length || 0;
      const pendingEvents = events?.filter(e => e.status === 'pending').length || 0;

      // Calculer les statistiques par catégorie de photos
      const categories = ['engine', 'bodywork', 'electrical', 'wheels', 'restoration'];
      const categoryData = categories.map(cat => {
        const count = photos?.filter(p => p.category === cat).length || 0;
        const total = photos?.length || 1;
        return {
          name: getCategoryLabel(cat),
          count,
          percentage: Math.round((count / total) * 100)
        };
      }).filter(cat => cat.count > 0);

      // Générer l'activité récente basée sur les vraies données
      const activity = [];
      
      // Ajouter les photos récentes
      const recentPhotos = photos?.slice(0, 2) || [];
      recentPhotos.forEach(photo => {
        activity.push({
          action: 'Photo ajoutée',
          item: photo.title,
          time: getRelativeTime(photo.created_at || photo.date),
          type: 'photo'
        });
      });

      // Ajouter les événements récents
      const recentEvents = events?.slice(-2) || [];
      recentEvents.forEach(event => {
        activity.push({
          action: event.status === 'completed' ? 'Étape terminée' : 'Étape mise à jour',
          item: event.title,
          time: getRelativeTime(event.created_at || event.date),
          type: 'timeline'
        });
      });

      // Trier par date (plus récent en premier)
      activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      setStats({
        totalPhotos: photos?.length || 0,
        completedEvents,
        inProgressEvents,
        pendingEvents,
        totalSpecs: specs?.length || 0,
        totalCost: costStats.totalCost || 0,
        basePurchaseCost: costStats.basePurchaseCost || 0,
        restorationParts: costStats.totalParts || 0
      });

      setRecentActivity(activity.slice(0, 4));
      setCategoryStats(categoryData);
      setCostStatistics(costStats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      engine: 'Moteur',
      bodywork: 'Carrosserie',
      electrical: 'Électricité',
      wheels: 'Roues & Freins',
      restoration: 'Restauration'
    };
    return labels[category] || category;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'1 heure';
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
  };

  if (loading) {
    return <div className="p-8"><div className="text-zinc-400">Chargement des statistiques...</div></div>;
  }

  const statsCards = [
    {
      title: 'Épave achetée',
      value: `${Math.round(stats.basePurchaseCost || 0)}€`,
      change: `Base du projet`,
      icon: Package,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
    {
      title: 'Photos totales',
      value: stats.totalPhotos.toString(),
      change: `${stats.totalPhotos} photos`,
      icon: Image,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      title: 'Pièces restauration',
      value: (stats.restorationParts || 0).toString(),
      change: `${stats.restorationParts || 0} pièces`,
      icon: Settings,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      title: 'Prix de revient',
      value: `${Math.round(stats.totalCost || 0)}€`,
      change: `Coût total final`,
      icon: Euro,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Aperçu du projet</h2>
        <p className="text-zinc-400">Statistiques et activité récente de la restauration</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${stat.color}`} />
                </div>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-zinc-400 mb-2">{stat.title}</div>
                <div className="text-xs text-green-400">{stat.change}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <h3 className="text-lg font-semibold text-white mb-6">Activité récente</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-zinc-900/50 rounded-lg">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'photo' ? 'bg-blue-500/20' : 'bg-orange-500/20'
                }`}>
                  {activity.type === 'photo' ? (
                    <Image className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Calendar className="h-4 w-4 text-orange-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{activity.action}</div>
                  <div className="text-zinc-400 text-sm">{activity.item}</div>
                </div>
                <div className="text-zinc-500 text-xs">{activity.time}</div>
              </div>
            ))}
          </div>

          {recentActivity.length === 0 && (
            <div className="text-center py-8">
              <p className="text-zinc-500">Aucune activité récente</p>
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <h3 className="text-lg font-semibold text-white mb-6">Répartition par catégorie</h3>
          <div className="space-y-4">
            {categoryStats.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-white font-medium">{category.name}</div>
                  <div className="text-zinc-400 text-sm">({category.count} photos)</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                  <div className="text-zinc-400 text-sm w-8">{category.percentage}%</div>
                </div>
              </div>
            ))}
          </div>

          {categoryStats.length === 0 && (
            <div className="text-center py-8">
              <p className="text-zinc-500">Aucune donnée de catégorie disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="mt-8 bg-zinc-800 rounded-xl p-6 border border-zinc-700">
        <h3 className="text-lg font-semibold text-white mb-6">Progression du projet</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {stats.completedEvents > 0 ? Math.round((stats.completedEvents / (stats.completedEvents + stats.inProgressEvents + stats.pendingEvents)) * 100) : 0}%
            </div>
            <div className="text-zinc-300 mb-2">Progression globale</div>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.completedEvents > 0 ? Math.round((stats.completedEvents / (stats.completedEvents + stats.inProgressEvents + stats.pendingEvents)) * 100) : 0}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {stats.completedEvents}/{stats.completedEvents + stats.inProgressEvents + stats.pendingEvents}
            </div>
            <div className="text-zinc-300 mb-2">Étapes terminées</div>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.completedEvents > 0 ? Math.round((stats.completedEvents / (stats.completedEvents + stats.inProgressEvents + stats.pendingEvents)) * 100) : 0}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalSpecs}</div>
            <div className="text-zinc-300 mb-2">Spécifications techniques</div>
            <div className="text-zinc-500 text-sm">Pièces documentées</div>
          </div>
        </div>
      </div>

      {/* Advanced Statistics */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-6">Statistiques avancées</h2>
        <AdvancedStats statistics={costStatistics} />
      </div>
    </div>
  );
};

export default StatsOverview;