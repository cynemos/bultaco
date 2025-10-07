import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Settings, Wrench, Zap, Gauge } from 'lucide-react';
import { getTechnicalSpecs, addTechnicalSpec, updateTechnicalSpec, deleteTechnicalSpec } from '../../lib/supabase';
import { TechnicalSpec } from '../../types';

const TechnicalSpecsManager: React.FC = () => {
  const [specs, setSpecs] = useState<TechnicalSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSpec, setEditingSpec] = useState<TechnicalSpec | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    category: 'engine' as 'engine' | 'electrical' | 'bodywork' | 'performance',
    part: '',
    original_spec: '',
    restored_spec: '',
    action: '',
    status: 'restored' as 'restored' | 'replaced' | 'upgraded',
    notes: ''
  });

  const categories = [
    { value: 'engine', label: 'Moteur', icon: Wrench },
    { value: 'electrical', label: 'Électricité', icon: Zap },
    { value: 'bodywork', label: 'Carrosserie', icon: Settings },
    { value: 'performance', label: 'Performances', icon: Gauge }
  ];

  const statusOptions = [
    { value: 'restored', label: 'Restauré', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { value: 'replaced', label: 'Remplacé', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { value: 'upgraded', label: 'Amélioré', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
  ];

  useEffect(() => {
    loadSpecs();
  }, []);

  const loadSpecs = async () => {
    try {
      setLoading(true);
      const data = await getTechnicalSpecs();
      setSpecs(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des spécifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const specData = {
        category: formData.category,
        part: formData.part,
        original_spec: formData.original_spec || undefined,
        restored_spec: formData.restored_spec || undefined,
        action: formData.action,
        status: formData.status,
        notes: formData.notes || undefined
      };

      if (editingSpec) {
        await updateTechnicalSpec(editingSpec.id, specData);
      } else {
        await addTechnicalSpec(specData);
      }

      await loadSpecs();
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la spécification');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (spec: TechnicalSpec) => {
    setEditingSpec(spec);
    setFormData({
      category: spec.category,
      part: spec.part,
      original_spec: spec.original_spec || '',
      restored_spec: spec.restored_spec || '',
      action: spec.action,
      status: spec.status,
      notes: spec.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette spécification ?')) return;

    try {
      await deleteTechnicalSpec(id);
      await loadSpecs();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la spécification');
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'engine',
      part: '',
      original_spec: '',
      restored_spec: '',
      action: '',
      status: 'restored',
      notes: ''
    });
    setEditingSpec(null);
    setShowAddForm(false);
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'bg-zinc-700 text-zinc-400 border-zinc-600';
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    if (!cat) return Settings;
    return cat.icon;
  };

  const groupedSpecs = categories.map(category => ({
    ...category,
    specs: specs.filter(spec => spec.category === category.value)
  }));

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Gestion des Spécifications Techniques</h2>
          <p className="text-zinc-400">Gérez les détails techniques de la restauration</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Ajouter une spécification</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingSpec ? 'Modifier la spécification' : 'Ajouter une spécification'}
              </h3>
              <button
                onClick={resetForm}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Statut *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    required
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Pièce/Composant *
                </label>
                <input
                  type="text"
                  value={formData.part}
                  onChange={(e) => setFormData({ ...formData, part: e.target.value })}
                  placeholder="Ex: Cylindre, Carburateur, Faisceau électrique..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Action effectuée *
                </label>
                <input
                  type="text"
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                  placeholder="Ex: Alésé +0.5mm, Refait intégralement, Neuf haute performance..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Spécification d'origine
                  </label>
                  <input
                    type="text"
                    value={formData.original_spec}
                    onChange={(e) => setFormData({ ...formData, original_spec: e.target.value })}
                    placeholder="Ex: 349cc, 32ch, Magneto CEV..."
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Spécification après restauration
                  </label>
                  <input
                    type="text"
                    value={formData.restored_spec}
                    onChange={(e) => setFormData({ ...formData, restored_spec: e.target.value })}
                    placeholder="Ex: 349cc, 35ch, Électronique Motoplat..."
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Notes additionnelles
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Détails supplémentaires, références pièces, observations..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Sauvegarde...' : editingSpec ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specs List by Category */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-zinc-400">Chargement des spécifications...</div>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSpecs.map((category) => {
            const IconComponent = category.icon;
            return (
              <div key={category.value} className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                <div className="flex items-center mb-6">
                  <div className="bg-orange-500/20 p-3 rounded-lg mr-4">
                    <IconComponent className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{category.label}</h3>
                    <p className="text-zinc-400">{category.specs.length} spécification(s)</p>
                  </div>
                </div>
                
                {category.specs.length > 0 ? (
                  <div className="space-y-4">
                    {category.specs.map((spec) => (
                      <div key={spec.id} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-white">{spec.part}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(spec.status)}`}>
                                {statusOptions.find(opt => opt.value === spec.status)?.label}
                              </span>
                            </div>
                            <p className="text-zinc-300 text-sm mb-2">{spec.action}</p>
                            
                            {(spec.original_spec || spec.restored_spec) && (
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                {spec.original_spec && (
                                  <div>
                                    <span className="text-zinc-500">Origine:</span>
                                    <span className="text-zinc-300 ml-2">{spec.original_spec}</span>
                                  </div>
                                )}
                                {spec.restored_spec && (
                                  <div>
                                    <span className="text-zinc-500">Restauré:</span>
                                    <span className="text-orange-400 ml-2">{spec.restored_spec}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {spec.notes && (
                              <p className="text-zinc-400 text-sm mt-2 italic">{spec.notes}</p>
                            )}
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleEdit(spec)}
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(spec.id)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-zinc-500">Aucune spécification pour cette catégorie</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && specs.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 mb-4">Aucune spécification technique ajoutée</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Ajouter la première spécification
          </button>
        </div>
      )}
    </div>
  );
};

export default TechnicalSpecsManager;