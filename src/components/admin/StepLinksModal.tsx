import React, { useEffect, useMemo, useState } from 'react';
import { X, Image as ImageIcon, Package, RefreshCw, Save, Search } from 'lucide-react';
import { getPhotos, getPartsCosts, setStepLinks } from '../../lib/supabase';
import { Photo, PartCost, TimelineEvent } from '../../types';

interface StepLinksModalProps {
  step: TimelineEvent;
  steps: TimelineEvent[];
  onClose: () => void;
  onSaved: () => void;
}

const DAY = 24 * 60 * 60 * 1000;
const distanceInDays = (a: string, b: string) =>
  Math.abs(new Date(a).getTime() - new Date(b).getTime()) / DAY;

const formatPrice = (price: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);

// Associe des photos de la galerie et des dépenses à une étape de la chronologie.
// Les éléments sont triés par proximité de date avec l'étape pour faciliter le choix.
const StepLinksModal: React.FC<StepLinksModalProps> = ({ step, steps, onClose, onSaved }) => {
  const [tab, setTab] = useState<'photos' | 'costs'>('photos');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [costs, setCosts] = useState<PartCost[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedCosts, setSelectedCosts] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getPhotos(), getPartsCosts()])
      .then(([p, c]) => {
        const allPhotos = (p || []) as Photo[];
        const allCosts = (c || []) as PartCost[];
        setPhotos(allPhotos);
        setCosts(allCosts);
        setSelectedPhotos(allPhotos.filter(x => x.timeline_event_id === step.id).map(x => x.id));
        setSelectedCosts(allCosts.filter(x => x.timeline_event_id === step.id).map(x => x.id));
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [step.id]);

  const stepTitle = (id?: string | null) => steps.find(s => s.id === id)?.title;
  const term = search.trim().toLowerCase();

  const sortedPhotos = useMemo(
    () =>
      photos
        .filter(p => !term || p.title?.toLowerCase().includes(term))
        .sort((a, b) => distanceInDays(a.date, step.date) - distanceInDays(b.date, step.date)),
    [photos, term, step.date]
  );
  const sortedCosts = useMemo(
    () =>
      costs
        .filter(c => c.category !== 'purchase')
        .filter(c => !term || c.part_name.toLowerCase().includes(term) || c.supplier?.toLowerCase().includes(term))
        .sort((a, b) => distanceInDays(a.purchase_date, step.date) - distanceInDays(b.purchase_date, step.date)),
    [costs, term, step.date]
  );

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await setStepLinks(
        'photos',
        step.id,
        selectedPhotos,
        photos.filter(p => p.timeline_event_id === step.id).map(p => p.id)
      );
      await setStepLinks(
        'parts_costs',
        step.id,
        selectedCosts,
        costs.filter(c => c.timeline_event_id === step.id).map(c => c.id)
      );
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error && /timeline_event_id/.test(err.message)
          ? 'La migration « link_photos_costs_to_steps » n’a pas encore été appliquée dans Supabase.'
          : err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      );
    } finally {
      setSaving(false);
    }
  };

  const total = costs.filter(c => selectedCosts.includes(c.id)).reduce((s, c) => s + Number(c.price), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-semibold text-white">Associer à l'étape « {step.title} »</h3>
            <p className="text-sm text-zinc-500">
              {new Date(step.date).toLocaleDateString('fr-FR')} · les éléments les plus proches de cette date sont en premier
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-zinc-800">
          <div className="flex bg-zinc-800 rounded-lg p-1">
            {([
              ['photos', `Photos (${selectedPhotos.length})`, ImageIcon],
              ['costs', `Dépenses (${selectedCosts.length})`, Package]
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
                  tab === id ? 'bg-orange-500 text-white' : 'text-zinc-300 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-orange-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {loading ? (
            <p className="text-zinc-400 text-center py-8">Chargement…</p>
          ) : tab === 'photos' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sortedPhotos.map(photo => {
                const checked = selectedPhotos.includes(photo.id);
                const other = photo.timeline_event_id && photo.timeline_event_id !== step.id ? stepTitle(photo.timeline_event_id) : null;
                return (
                  <label
                    key={photo.id}
                    className={`relative rounded-lg overflow-hidden border-2 cursor-pointer ${
                      checked ? 'border-orange-500' : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(selectedPhotos, setSelectedPhotos, photo.id)}
                      className="absolute top-2 left-2 h-4 w-4 accent-orange-500"
                    />
                    <img src={photo.url} alt="" loading="lazy" className="w-full h-24 object-cover" />
                    <span className="block px-2 pt-1 text-xs text-zinc-200 truncate">{photo.title}</span>
                    <span className="block px-2 pb-1 text-[11px] text-zinc-500 truncate">
                      {photo.date}{other ? ` · déjà dans « ${other} »` : ''}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {sortedCosts.map(cost => {
                const checked = selectedCosts.includes(cost.id);
                const other = cost.timeline_event_id && cost.timeline_event_id !== step.id ? stepTitle(cost.timeline_event_id) : null;
                return (
                  <label
                    key={cost.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer ${
                      checked ? 'bg-orange-500/15' : 'hover:bg-zinc-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(selectedCosts, setSelectedCosts, cost.id)}
                      className="h-4 w-4 accent-orange-500"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-zinc-200 truncate">{cost.part_name}</span>
                      <span className="block text-xs text-zinc-500 truncate">
                        {new Date(cost.purchase_date).toLocaleDateString('fr-FR')}
                        {cost.supplier ? ` · ${cost.supplier}` : ''}
                        {other ? ` · déjà dans « ${other} »` : ''}
                      </span>
                    </span>
                    <span className="text-sm text-zinc-300 whitespace-nowrap">{formatPrice(Number(cost.price))}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-zinc-800">
          <span className="text-sm text-zinc-400">
            {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} · {selectedCosts.length} dépense
            {selectedCosts.length > 1 ? 's' : ''} ({formatPrice(total)})
          </span>
          {error && <span className="text-sm text-red-400 w-full">{error}</span>}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg">
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepLinksModal;
