import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Images, Save, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { saveSettings } from '../../lib/supabase';
import { useSiteSettings } from '../../contexts/SettingsContext';
import { BeforeAfterPair, CONTENT_KEYS } from '../../lib/siteContent';
import ImagePicker from './ImagePicker';

const input =
  'w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500';

// Couples de photos du comparateur avant / après de l'accueil
const BeforeAfterEditor: React.FC = () => {
  const { settings, content, reload } = useSiteSettings();
  const initial = (): BeforeAfterPair[] =>
    content.beforeAfter ?? [
      { title: 'La moto', before: String(settings.before_image_url), after: String(settings.after_image_url) }
    ];
  const [pairs, setPairs] = useState<BeforeAfterPair[]>(initial);
  const [picker, setPicker] = useState<{ index: number; side: 'before' | 'after' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setPairs(initial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.beforeAfter, settings.before_image_url, settings.after_image_url]);

  const dirty = JSON.stringify(pairs) !== JSON.stringify(initial());
  const update = (index: number, patch: Partial<BeforeAfterPair>) =>
    setPairs(pairs.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= pairs.length) return;
    const next = [...pairs];
    [next[index], next[target]] = [next[target], next[index]];
    setPairs(next);
  };

  const save = async () => {
    const complete = pairs.filter(p => p.before && p.after);
    if (complete.length === 0) {
      setMessage({ ok: false, text: 'Il faut au moins un couple avec une photo « avant » et une photo « après ».' });
      return;
    }
    try {
      setSaving(true);
      setMessage(null);
      await saveSettings([
        { key: CONTENT_KEYS.beforeAfter, value: pairs, category: 'content', description: 'Couples avant / après', is_public: true }
      ]);
      await reload();
      setMessage({ ok: true, text: 'Enregistré : l’accueil est à jour.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  const photoSlot = (index: number, side: 'before' | 'after', url: string) => (
    <div className="flex-1 min-w-[140px]">
      <div className="text-xs text-zinc-400 mb-1">{side === 'before' ? 'Avant' : 'Après'}</div>
      <button
        type="button"
        onClick={() => setPicker({ index, side })}
        className="relative w-full h-28 rounded-lg overflow-hidden border border-dashed border-zinc-600 hover:border-orange-500 bg-zinc-900 flex items-center justify-center"
      >
        {url ? (
          <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="flex items-center gap-2 text-sm text-zinc-400">
            <Images className="h-4 w-4" /> Choisir
          </span>
        )}
      </button>
    </div>
  );

  return (
    <section className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
      <h3 className="text-lg font-semibold text-white mb-1">Avant / Après</h3>
      <p className="text-sm text-zinc-500 mb-5">
        Une ou plusieurs comparaisons (moto entière, moteur, réservoir…). Avec plusieurs couples, des onglets
        apparaissent au-dessus du comparateur de l'accueil. Cliquez sur une case pour choisir la photo dans la galerie.
      </p>

      <div className="space-y-4">
        {pairs.map((pair, index) => (
          <div key={index} className="bg-zinc-900/50 rounded-lg p-4">
            <div className="flex gap-2 mb-3">
              <input
                className={input}
                placeholder="Titre de l'onglet (ex. Moteur)"
                value={pair.title}
                onChange={e => update(index, { title: e.target.value })}
              />
              <button className="p-2 text-zinc-400 hover:text-white disabled:opacity-30" disabled={index === 0} onClick={() => move(index, -1)} title="Monter">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button className="p-2 text-zinc-400 hover:text-white disabled:opacity-30" disabled={index === pairs.length - 1} onClick={() => move(index, 1)} title="Descendre">
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                className="p-2 text-zinc-400 hover:text-red-400 disabled:opacity-30"
                disabled={pairs.length === 1}
                onClick={() => setPairs(pairs.filter((_, i) => i !== index))}
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {photoSlot(index, 'before', pair.before)}
              {photoSlot(index, 'after', pair.after)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <button
          onClick={() => setPairs([...pairs, { title: '', before: '', after: '' }])}
          className="flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
        >
          <Plus className="h-4 w-4" />
          Ajouter une comparaison
        </button>
        <div className="flex items-center gap-3">
          {message && (
            <span className={`flex items-center gap-2 text-sm ${message.ok ? 'text-green-400' : 'text-red-400'}`}>
              {message.ok ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {message.text}
            </span>
          )}
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm disabled:opacity-40"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </div>

      {picker && (
        <ImagePicker
          title={`Photo « ${picker.side === 'before' ? 'avant' : 'après'} »`}
          onClose={() => setPicker(null)}
          onSelect={url => {
            update(picker.index, { [picker.side]: url } as Partial<BeforeAfterPair>);
            setPicker(null);
          }}
        />
      )}
    </section>
  );
};

export default BeforeAfterEditor;
