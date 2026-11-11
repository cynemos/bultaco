import React, { useState, useEffect } from 'react';
import { Image, Calendar, Euro, Package, Wrench, FileText, Bike } from 'lucide-react';
import { getPhotos, getTimelineEvents, getTechnicalSpecs, getCostStatistics, CostStatistics } from '../../lib/supabase';
import AdvancedStats from './AdvancedStats';
import { useSiteSettings } from '../../contexts/SettingsContext';

interface Activity {
  action: string;
  item: string;
  date: Date;
  type: 'photo' | 'timeline';
}

const PHOTO_CATEGORY_LABELS: Record<string, string> = {
  engine: 'Moteur',
  bodywork: 'Carrosserie',
  electrical: 'Électricité',
  wheels: 'Roues & Freins',
  restoration: 'Restauration',
  assembly: 'Assemblage',
  testing: 'Tests'
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);

const getRelativeTime = (date: Date) => {
  const diffInHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 1) return "Il y a moins d'1 heure";
  if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  if (diffInDays < 60) {
    const weeks = Math.floor(diffInDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const StatsOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { settings } = useSiteSettings();
  const workHours = Math.max(0, Number(settings.work_hours) || 0);
  const [error, setError] = useState('');
  const [photoCount, setPhotoCount] = useState(0);
  const [specCount, setSpecCount] = useState(0);
  const [events, setEvents] = useState({ completed: 0, inProgress: 0, pending: 0 });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ name: string; count: number; percentage: number }[]>([]);
  const [costStatistics, setCostStatistics] = useState<Partial<CostStatistics>>({});

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [photos, timeline, specs, costStats] = await Promise.all([
        getPhotos(),
        getTimelineEvents(),
        getTechnicalSpecs(),
        getCostStatistics()
      ]);

      const allPhotos = photos || [];
      const allEvents = timeline || [];

      setPhotoCount(allPhotos.length);
      setSpecCount(specs?.length || 0);
      setEvents({
        completed: allEvents.filter(e => e.status === 'completed').length,
        inProgress: allEvents.filter(e => e.status === 'in-progress').length,
        pending: allEvents.filter(e => e.status === 'pending').length
      });

      // Répartition des photos, à partir des catégories réellement utilisées
      const counts: Record<string, number> = {};
      allPhotos.forEach(photo => {
        counts[photo.category] = (counts[photo.category] || 0) + 1;
      });
      setCategoryStats(
        Object.entries(counts)
          .map(([category, count]) => ({
            name: PHOTO_CATEGORY_LABELS[category] || category,
            count,
            percentage: Math.round((count / (allPhotos.length || 1)) * 100)
          }))
          .sort((a, b) => b.count - a.count)
      );

      // Activité récente : tri sur les vraies dates, puis mise en forme
      const activity: Activity[] = [
        ...allPhotos.map(photo => ({
          action: 'Photo ajoutée',
          item: photo.title,
          date: new Date(photo.created_at || photo.date),
          type: 'photo' as const
        })),
        ...allEvents.map(event => ({
          action: event.status === 'completed' ? 'Étape terminée' : 'Étape mise à jour',
          item: event.title,
          date: new Date(event.updated_at || event.created_at || event.date),
          type: 'timeline' as const
        }))
      ];
      activity.sort((a, b) => b.date.getTime() - a.date.getTime());
      setRecentActivity(activity.slice(0, 6));

      setCostStatistics(costStats);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8"><div className="text-zinc-400">Chargement des statistiques...</div></div>;
  }

  const totalEvents = events.completed + events.inProgress + events.pending;
  const progress = totalEvents > 0 ? Math.round((events.completed / totalEvents) * 100) : 0;

  const costCards = [
    { title: 'Achat de la moto', value: costStatistics.purchaseCost, icon: Bike, color: 'text-rose-400', bg: 'bg-rose-500/20' },
    { title: `Pièces (${costStatistics.totalParts || 0})`, value: costStatistics.partsCost, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { title: workHours > 0 ? `Main d'œuvre (+ ≈ ${workHours} h perso)` : "Main d'œuvre", value: costStatistics.labourCost, icon: Wrench, color: 'text-teal-400', bg: 'bg-teal-500/20' },
    { title: 'Administratif', value: costStatistics.administrativeCost, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    { title: 'Prix de revient', value: costStatistics.totalCost, icon: Euro, color: 'text-orange-400', bg: 'bg-orange-500/20' }
  ];

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Aperçu du projet</h2>
        <p className="text-zinc-400">Statistiques et activité récente de la restauration</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border bg-red-500/20 border-red-500/30 text-red-400">{error}</div>
      )}

      {/* Coûts */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {costCards.map(card => (
          <div key={card.title} className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="text-xl font-bold text-white">{formatPrice(card.value || 0)}</div>
            <div className="text-sm text-zinc-400">{card.title}</div>
          </div>
        ))}
      </div>

      {/* Contenu */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <div className="text-3xl font-bold text-green-400 mb-1">{progress}%</div>
          <div className="text-zinc-300 text-sm mb-2">{events.completed}/{totalEvents} étapes terminées</div>
          <div className="w-full bg-zinc-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <div className="text-3xl font-bold text-blue-400 mb-1">{photoCount}</div>
          <div className="text-zinc-300 text-sm">Photos dans la galerie</div>
        </div>
        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <div className="text-3xl font-bold text-orange-400 mb-1">{specCount}</div>
          <div className="text-zinc-300 text-sm">Lignes de détail technique</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Activité récente */}
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <h3 className="text-lg font-semibold text-white mb-6">Activité récente</h3>
          {recentActivity.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">Aucune activité récente</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-zinc-900/50 rounded-lg">
                  <div className={`p-2 rounded-lg ${activity.type === 'photo' ? 'bg-blue-500/20' : 'bg-orange-500/20'}`}>
                    {activity.type === 'photo'
                      ? <Image className="h-4 w-4 text-blue-400" />
                      : <Calendar className="h-4 w-4 text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{activity.action}</div>
                    <div className="text-zinc-400 text-sm truncate">{activity.item}</div>
                  </div>
                  <div className="text-zinc-500 text-xs whitespace-nowrap">{getRelativeTime(activity.date)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Répartition des photos */}
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <h3 className="text-lg font-semibold text-white mb-6">Photos par catégorie</h3>
          {categoryStats.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">Aucune photo pour le moment</p>
          ) : (
            <div className="space-y-4">
              {categoryStats.map(category => (
                <div key={category.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{category.name}</span>
                    <span className="text-zinc-400 text-sm">({category.count})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-zinc-700 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${category.percentage}%` }} />
                    </div>
                    <span className="text-zinc-400 text-sm w-10 text-right">{category.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistiques avancées */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-white mb-6">Statistiques avancées</h2>
        <AdvancedStats statistics={costStatistics} />
      </div>
    </div>
  );
};

export default StatsOverview;
