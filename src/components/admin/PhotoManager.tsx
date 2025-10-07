import React, { useState, useEffect } from 'react';
import { Plus, Upload, X, Edit2, Trash2, Save, Image as ImageIcon } from 'lucide-react';
import { getPhotos, addPhoto, updatePhoto, deletePhoto, uploadImage } from '../../lib/supabase';

interface Photo {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  date: string;
  tags: string[];
  is_before_photo?: boolean;
  is_after_photo?: boolean;
}

const PhotoManager: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'engine',
    date: new Date().toISOString().split('T')[0],
    tags: '',
    file: null as File | null
  });

  const categories = [
    { value: 'engine', label: 'Moteur' },
    { value: 'bodywork', label: 'Carrosserie' },
    { value: 'electrical', label: 'Électricité' },
    { value: 'wheels', label: 'Roues & Freins' },
    { value: 'restoration', label: 'Restauration' },
    { value: 'assembly', label: 'Assemblage' },
    { value: 'testing', label: 'Tests' }
  ];

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await getPhotos();
      setPhotos(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file && !editingPhoto) return;

    try {
      setUploading(true);
      let imageUrl = editingPhoto?.url || '';

      if (formData.file) {
        imageUrl = await uploadImage(formData.file, 'photos');
      }

      const photoData = {
        url: imageUrl,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        date: formData.date,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      if (editingPhoto) {
        await updatePhoto(editingPhoto.id, photoData);
      } else {
        await addPhoto(photoData);
      }

      await loadPhotos();
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la photo');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (photo: Photo) => {
    setEditingPhoto(photo);
    setFormData({
      title: photo.title,
      description: photo.description,
      category: photo.category,
      date: photo.date,
      tags: photo.tags.join(', '),
      file: null
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;

    try {
      await deletePhoto(id);
      await loadPhotos();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la photo');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'engine',
      date: new Date().toISOString().split('T')[0],
      tags: '',
      file: null
    });
    setEditingPhoto(null);
    setShowAddForm(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Gestion des Photos</h2>
          <p className="text-zinc-400">Ajoutez et gérez les photos de la restauration</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Ajouter une photo</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-2xl border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingPhoto ? 'Modifier la photo' : 'Ajouter une photo'}
              </h3>
              <button
                onClick={resetForm}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!editingPhoto && (
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Photo *
                  </label>
                  <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="photo-upload"
                      required={!editingPhoto}
                    />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="h-8 w-8 text-zinc-400" />
                      <span className="text-zinc-400">
                        {formData.file ? formData.file.name : 'Cliquez pour sélectionner une photo'}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
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
                    Catégorie *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
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
                    Tags (séparés par des virgules)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="moteur, restauration, vintage"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
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
                  disabled={uploading}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Sauvegarde...' : editingPhoto ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-zinc-400">Chargement des photos...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div key={photo.id} className="bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700">
              <div className="aspect-w-16 aspect-h-12 relative">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    onClick={() => handleEdit(photo)}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2">{photo.title}</h3>
                <p className="text-zinc-400 text-sm mb-2">{photo.description}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                    {categories.find(cat => cat.value === photo.category)?.label}
                  </span>
                  <span className="text-zinc-500">{photo.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && photos.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 mb-4">Aucune photo ajoutée pour le moment</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Ajouter la première photo
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoManager;