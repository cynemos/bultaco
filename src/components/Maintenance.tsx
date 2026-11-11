import React, { useEffect, useState } from 'react';
import { Gauge, Calendar, Wrench, Euro, Bike } from 'lucide-react';
import { MAINTENANCE_TYPES, MaintenanceEntry, getMaintenanceEntries } from '../lib/tools';
import { formatDateFr, formatEuro } from '../lib/format';
import { useSiteSettings } from '../contexts/SettingsContext';

const formatKm = (km: number) => `${new Intl.NumberFormat('fr-FR').format(km)} km`;

// Page publique « Carnet d'entretien » : la vie de la moto après la restauration
const Maintenance: React.FC = () => {
  const { settings } = useSiteSettings();
  const [entries, setEntries] = useState<MaintenanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMaintenanceEntries()
      .then(setEntries)
      .catch(err => {
        console.error('Erreur lors du chargement du carnet:', err);
        setError("Le carnet d'entretien n'est pas encore disponible.");
      })
      .finally(() => setLoading(false));
  }, []);

  const typeInfo = (type: string) => MAINTENANCE_TYPES.find(t => t.value === type) || MAINTENANCE_TYPES[MAINTENANCE_TYPES.length - 1];
  const withKm = entries.filter(e => typeof e.mileage === 'number');
  const lastKm = withKm.length ? Math.max(...withKm.map(e => e.mileage as number)) : null;
  const totalCost = entries.reduce((sum, e) => sum + (Number(e.cost) || 0), 0);
  const rides = entries.filter(e => e.type === 'sortie').length;

  const byYear = entries.reduce<Record<string, MaintenanceEntry[]>>((acc, entry) => {
    const year = entry.date.slice(0, 4);
    (acc[year] ||= []).push(entry);
    return acc;
  }, {});
  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

  const stats = [
    { label: 'Kilométrage relevé', value: lastKm !== null ? formatKm(lastKm) : '—', icon: Gauge },
    { label: 'Dernière intervention', value: entries[0] ? formatDateFr(entries[0].date) : '—', icon: Calendar },
    { label: 'Sorties notées', value: String(rides), icon: Bike },
    { label: "Coût de l'entretien", value: formatEuro(totalCost), icon: Euro }
  ];

  return (
    <section className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Carnet d'entretien
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            La vie de la {String(settings.bike_model)} après sa restauration : entretiens, réglages et sorties
          </p>
        </div>

        {loading ? (
          <p className="text-center text-zinc-400">Chargement du carnet…</p>
        ) : error ? (
          <p className="text-center text-zinc-500">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <Icon className="h-5 w-5 text-orange-400 mb-3" />
                  <div className="text-xl font-bold text-white">{value}</div>
                  <div className="text-sm text-zinc-400">{label}</div>
                </div>
              ))}
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900 rounded-xl border border-zinc-800">
                <Wrench className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">Aucune intervention notée pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {years.map(year => (
                  <div key={year}>
                    <h2 className="text-2xl font-bold text-white mb-4">{year}</h2>
                    <div className="space-y-3">
                      {byYear[year].map(entry => {
                        const info = typeInfo(entry.type);
                        return (
                          <article key={entry.id} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${info.color}`}>{info.label}</span>
                              <span className="text-sm text-zinc-400">{formatDateFr(entry.date)}</span>
                              {typeof entry.mileage === 'number' && (
                                <span className="flex items-center gap-1 text-sm text-zinc-400">
                                  <Gauge className="h-4 w-4" /> {formatKm(entry.mileage)}
                                </span>
                              )}
                              {entry.cost ? <span className="ml-auto text-sm text-orange-400">{formatEuro(Number(entry.cost))}</span> : null}
                            </div>
                            <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                            {entry.description && <p className="text-zinc-400 mt-1 whitespace-pre-line">{entry.description}</p>}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Maintenance;
