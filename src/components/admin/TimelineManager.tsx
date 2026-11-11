import React, { useState, useEffect } from 'react';
import { formatDateFr } from '../../lib/format';
import { Plus, CreditCard as Edit2, Trash2, X, Calendar, Clock, CheckCircle, Circle, AlertCircle, Upload, Youtube, Link2 } from 'lucide-react';
import { getTimelineEvents, addTimelineEvent, updateTimelineEvent, deleteTimelineEvent, uploadImage, removeImageByUrl } from '../../lib/supabase';
import { TimelineEvent } from '../../types';
import StepLinksModal from './StepLinksModal';


const TimelineManager: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [linkingStep, setLinkingStep] = useState<TimelineEvent | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as 'completed' | 'in-progress' | 'pending',
    category: '',
    image_url: '',
    video_url: ''
  });

  const statusOptions = [
    { value: 'pending', label: 'À venir', icon: Circle, color: 'text-zinc-400' },
    { value: 'in-progress', label: 'En cours', icon: AlertCircle, color: 'text-orange-400' },
    { value: 'completed', label: 'Terminé', icon: CheckCircle, color: 'text-green-400' }
  ];

  const categories = [
    'Acquisition',
    'Démontage',
    'Moteur',
    'Carrosserie',
    'Électricité',
    'Roues & Freins',
    'Assemblage',
    'Tests',
    'Finition'
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getTimelineEvents();
      setEvents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setFormData({ ...formData, image_url: '' });
      } else {
        alert('Veuillez sélectionner une image');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      let imageUrl = formData.image_url;

      if (selectedFile) {
        setUploading(true);
        imageUrl = await uploadImage(selectedFile, 'timeline');
        setUploading(false);
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        status: formData.status,
        category: formData.category,
        image_url: imageUrl || null,
        video_url: formData.video_url.trim() || null
      };

      if (editingEvent) {
        await updateTimelineEvent(editingEvent.id, eventData);
        // Image remplacée ou retirée : on supprime l'ancien fichier du stockage
        if (editingEvent.image_url && editingEvent.image_url !== imageUrl) {
          await removeImageByUrl(editingEvent.image_url);
        }
      } else {
        await addTimelineEvent({
          ...eventData,
          image_url: eventData.image_url || undefined,
          video_url: eventData.video_url || undefined
        });
      }

      await loadEvents();
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de l\'événement');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      status: event.status,
      category: event.category,
      image_url: event.image_url || '',
      video_url: event.video_url || ''
    });
    setSelectedFile(null);
    setPreviewUrl(event.image_url || '');
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      await deleteTimelineEvent(id);
      await loadEvents();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'événement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      category: '',
      image_url: '',
      video_url: ''
    });
    setEditingEvent(null);
    setShowAddForm(false);
    setSelectedFile(null);
    setPreviewUrl('');
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    if (!statusOption) return <Circle className="h-5 w-5 text-zinc-400" />;
    
    const IconComponent = statusOption.icon;
    return <IconComponent className={`h-5 w-5 ${statusOption.color}`} />;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Gestion de la Timeline</h2>
          <p className="text-zinc-400">Ajoutez et gérez les étapes de la restauration</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Ajouter une étape</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-2xl border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingEvent ? 'Modifier l\'étape' : 'Ajouter une étape'}
              </h3>
              <button
                onClick={resetForm}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    required
                  />
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

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Image (optionnel)
                </label>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:border-orange-500 hover:text-orange-400 transition-colors">
                        <Upload className="h-5 w-5" />
                        <span>{selectedFile ? selectedFile.name : 'Télécharger une image'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>

                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          if (previewUrl.startsWith('blob:')) {
                            URL.revokeObjectURL(previewUrl);
                          }
                          setPreviewUrl('');
                        }}
                        className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {!selectedFile && (
                    <>
                      <div className="text-center text-zinc-500 text-sm">ou</div>
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        disabled={!!selectedFile}
                      />
                    </>
                  )}

                  {previewUrl && (
                    <div className="mt-4">
                      <img loading="lazy" decoding="async"
                        src={previewUrl}
                        alt="Aperçu"
                        className="w-full max-w-md rounded-lg border border-zinc-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Vidéo YouTube (optionnel)
                </label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 h-5 w-5" />
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Collez le lien d'une vidéo de votre chaîne YouTube. Elle sera intégrée dans l'étape de la timeline.
                </p>
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
                  disabled={saving || uploading}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Téléchargement...' : saving ? 'Sauvegarde...' : editingEvent ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-zinc-400">Chargement des événements...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(event.status)}
                  <div>
                    <h3 className="text-white font-semibold text-lg">{event.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-zinc-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateFr(event.date)}</span>
                      </span>
                      {event.category && (
                        <span className="bg-zinc-700 px-2 py-1 rounded text-xs">
                          {event.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setLinkingStep(event)}
                    className="flex items-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                    title="Associer des photos et des dépenses à cette étape"
                  >
                    <Link2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Associer</span>
                  </button>
                  <button
                    onClick={() => handleEdit(event)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {event.description && (
                <p className="text-zinc-300 mb-4">{event.description}</p>
              )}
              
              {event.image_url && (
                <div className="mt-4">
                  <img loading="lazy" decoding="async"
                    src={event.image_url}
                    alt={event.title}
                    className="w-full max-w-md rounded-lg border border-zinc-600"
                  />
                </div>
              )}

              {event.video_url && (
                <div className="mt-4 flex items-center space-x-2 text-sm text-red-400">
                  <Youtube className="h-4 w-4" />
                  <span>Vidéo YouTube associée</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 mb-4">Aucune étape ajoutée pour le moment</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Ajouter la première étape
          </button>
        </div>
      )}

      {linkingStep && (
        <StepLinksModal
          step={linkingStep}
          steps={events}
          onClose={() => setLinkingStep(null)}
          onSaved={() => setLinkingStep(null)}
        />
      )}
    </div>
  );
};

export default TimelineManager;