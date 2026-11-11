import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Save, RefreshCw, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { saveSettings } from '../../lib/supabase';
import { useSiteSettings } from '../../contexts/SettingsContext';
import {
  CONTENT_KEYS,
  DEFAULT_PALMARES,
  DEFAULT_TECH_SHEET,
  Palmares,
  SECTION_ICON_LABELS,
  SectionIcon,
  TechSheet
} from '../../lib/siteContent';

const input =
  'w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500';
const iconButton = 'p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

// Déplace un élément d'une liste vers le haut (-1) ou le bas (+1)
const move = <T,>(list: T[], index: number, delta: number): T[] => {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

interface TechSheetEditorProps {
  mode: 'sheet' | 'palmares';
}

// Éditeur de la fiche technique et du palmarès (page publique « Technique »)
const TechSheetEditor: React.FC<TechSheetEditorProps> = ({ mode }) => {
  const { content, reload } = useSiteSettings();
  const [sheet, setSheet] = useState<TechSheet>(() => clone(content.techSheet));
  const [palmares, setPalmares] = useState<Palmares>(() => clone(content.palmares));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setSheet(clone(content.techSheet));
    setPalmares(clone(content.palmares));
  }, [content]);

  const dirty =
    mode === 'sheet'
      ? JSON.stringify(sheet) !== JSON.stringify(content.techSheet)
      : JSON.stringify(palmares) !== JSON.stringify(content.palmares);

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await saveSettings([
        mode === 'sheet'
          ? { key: CONTENT_KEYS.techSheet, value: sheet, category: 'content', description: 'Fiche technique', is_public: true }
          : { key: CONTENT_KEYS.palmares, value: palmares, category: 'content', description: 'Palmarès', is_public: true }
      ]);
      await reload();
      setMessage({ ok: true, text: 'Enregistré : la page Technique est à jour.' });
    } catch (error) {
      setMessage({ ok: false, text: error instanceof Error ? error.message : "Erreur lors de l'enregistrement" });
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = () => {
    if (!confirm('Revenir au contenu d’origine ? Vos modifications non enregistrées seront perdues (rien n’est enregistré tant que vous ne cliquez pas sur Enregistrer).')) return;
    if (mode === 'sheet') setSheet(clone(DEFAULT_TECH_SHEET));
    else setPalmares(clone(DEFAULT_PALMARES));
  };

  const saveBar = (
    <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/95 backdrop-blur border border-zinc-700 rounded-xl px-5 py-3">
      <div className="text-sm">
        {message ? (
          <span className={`flex items-center gap-2 ${message.ok ? 'text-green-400' : 'text-red-400'}`}>
            {message.ok ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message.text}
          </span>
        ) : dirty ? (
          <span className="text-orange-300">Modifications non enregistrées</span>
        ) : (
          <span className="text-zinc-500">Aucune modification</span>
        )}
      </div>
      <div className="flex gap-3">
        <button onClick={restoreDefaults} className="flex items-center gap-2 px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg">
          <RotateCcw className="h-4 w-4" />
          Contenu d'origine
        </button>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-40"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
      </div>
    </div>
  );

  if (mode === 'palmares') {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4 bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <label className="text-sm text-zinc-300">
            Titre de l'encadré
            <input className={`${input} mt-1`} value={palmares.headline} onChange={e => setPalmares({ ...palmares, headline: e.target.value })} />
          </label>
          <label className="text-sm text-zinc-300">
            Sous-titre
            <input className={`${input} mt-1`} value={palmares.subtitle} onChange={e => setPalmares({ ...palmares, subtitle: e.target.value })} />
          </label>
        </div>

        {palmares.entries.map((entry, index) => {
          const update = (field: keyof typeof entry, value: string) =>
            setPalmares({ ...palmares, entries: palmares.entries.map((e, i) => (i === index ? { ...e, [field]: value } : e)) });
          return (
            <div key={index} className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
              <div className="grid sm:grid-cols-[90px_1fr_1fr] gap-3">
                <input className={input} placeholder="Année" value={entry.year} onChange={e => update('year', e.target.value)} />
                <input className={input} placeholder="Titre" value={entry.title} onChange={e => update('title', e.target.value)} />
                <input className={input} placeholder="Pilote" value={entry.rider} onChange={e => update('rider', e.target.value)} />
              </div>
              <div className="flex gap-2 mt-3">
                <input className={input} placeholder="Détail" value={entry.details} onChange={e => update('details', e.target.value)} />
                <button className={iconButton} disabled={index === 0} onClick={() => setPalmares({ ...palmares, entries: move(palmares.entries, index, -1) })} title="Monter">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button className={iconButton} disabled={index === palmares.entries.length - 1} onClick={() => setPalmares({ ...palmares, entries: move(palmares.entries, index, 1) })} title="Descendre">
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button className={`${iconButton} hover:text-red-400`} onClick={() => setPalmares({ ...palmares, entries: palmares.entries.filter((_, i) => i !== index) })} title="Supprimer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setPalmares({ ...palmares, entries: [...palmares.entries, { year: '', title: '', rider: '', details: '' }] })}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm"
        >
          <Plus className="h-4 w-4" />
          Ajouter une année
        </button>
        {saveBar}
      </div>
    );
  }

  const setSection = (index: number, next: TechSheet['sections'][number]) =>
    setSheet({ ...sheet, sections: sheet.sections.map((s, i) => (i === index ? next : s)) });

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500">
        Dans les textes, {'{modele}'}, {'{annee}'} et {'{mise_en_circulation}'} sont remplacés par les valeurs de
        Paramètres → Moto. Une ligne dont la valeur est vide n'est pas affichée.
      </p>

      {/* Identification */}
      <section className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
        <h3 className="font-semibold text-white mb-4">Identification du véhicule</h3>
        <div className="space-y-4">
          {sheet.identification.map((card, index) => {
            const update = (field: keyof typeof card, value: string) =>
              setSheet({ ...sheet, identification: sheet.identification.map((c, i) => (i === index ? { ...c, [field]: value } : c)) });
            return (
              <div key={index} className="bg-zinc-900/50 rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <input className={input} placeholder="Intitulé (ex. Numéro de châssis)" value={card.label} onChange={e => update('label', e.target.value)} />
                  <input className={input} placeholder="Valeur" value={card.value} onChange={e => update('value', e.target.value)} />
                  <button className={`${iconButton} hover:text-red-400`} onClick={() => setSheet({ ...sheet, identification: sheet.identification.filter((_, i) => i !== index) })} title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea className={input} rows={2} placeholder="Explication" value={card.note} onChange={e => update('note', e.target.value)} />
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setSheet({ ...sheet, identification: [...sheet.identification, { label: '', value: '', note: '' }] })}
          className="mt-3 flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
        >
          <Plus className="h-4 w-4" />
          Ajouter une carte
        </button>
      </section>

      {/* Rubriques */}
      {sheet.sections.map((section, sIndex) => (
        <section key={sIndex} className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
              className={`${input} flex-1 min-w-[200px] font-semibold`}
              value={section.title}
              onChange={e => setSection(sIndex, { ...section, title: e.target.value })}
            />
            <select
              className={`${input} w-auto`}
              value={section.icon}
              onChange={e => setSection(sIndex, { ...section, icon: e.target.value as SectionIcon })}
              title="Icône de la rubrique"
            >
              {(Object.keys(SECTION_ICON_LABELS) as SectionIcon[]).map(icon => (
                <option key={icon} value={icon}>Icône : {SECTION_ICON_LABELS[icon]}</option>
              ))}
            </select>
            <button className={iconButton} disabled={sIndex === 0} onClick={() => setSheet({ ...sheet, sections: move(sheet.sections, sIndex, -1) })} title="Monter la rubrique">
              <ChevronUp className="h-4 w-4" />
            </button>
            <button className={iconButton} disabled={sIndex === sheet.sections.length - 1} onClick={() => setSheet({ ...sheet, sections: move(sheet.sections, sIndex, 1) })} title="Descendre la rubrique">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              className={`${iconButton} hover:text-red-400`}
              onClick={() => confirm(`Supprimer la rubrique « ${section.title} » ?`) && setSheet({ ...sheet, sections: sheet.sections.filter((_, i) => i !== sIndex) })}
              title="Supprimer la rubrique"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {section.items.map((row, rIndex) => {
              const update = (field: 'label' | 'value', value: string) =>
                setSection(sIndex, { ...section, items: section.items.map((r, i) => (i === rIndex ? { ...r, [field]: value } : r)) });
              return (
                <div key={rIndex} className="flex gap-2">
                  <input className={`${input} sm:max-w-[40%]`} placeholder="Caractéristique" value={row.label} onChange={e => update('label', e.target.value)} />
                  <input className={input} placeholder="Valeur" value={row.value} onChange={e => update('value', e.target.value)} />
                  <button className={iconButton} disabled={rIndex === 0} onClick={() => setSection(sIndex, { ...section, items: move(section.items, rIndex, -1) })} title="Monter">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button className={iconButton} disabled={rIndex === section.items.length - 1} onClick={() => setSection(sIndex, { ...section, items: move(section.items, rIndex, 1) })} title="Descendre">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button className={`${iconButton} hover:text-red-400`} onClick={() => setSection(sIndex, { ...section, items: section.items.filter((_, i) => i !== rIndex) })} title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setSection(sIndex, { ...section, items: [...section.items, { label: '', value: '' }] })}
            className="mt-3 flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm"
          >
            <Plus className="h-4 w-4" />
            Ajouter une ligne
          </button>
        </section>
      ))}

      <button
        onClick={() => setSheet({ ...sheet, sections: [...sheet.sections, { title: 'Nouvelle rubrique', icon: 'other', items: [] }] })}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm"
      >
        <Plus className="h-4 w-4" />
        Ajouter une rubrique
      </button>

      {saveBar}
    </div>
  );
};

export default TechSheetEditor;
