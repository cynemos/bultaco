import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Gauge, RefreshCw } from 'lucide-react';
import {
  MAINTENANCE_TYPES,
  MaintenanceEntry,
  MaintenanceInput,
  MaintenanceType,
  deleteMaintenanceEntry,
  getMaintenanceEntries,
  saveMaintenanceEntry
} from '../../lib/tools';
import { formatDateFr, formatEuro } from '../../lib/format';

const input =
  'w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500';

const emptyForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  type: 'entretien' as MaintenanceType,
  title: '',
  description: '',
  mileage: '',
  cost: ''
});

// Admin → Entretien : interventions après restauration (vidange, réglage, sortie…)
const MaintenanceManager: React.FC = () => {
  const [entries, setEntries] = useState<MaintenanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<MaintenanceEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setEntries(await getMaintenanceEntries());
      setError('');
    } catch (err) {
      setError(
        err instanceof Error && /maintenance_entries/.test(err.message)
          ? 'La migration « maintenance_and_documents » n’a pas encore été appliquée dans Supabase.'
          : 'Erreur lors du chargement du carnet.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Kilométrage proposé par défaut : le dernier relevé
  const lastKm = entries.reduce<number | null>((max, e) => (typeof e.mileage === 'number' && (max === null || e.mileage > max) ? e.mileage : max), null);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm(), mileage: lastKm !== null ? String(lastKm) : '' });
    setShowForm(true);
  };

  const openEdit = (entry: MaintenanceEntry) => {
    setEditing(entry);
    setForm({
      date: entry.date,
      type: entry.type,
      title: entry.title,
      description: entry.description || '',
      mileage: entry.mileage != null ? String(entry.mileage) : '',
      cost: entry.cost != null ? String(entry.cost) : ''
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: MaintenanceInput = {
      date: form.date,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      mileage: form.mileage.trim() === '' ? null : Math.round(Number(form.mileage)),
      cost: form.cost.trim() === '' ? null : Number(form.cost.replace(',', '.'))
    };
    try {
      setSaving(true);
      await saveMaintenanceEntry(payload, editing?.id);
      setShowForm(false);
      await load();
    } catch (err) {
      alert(`Erreur lors de l'enregistrement : ${err instanceof Error ? err.message : ''}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entry: MaintenanceEntry) => {
    if (!confirm(`Supprimer « ${entry.title} » du carnet ?`)) return;
    try {
      await deleteMaintenanceEntry(entry.id);
      await load();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Carnet d'entretien</h2>
          <p className="text-zinc-400">Vidanges, réglages, réparations et sorties après la restauration</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
          <Plus className="h-5 w-5" /> Nouvelle intervention
        </button>
      </div>

      {error && <div className="mb-6 p-4 rounded-lg border bg-red-500/20 border-red-500/30 text-red-400">{error}</div>}

      {loading ? (
        <p className="text-zinc-400">Chargement…</p>
      ) : entries.length === 0 && !error ? (
        <p className="text-zinc-500 text-center py-12">Aucune intervention pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const info = MAINTENANCE_TYPES.find(t => t.value === entry.type);
            return (
              <div key={entry.id} className="bg-zinc-800 rounded-xl p-4 border border-zinc-700 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${info?.color}`}>{info?.label}</span>
                    <span className="text-zinc-400">{formatDateFr(entry.date)}</span>
                    {typeof entry.mileage === 'number' && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Gauge className="h-4 w-4" /> {new Intl.NumberFormat('fr-FR').format(entry.mileage)} km
                      </span>
                    )}
                    {entry.cost ? <span className="text-orange-400">{formatEuro(Number(entry.cost))}</span> : null}
                  </div>
                  <div className="text-white font-medium">{entry.title}</div>
                  {entry.description && <p className="text-zinc-400 text-sm mt-1 whitespace-pre-line">{entry.description}</p>}
                </div>
                <button onClick={() => openEdit(entry)} className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg" title="Modifier">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => remove(entry)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg" title="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-zinc-900 rounded-xl p-6 w-full max-w-xl border border-zinc-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">{editing ? "Modifier l'intervention" : 'Nouvelle intervention'}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm text-zinc-300">Date *
                <input type="date" required className={`${input} mt-1`} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </label>
              <label className="text-sm text-zinc-300">Type *
                <select className={`${input} mt-1`} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as MaintenanceType })}>
                  {MAINTENANCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-sm text-zinc-300">Intitulé *
              <input required className={`${input} mt-1`} placeholder="ex. Vidange de boîte, réglage carburation…" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="block text-sm text-zinc-300">Détails
              <textarea rows={3} className={`${input} mt-1`} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm text-zinc-300">Kilométrage
                <input type="number" min={0} className={`${input} mt-1`} value={form.mileage} onChange={e => setForm({ ...form, mileage: e.target.value })} />
              </label>
              <label className="text-sm text-zinc-300">Coût (€)
                <input inputMode="decimal" className={`${input} mt-1`} placeholder="facultatif" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
              </label>
            </div>
            <p className="text-xs text-zinc-500">
              Ce coût concerne la vie de la moto après restauration : il n'entre pas dans le prix de revient de la restauration.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg">Annuler</button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50">
                {saving && <RefreshCw className="h-4 w-4 animate-spin" />} Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MaintenanceManager;
