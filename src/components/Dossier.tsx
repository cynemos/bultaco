import React, { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { getCostStatistics, getPartsCosts, getTimelineEvents, CostStatistics } from '../lib/supabase';
import { MaintenanceEntry, SiteDocument, getDocuments, getMaintenanceEntries, MAINTENANCE_TYPES } from '../lib/tools';
import { COST_CATEGORIES } from '../lib/costCategories';
import { useSiteSettings } from '../contexts/SettingsContext';
import { formatDateFr, formatEuro } from '../lib/format';
import { PartCost, TimelineEvent } from '../types';

// Dossier de restauration imprimable (« Imprimer » → « Enregistrer au format PDF »).
// Utile pour l'assurance (valeur agréée), une attestation FFVE ou une revente.
const Dossier: React.FC = () => {
  const { settings, content, fill } = useSiteSettings();
  const [stats, setStats] = useState<CostStatistics | null>(null);
  const [costs, setCosts] = useState<PartCost[]>([]);
  const [steps, setSteps] = useState<TimelineEvent[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceEntry[]>([]);
  const [docs, setDocs] = useState<SiteDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCostStatistics(),
      getPartsCosts(),
      getTimelineEvents(),
      getMaintenanceEntries().catch(() => []),
      getDocuments().catch(() => [])
    ])
      .then(([s, c, t, m, d]) => {
        setStats(s);
        setCosts((c || []) as PartCost[]);
        setSteps(t || []);
        setMaintenance(m);
        setDocs(d.filter(doc => doc.is_public));
      })
      .finally(() => setLoading(false));
  }, []);

  const title = String(settings.site_title);
  const pair = content.beforeAfter?.[0] ?? { before: String(settings.before_image_url), after: String(settings.after_image_url) };
  const general = content.techSheet.sections.find(s => s.icon === 'general');
  const workHours = Number(settings.work_hours) || 0;
  const hourlyRate = Number(settings.work_hourly_rate) || 0;
  const categoryLabel = (value: string) => COST_CATEGORIES.find(c => c.value === value)?.label || value;
  const sortedCosts = [...costs].sort((a, b) => a.purchase_date.localeCompare(b.purchase_date));
  const today = formatDateFr(new Date().toISOString().slice(0, 10));

  if (loading) {
    return <section className="pt-24 pb-16 min-h-screen text-center text-zinc-400">Préparation du dossier…</section>;
  }

  return (
    <section className="pt-24 pb-16 min-h-screen print:p-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 print:max-w-none print:px-0">
        {/* Barre d'action (masquée à l'impression) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-4 mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-300 text-sm">
            Dossier de restauration prêt à imprimer. Pour un PDF : <strong>Imprimer</strong> puis
            « Enregistrer au format PDF ».
          </p>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
          >
            <Printer className="h-4 w-4" /> Imprimer / PDF
          </button>
        </div>

        {/* Le dossier lui-même : fond blanc, typographie sobre, adapté au papier */}
        <article className="bg-white text-zinc-900 rounded-xl p-8 sm:p-12 print:rounded-none print:p-0 text-[13px] leading-relaxed">
          <header className="border-b-2 border-orange-500 pb-4 mb-6">
            <p className="text-xs uppercase tracking-widest text-orange-600 font-semibold">Dossier de restauration</p>
            <h1 className="text-3xl font-bold mt-1">{title}</h1>
            <p className="text-zinc-600">
              Modèle {String(settings.bike_year)}
              {settings.first_registration_date ? ` · 1re mise en circulation le ${formatDateFr(String(settings.first_registration_date))}` : ''}
              {settings.owner_name ? ` · Propriétaire : ${String(settings.owner_name)}` : ''}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Édité le {today} · {window.location.origin}</p>
          </header>

          {/* Identification */}
          <section className="mb-6 break-inside-avoid">
            <h2 className="text-lg font-bold mb-2">Identification</h2>
            <table className="w-full">
              <tbody>
                {content.techSheet.identification.map((card, i) => (
                  <tr key={i} className="border-b border-zinc-200">
                    <td className="py-1.5 pr-4 text-zinc-600 w-1/3">{fill(card.label)}</td>
                    <td className="py-1.5 font-semibold">{fill(card.value)}</td>
                  </tr>
                ))}
                {general?.items
                  .map(item => ({ label: fill(item.label), value: fill(item.value).trim() }))
                  .filter(item => item.value)
                  .map((item, i) => (
                    <tr key={`g${i}`} className="border-b border-zinc-200">
                      <td className="py-1.5 pr-4 text-zinc-600">{item.label}</td>
                      <td className="py-1.5">{item.value}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>

          {/* Avant / après */}
          {pair.before && pair.after && (
            <section className="mb-6 break-inside-avoid">
              <h2 className="text-lg font-bold mb-2">Avant / après</h2>
              <div className="grid grid-cols-2 gap-3">
                {[['Avant', pair.before], ['Après', pair.after]].map(([label, url]) => (
                  <figure key={label}>
                    <img src={url} alt={label} className="w-full h-56 object-cover rounded border border-zinc-200" />
                    <figcaption className="text-xs text-zinc-500 mt-1 text-center">{label}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Chiffres clés */}
          {stats && (
            <section className="mb-6 break-inside-avoid">
              <h2 className="text-lg font-bold mb-2">Investissement</h2>
              <table className="w-full">
                <tbody>
                  {[
                    ['Achat de la moto', stats.purchaseCost],
                    [`Pièces (${stats.totalParts} lignes)`, stats.partsCost],
                    ["Main d'œuvre extérieure", stats.labourCost],
                    ['Administratif', stats.administrativeCost]
                  ].map(([label, value]) => (
                    <tr key={String(label)} className="border-b border-zinc-200">
                      <td className="py-1.5 text-zinc-600">{label}</td>
                      <td className="py-1.5 text-right">{formatEuro(Number(value))}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="py-2">Prix de revient total</td>
                    <td className="py-2 text-right">{formatEuro(stats.totalCost)}</td>
                  </tr>
                </tbody>
              </table>
              {workHours > 0 && (
                <p className="text-zinc-600 mt-2">
                  Travail personnel : environ {workHours} heures
                  {hourlyRate > 0 ? `, soit ${formatEuro(workHours * hourlyRate, 0)} à ${formatEuro(hourlyRate, 0)}/h (non compté dans le prix de revient)` : ''}.
                </p>
              )}
            </section>
          )}

          {/* Étapes */}
          {steps.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold mb-2">Étapes de la restauration ({steps.length})</h2>
              <table className="w-full">
                <tbody>
                  {steps.map(step => (
                    <tr key={step.id} className="border-b border-zinc-200 align-top break-inside-avoid">
                      <td className="py-1.5 pr-3 whitespace-nowrap text-zinc-600">{formatDateFr(step.date, { short: true })}</td>
                      <td className="py-1.5">
                        <span className="font-semibold">{step.title}</span>
                        {step.description && <span className="text-zinc-600"> — {step.description}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Détail des dépenses */}
          {sortedCosts.length > 0 && (
            <section className="mb-6 print:break-before-page">
              <h2 className="text-lg font-bold mb-2">Détail des dépenses ({sortedCosts.length})</h2>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b-2 border-zinc-300 text-left text-zinc-600">
                    <th className="py-1 pr-2 font-medium">Date</th>
                    <th className="py-1 pr-2 font-medium">Désignation</th>
                    <th className="py-1 pr-2 font-medium">Catégorie</th>
                    <th className="py-1 pr-2 font-medium">Fournisseur</th>
                    <th className="py-1 font-medium text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCosts.map(cost => (
                    <tr key={cost.id} className="border-b border-zinc-100 break-inside-avoid">
                      <td className="py-1 pr-2 whitespace-nowrap">{formatDateFr(cost.purchase_date, { short: true })}</td>
                      <td className="py-1 pr-2">{cost.part_name}</td>
                      <td className="py-1 pr-2 text-zinc-600">{categoryLabel(cost.category)}</td>
                      <td className="py-1 pr-2 text-zinc-600">{cost.supplier || ''}</td>
                      <td className="py-1 text-right whitespace-nowrap">{formatEuro(Number(cost.price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Entretien */}
          {maintenance.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold mb-2">Carnet d'entretien</h2>
              <table className="w-full text-[12px]">
                <tbody>
                  {maintenance.map(entry => (
                    <tr key={entry.id} className="border-b border-zinc-100 break-inside-avoid">
                      <td className="py-1 pr-2 whitespace-nowrap">{formatDateFr(entry.date, { short: true })}</td>
                      <td className="py-1 pr-2 text-zinc-600">{MAINTENANCE_TYPES.find(t => t.value === entry.type)?.label}</td>
                      <td className="py-1 pr-2">{entry.title}</td>
                      <td className="py-1 pr-2 text-zinc-600 whitespace-nowrap">
                        {typeof entry.mileage === 'number' ? `${new Intl.NumberFormat('fr-FR').format(entry.mileage)} km` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Documents */}
          {docs.length > 0 && (
            <section className="mb-6 break-inside-avoid">
              <h2 className="text-lg font-bold mb-2">Documents disponibles</h2>
              <ul className="list-disc pl-5">
                {docs.map(doc => <li key={doc.id}>{doc.title}</li>)}
              </ul>
            </section>
          )}

          <footer className="border-t border-zinc-200 pt-3 text-xs text-zinc-500">
            Photos, chronologie détaillée et factures : {window.location.origin}
          </footer>
        </article>
      </div>
    </section>
  );
};

export default Dossier;
