import React, { useState, useEffect } from 'react';
import { Save, Download, Trash2, Plus, Settings as SettingsIcon, User, Globe, Database, Shield, HardDrive, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { 
  getSettings, 
  updateSetting, 
  addSetting, 
  deleteSetting, 
  exportData,
  getStorageUsage 
} from '../../lib/supabase';
import { Setting } from '../../types';

const SettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState({ totalSize: 0, fileCount: 0, formattedSize: '0 B' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    category: 'general',
    description: '',
    is_public: false
  });

  const categories = [
    { id: 'general', label: 'Général', icon: SettingsIcon, color: 'text-blue-400' },
    { id: 'project', label: 'Projet', icon: Database, color: 'text-green-400' },
    { id: 'bike', label: 'Moto', icon: SettingsIcon, color: 'text-orange-400' },
    { id: 'contact', label: 'Contact', icon: User, color: 'text-purple-400' },
    { id: 'display', label: 'Affichage', icon: Globe, color: 'text-cyan-400' },
    { id: 'features', label: 'Fonctionnalités', icon: Shield, color: 'text-yellow-400' },
    { id: 'system', label: 'Système', icon: HardDrive, color: 'text-red-400' }
  ];

  useEffect(() => {
    loadSettings();
    loadStorageInfo();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      showNotification('error', 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await getStorageUsage();
      setStorageInfo(info);
    } catch (error) {
      console.error('Erreur lors du chargement des informations de stockage:', error);
    }
  };

  const handleUpdateSetting = async (key: string, value: any, description?: string) => {
    try {
      setSaving(key);
      await updateSetting(key, value, description);
      await loadSettings();
      showNotification('success', 'Paramètre mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showNotification('error', 'Erreur lors de la mise à jour du paramètre');
    } finally {
      setSaving(null);
    }
  };

  const handleAddSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addSetting({
        key: newSetting.key,
        value: newSetting.value,
        category: newSetting.category,
        description: newSetting.description,
        is_public: newSetting.is_public
      });
      await loadSettings();
      setShowAddForm(false);
      setNewSetting({ key: '', value: '', category: 'general', description: '', is_public: false });
      showNotification('success', 'Paramètre ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      showNotification('error', 'Erreur lors de l\'ajout du paramètre');
    }
  };

  const handleDeleteSetting = async (id: string, key: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le paramètre "${key}" ?`)) return;

    try {
      await deleteSetting(id);
      await loadSettings();
      showNotification('success', 'Paramètre supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification('error', 'Erreur lors de la suppression du paramètre');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bultaco-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', 'Sauvegarde exportée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      showNotification('error', 'Erreur lors de l\'export des données');
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const parseValue = (value: string) => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const formatValue = (value: any) => {
    if (typeof value === 'string') {
      return value.replace(/^"|"$/g, ''); // Remove quotes for strings
    }
    return String(value);
  };

  const groupedSettings = categories.map(category => ({
    ...category,
    settings: settings.filter(setting => setting.category === category.id)
  }));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Paramètres</h2>
          <p className="text-zinc-400">Configuration et gestion du système</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Ajouter</span>
          </button>
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center space-x-3 ${
          notification.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
          notification.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
          'bg-blue-500/20 border-blue-500/30 text-blue-400'
        }`}>
          {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
          {notification.type === 'error' && <AlertTriangle className="h-5 w-5" />}
          {notification.type === 'info' && <Info className="h-5 w-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* System Info */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <div className="flex items-center mb-4">
            <HardDrive className="h-6 w-6 text-blue-400 mr-3" />
            <h3 className="text-lg font-semibold text-white">Stockage</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">Fichiers:</span>
              <span className="text-white">{storageInfo.fileCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Taille:</span>
              <span className="text-white">{storageInfo.formattedSize}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <div className="flex items-center mb-4">
            <Database className="h-6 w-6 text-green-400 mr-3" />
            <h3 className="text-lg font-semibold text-white">Base de données</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">Paramètres:</span>
              <span className="text-white">{settings.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Statut:</span>
              <span className="text-green-400">Connecté</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <div className="flex items-center mb-4">
            <RefreshCw className="h-6 w-6 text-orange-400 mr-3" />
            <h3 className="text-lg font-semibold text-white">Actions</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={loadSettings}
              className="w-full text-left text-zinc-400 hover:text-white transition-colors"
            >
              Actualiser les paramètres
            </button>
            <button
              onClick={loadStorageInfo}
              className="w-full text-left text-zinc-400 hover:text-white transition-colors"
            >
              Actualiser le stockage
            </button>
          </div>
        </div>
      </div>

      {/* Add Setting Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-2xl border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Ajouter un paramètre</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSetting} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Clé *
                  </label>
                  <input
                    type="text"
                    value={newSetting.key}
                    onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={newSetting.category}
                    onChange={(e) => setNewSetting({ ...newSetting, category: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Valeur *
                </label>
                <input
                  type="text"
                  value={newSetting.value}
                  onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={newSetting.is_public}
                  onChange={(e) => setNewSetting({ ...newSetting, is_public: e.target.checked })}
                  className="mr-3"
                />
                <label htmlFor="is_public" className="text-zinc-300">
                  Paramètre public (visible par tous)
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings by Category */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-zinc-400">Chargement des paramètres...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSettings.map((category) => {
            const IconComponent = category.icon;
            return (
              <div key={category.id} className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                <div className="flex items-center mb-6">
                  <div className="bg-zinc-700 p-3 rounded-lg mr-4">
                    <IconComponent className={`h-6 w-6 ${category.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{category.label}</h3>
                    <p className="text-zinc-400">{category.settings.length} paramètre(s)</p>
                  </div>
                </div>

                {category.settings.length > 0 ? (
                  <div className="space-y-4">
                    {category.settings.map((setting) => (
                      <div key={setting.id} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-white">{setting.key}</h4>
                              {setting.is_public && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                  Public
                                </span>
                              )}
                            </div>
                            {setting.description && (
                              <p className="text-zinc-400 text-sm mb-3">{setting.description}</p>
                            )}
                            <div className="flex items-center space-x-3">
                              <input
                                type="text"
                                value={formatValue(parseValue(setting.value))}
                                onChange={(e) => {
                                  const updatedSettings = settings.map(s => 
                                    s.id === setting.id 
                                      ? { ...s, value: JSON.stringify(e.target.value) }
                                      : s
                                  );
                                  setSettings(updatedSettings);
                                }}
                                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded text-white text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                              />
                              <button
                                onClick={() => handleUpdateSetting(setting.key, formatValue(parseValue(setting.value)), setting.description)}
                                disabled={saving === setting.key}
                                className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded transition-colors disabled:opacity-50"
                              >
                                {saving === setting.key ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteSetting(setting.id, setting.key)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors ml-3"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-zinc-500">Aucun paramètre dans cette catégorie</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SettingsManager;