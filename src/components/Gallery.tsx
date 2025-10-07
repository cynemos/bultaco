import React, { useState } from 'react';
import { Search, Filter, ZoomIn } from 'lucide-react';
import { getPhotos } from '../lib/supabase';

const Gallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load photos on component mount
  React.useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await getPhotos();
      setPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'Tout', count: 24 },
    { id: 'engine', label: 'Moteur', count: 8 },
    { id: 'bodywork', label: 'Carrosserie', count: 6 },
    { id: 'electrical', label: 'Électricité', count: 4 },
    { id: 'wheels', label: 'Roues & Freins', count: 3 },
    { id: 'restoration', label: 'Restauration', count: 3 }
  ];

  const filteredImages = photos.filter(image => {
    const matchesCategory = selectedCategory === 'all' || image.category === selectedCategory;
    const matchesSearch = image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         image.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Update category counts based on actual photos
  const updatedCategories = categories.map(cat => ({
    ...cat,
    count: cat.id === 'all' ? photos.length : photos.filter(p => p.category === cat.id).length
  }));
  return (
    <section className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Galerie Photos
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Découvrez chaque étape de la restauration à travers une collection détaillée de photos
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Rechercher dans les photos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-zinc-400" />
              <div className="flex flex-wrap gap-2">
                {updatedCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-orange-400'
                    }`}
                  >
                    {category.label} ({category.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="text-zinc-400">Chargement des photos...</div>
          </div>
        )}
        {/* Image Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="group relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10"
            >
              <div className="aspect-w-16 aspect-h-12 relative overflow-hidden">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <button
                  onClick={() => setSelectedImage(image.url)}
                  className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-orange-500"
                >
                  <ZoomIn className="h-5 w-5 text-white" />
                </button>
              </div>
              
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {updatedCategories.find(cat => cat.id === image.category)?.label}
                  </span>
                  <span className="text-sm text-zinc-500">{image.date}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{image.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{image.description}</p>
              </div>
            </div>
          ))}
          </div>
        )}

        {!loading && filteredImages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-zinc-500 mb-4">
              <p>Aucune photo trouvée</p>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-5xl max-h-full">
              <img
                src={selectedImage}
                alt="Photo agrandie"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm p-2 rounded-lg text-white hover:bg-orange-500 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;