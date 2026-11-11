import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  Download,
  Trash2,
  HardDrive,
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Undo2,
  Images
} from 'lucide-react';
import { getSettings, saveSettings, deleteSetting, exportData, getStorageUsage } from '../../lib/supabase';
import {
  SETTING_CATEGORIES,
  SETTING_DEFINITIONS,
  PRIVACY_TOGGLES,
  SettingDefinition,
  SettingValues,
  buildSettingValues,
  decodeSettingValue
} from '../../lib/siteSettings';
import { useSiteSettings } from '../../contexts/SettingsContext';
import { Setting } from '../../types';
import ImagePicker from './ImagePicker';
import ExternalImagesPanel from './ExternalImagesPanel';

const inputClass =
  'w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500';

const SettingsManager: React.FC = () => {
  const { reload: reloadSiteSettings } = useSiteSettings();
  const [rows, setRows] = useState<Setting[]>([]);
  const [saved, setSaved] = useState<SettingValues>({});
  const [values, setValues] = useState<SettingValues>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ totalSize: 0, fileCount: 0, formattedSize: '…' });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pickerFor, setPickerFor] = useState<SettingDefinition | null>(null);

  useEffect(() => {
    loadSettings();
    loadStorageInfo();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data: Setting[] = (await getSettings()) || [];
      const built = buildSettingValues(data);
      setRows(data);
      setSaved(built);
      setValues(built);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      showNotification('error', 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    setStorageInfo(info => ({ ...info, formattedSize: '…' }));
    setStorageInfo(await getStorageUsage());
  };

  const changedKeys = useMemo(
    () => SETTING_DEFINITIONS.filter(d => values[d.key] !== saved[d.key]).map(d => d.key),
    [values, saved]
  );

  // Paramètres présents en base mais inconnus du site (anciens essais, fonctions abandonnées)
  const unknownRows = rows.filter(row => !SETTING_DEFINITIONS.some(d => d.key === row.key));

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveSettings(
        SETTING_DEFINITIONS.map(definition => {
          const toggle = PRIVACY_TOGGLES[definition.key];
          return {
            key: definition.key,
            value: values[definition.key],
            category: definition.category,
            description: definition.label,
            // e-mail / téléphone masqués : ils ne sont plus lisibles publiquement
            is_public: toggle ? Boolean(values[toggle]) : true
          };
        })
      );
      await loadSettings();
      await reloadSiteSettings();
      showNotification('success', 'Paramètres enregistrés : le site est à jour.');
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      showNotification('error', "Erreur lors de l'enregistrement des paramètres");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnknown = async (row: Setting) => {
    if (!confirm(`Supprimer le paramètre inutilisé « ${row.key} » ?`)) return;
    try {
      await deleteSetting(row.id);
      await loadSettings();
      showNotification('success', 'Paramètre supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification('error', 'Erreur lors de la suppression du paramètre');
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bultaco-sauvegarde-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'Sauvegarde téléchargée');
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      showNotification('error', "Erreur lors de l'export des données");
    } finally {
      setExporting(false);
    }
  };

  const setValue = (key: string, value: string | number | boolean) =>
    setValues(current => ({ ...current, [key]: value }));

  const renderField = (definition: SettingDefinition) => {
    const value = values[definition.key];
    const id = `setting-${definition.key}`;
    const changed = changedKeys.includes(definition.key);

    if (definition.type === 'boolean') {
      return (
        <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => setValue(definition.key, e.target.checked)}
            className="mt-1 h-4 w-4 accent-orange-500"
          />
          <span>
            <span className={`font-medium ${changed ? 'text-orange-300' : 'text-white'}`}>{definition.label}</span>
            {definition.help && <span className="block text-sm text-zinc-500">{definition.help}</span>}
          </span>
        </label>
      );
    }

    if (definition.type === 'range') {
      const amount = Number(value) || 0;
      const isHeroOverlay = definition.key === 'hero_overlay_opacity';
      return (
        <div>
          <label htmlFor={id} className={`flex justify-between text-sm font-medium mb-1.5 ${changed ? 'text-orange-300' : 'text-zinc-300'}`}>
            <span>{definition.label}{changed && <span className="ml-2 text-xs">(modifié)</span>}</span>
            <span className="text-orange-400">{amount}{definition.unit}</span>
          </label>
          <input
            id={id}
            type="range"
            min={definition.min ?? 0}
            max={definition.max ?? 100}
            step={5}
            value={amount}
            onChange={e => setValue(definition.key, Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          {definition.help && <p className="text-xs text-zinc-500 mt-1">{definition.help}</p>}
          {isHeroOverlay && values.hero_image_url && (
            // Aperçu de l'en-tête de l'accueil avec le voile choisi
            <div className="relative mt-3 h-40 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950">
              <img src={String(values.hero_image_url)} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, rgba(24,24,27,${amount / 100}) 0%, rgba(0,0,0,${Math.min(1, (amount / 100) * 0.85)}) 100%)`
                }}
              />
              <div className="relative h-full flex flex-col items-center justify-center text-center [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
                <span className="text-2xl font-bold text-orange-400">{String(values.site_title)}</span>
                <span className="text-sm text-zinc-200">Aperçu de l'accueil</span>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <label htmlFor={id} className={`block text-sm font-medium mb-1.5 ${changed ? 'text-orange-300' : 'text-zinc-300'}`}>
          {definition.label}
          {changed && <span className="ml-2 text-xs">(modifié)</span>}
        </label>
        {definition.type === 'textarea' ? (
          <textarea
            id={id}
            rows={3}
            value={String(value ?? '')}
            onChange={e => setValue(definition.key, e.target.value)}
            className={inputClass}
          />
        ) : (
          <input
            id={id}
            type={definition.type}
            value={String(value ?? '')}
            min={definition.type === 'number' ? 0 : undefined}
            onChange={e =>
              setValue(definition.key, definition.type === 'number' ? Number(e.target.value) : e.target.value)
            }
            className={inputClass}
          />
        )}
        {definition.help && <p className="text-xs text-zinc-500 mt-1">{definition.help}</p>}
        {definition.type === 'url' && (
          <div className="mt-2 flex flex-wrap items-end gap-3">
            {value && (
              <img
                src={String(value)}
                alt=""
                loading="lazy"
                className="h-24 rounded-lg border border-zinc-700 object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => setPickerFor(definition)}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
            >
              <Images className="h-4 w-4" />
              Choisir dans la galerie
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Paramètres</h2>
          <p className="text-zinc-400">Textes, contact, affichage et maintenance du site public</p>
        </div>
        <button
          onClick={handleExportData}
          disabled={exporting}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Download className="h-5 w-5" />
          <span>{exporting ? 'Export…' : 'Télécharger une sauvegarde'}</span>
        </button>
      </div>

      {notification && (
        <div
          className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            notification.type === 'success'
              ? 'bg-green-500/20 border-green-500/30 text-green-400'
              : 'bg-red-500/20 border-red-500/30 text-red-400'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Infos système */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-white">Stockage des photos</h3>
            </div>
            <button onClick={loadStorageInfo} className="text-zinc-400 hover:text-white" title="Actualiser">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <p className="text-zinc-300">
            {storageInfo.fileCount} fichiers · {storageInfo.formattedSize}
            <span className="text-zinc-500 text-sm"> (offre gratuite Supabase : 1 Go)</span>
          </p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <div className="flex items-center gap-3 mb-3">
            <Database className="h-5 w-5 text-green-400" />
            <h3 className="font-semibold text-white">Sauvegarde</h3>
          </div>
          <p className="text-zinc-400 text-sm">
            Le bouton « Télécharger une sauvegarde » enregistre photos (liens), chronologie, technique, coûts,
            factures et paramètres dans un fichier JSON.
          </p>
        </div>
      </div>

      {/* Images hébergées hors du stockage du site */}
      <ExternalImagesPanel
        onDone={async () => {
          await loadSettings();
          await loadStorageInfo();
          await reloadSiteSettings();
        }}
      />

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Chargement des paramètres...</div>
      ) : (
        <div className="space-y-6">
          {SETTING_CATEGORIES.map(category => (
            <section key={category.id} className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
              <h3 className="text-lg font-semibold text-white mb-5">{category.label}</h3>
              <div className="grid md:grid-cols-2 gap-5">
                {SETTING_DEFINITIONS.filter(d => d.category === category.id).map(definition => (
                  <div
                    key={definition.key}
                    className={['textarea', 'url', 'range'].includes(definition.type) ? 'md:col-span-2' : ''}
                  >
                    {renderField(definition)}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {unknownRows.length > 0 && (
            <section className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700 border-dashed">
              <h3 className="text-lg font-semibold text-white mb-2">Paramètres inutilisés</h3>
              <p className="text-sm text-zinc-500 mb-4">Présents en base mais utilisés nulle part sur le site.</p>
              <div className="space-y-2">
                {unknownRows.map(row => (
                  <div key={row.id} className="flex items-center justify-between gap-3 bg-zinc-900/50 rounded-lg px-4 py-2">
                    <span className="text-zinc-300 text-sm">
                      <span className="font-mono">{row.key}</span>
                      <span className="text-zinc-500"> = {String(decodeSettingValue(row.value))}</span>
                    </span>
                    <button
                      onClick={() => handleDeleteUnknown(row)}
                      className="text-red-400 hover:text-red-300"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {pickerFor && (
        <ImagePicker
          title={pickerFor.label}
          onClose={() => setPickerFor(null)}
          onSelect={url => {
            setValue(pickerFor.key, url);
            setPickerFor(null);
          }}
        />
      )}

      {/* Barre d'enregistrement, visible dès qu'un champ est modifié */}
      {changedKeys.length > 0 && (
        <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/95 backdrop-blur border border-orange-500/40 rounded-xl px-5 py-3 shadow-xl">
          <span className="text-orange-300 text-sm">
            {changedKeys.length} modification{changedKeys.length > 1 ? 's' : ''} non enregistrée{changedKeys.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setValues(saved)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
            >
              <Undo2 className="h-4 w-4" />
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsManager;
