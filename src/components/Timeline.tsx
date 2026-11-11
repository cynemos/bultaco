import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, Circle, AlertCircle, Link2, Check, Package, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTimelineEvents, getPhotos, getPartsCosts } from '../lib/supabase';
import { TimelineEvent, Photo, PartCost } from '../types';
import { stepSlug } from '../lib/slug';
import { useRoute } from '../lib/router';
import { useSiteSettings } from '../contexts/SettingsContext';

const getYouTubeEmbedUrl = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
};

const Timeline: React.FC = () => {
  const { settings } = useSiteSettings();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [photosByStep, setPhotosByStep] = useState<Record<string, Photo[]>>({});
  const [costsByStep, setCostsByStep] = useState<Record<string, PartCost[]>>({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ photos: Photo[]; index: number } | null>(null);
  const { hash } = useRoute();

  useEffect(() => {
    loadEvents();
  }, []);

  // Lien direct vers une étape (/chronologie#2025-09-04-reservoir) : on y descend
  useEffect(() => {
    if (!hash || loading) return;
    const target = document.getElementById(hash);
    if (!target) return;
    // Saut direct (le défilement « doux » est ignoré par certains navigateurs à l'arrivée sur la page).
    // Les photos des étapes précédentes finissent de charger après le saut et décalent la page :
    // on se recale quelques fois, et on arrête dès que le visiteur fait défiler lui-même.
    let stopped = false;
    const stop = () => { stopped = true; };
    window.addEventListener('wheel', stop, { passive: true, once: true });
    window.addEventListener('touchstart', stop, { passive: true, once: true });
    window.addEventListener('keydown', stop, { once: true });
    const timers = [100, 600, 1200, 2000, 3000].map(delay =>
      setTimeout(() => {
        if (!stopped) target.scrollIntoView({ block: 'start' });
      }, delay)
    );
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('keydown', stop);
    };
  }, [hash, loading]);

  const copyStepLink = async (slug: string) => {
    const url = `${window.location.origin}/chronologie#${slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Lien de cette étape :', url);
    }
    window.history.replaceState(null, '', `/chronologie#${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const [data, photos, costs] = await Promise.all([
        getTimelineEvents(),
        getPhotos().catch(() => []),
        getPartsCosts().catch(() => [])
      ]);
      setEvents(data || []);
      // Photos et dépenses rattachées à chaque étape (Admin → Chronologie → Associer)
      const group = <T extends { timeline_event_id?: string | null }>(items: T[]) =>
        items.reduce<Record<string, T[]>>((acc, item) => {
          if (item.timeline_event_id) (acc[item.timeline_event_id] ||= []).push(item);
          return acc;
        }, {});
      setPhotosByStep(group((photos || []) as Photo[]));
      setCostsByStep(group((costs || []) as PartCost[]));
    } catch (error) {
      console.error('Error loading timeline events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'in-progress':
        return <AlertCircle className="h-6 w-6 text-orange-500" />;
      case 'pending':
        return <Circle className="h-6 w-6 text-zinc-400" />;
      default:
        return <Circle className="h-6 w-6 text-zinc-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-500/10';
      case 'in-progress':
        return 'border-orange-500 bg-orange-500/10';
      case 'pending':
        return 'border-zinc-600 bg-zinc-800/50';
      default:
        return 'border-zinc-600 bg-zinc-800/50';
    }
  };

  if (loading) {
    return (
      <section className="pt-24 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-zinc-400">Chargement de la timeline...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Timeline de Restauration
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Suivez chronologiquement chaque étape de la restauration de la Bultaco {String(settings.bike_model)}
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-orange-400 to-orange-600"></div>

          <div className="space-y-8">
            {events.map((event) => {
              const slug = stepSlug(event);
              const stepPhotos = photosByStep[event.id] || [];
              const stepCosts = costsByStep[event.id] || [];
              const stepTotal = stepCosts.reduce((sum, cost) => sum + Number(cost.price), 0);
              return (
              <div key={event.id} id={slug} className="relative flex items-start scroll-mt-28">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border-2 border-orange-500">
                  {getStatusIcon(event.status)}
                </div>

                {/* Event content */}
                <div className={`ml-8 flex-1 p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 ${getStatusColor(event.status)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-orange-400" />
                      <span className="text-orange-400 font-medium">{event.date}</span>
                    </div>
                    {event.category && (
                      <span className="px-3 py-1 text-xs font-medium bg-zinc-700 text-zinc-300 rounded-full">
                        {event.category}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3">{event.title}</h3>
                  
                  {event.description && (
                    <p className="text-zinc-400 leading-relaxed mb-4">{event.description}</p>
                  )}

                  {event.image_url && (
                    <div className="mt-4">
                      <img loading="lazy" decoding="async"
                        src={event.image_url}
                        alt={event.title}
                        className="w-full max-w-md rounded-lg border border-zinc-700"
                      />
                    </div>
                  )}

                  {event.video_url && getYouTubeEmbedUrl(event.video_url) && (
                    <div className="mt-4 w-full max-w-md">
                      <div className="relative w-full rounded-lg overflow-hidden border border-zinc-700" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          src={getYouTubeEmbedUrl(event.video_url) ?? undefined}
                          title={event.title}
                          className="absolute top-0 left-0 w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  {stepPhotos.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm text-zinc-400 mb-2">Photos de l'étape ({stepPhotos.length})</div>
                      <div className="flex flex-wrap gap-2">
                        {stepPhotos.map((photo, index) => (
                          <button
                            key={photo.id}
                            onClick={() => setViewer({ photos: stepPhotos, index })}
                            className="rounded-lg overflow-hidden border border-zinc-700 hover:border-orange-500 focus:border-orange-500 outline-none"
                            title={photo.title}
                          >
                            <img src={photo.url} alt={photo.title} loading="lazy" className="h-20 w-28 object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {stepCosts.length > 0 && (
                    <details className="mt-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                      <summary className="flex items-center justify-between gap-3 px-4 py-2 cursor-pointer text-sm">
                        <span className="flex items-center gap-2 text-zinc-300">
                          <Package className="h-4 w-4 text-orange-400" />
                          {stepCosts.length} pièce{stepCosts.length > 1 ? 's' : ''} et dépense{stepCosts.length > 1 ? 's' : ''}
                        </span>
                        <span className="text-orange-400 font-semibold">{formatPrice(stepTotal)}</span>
                      </summary>
                      <ul className="px-4 pb-3 space-y-1">
                        {stepCosts.map(cost => (
                          <li key={cost.id} className="flex justify-between gap-3 text-sm">
                            <span className="text-zinc-400">{cost.part_name}{cost.supplier ? ` · ${cost.supplier}` : ''}</span>
                            <span className="text-zinc-300 whitespace-nowrap">{formatPrice(Number(cost.price))}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-700">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm text-zinc-500">
                        {event.status === 'completed' ? 'Terminé' :
                         event.status === 'in-progress' ? 'En cours' : 'À venir'}
                      </span>
                    </div>
                    <button
                      onClick={() => copyStepLink(slug)}
                      className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-orange-400 transition-colors"
                      title="Copier le lien de cette étape"
                    >
                      {copied === slug ? <Check className="h-4 w-4 text-green-400" /> : <Link2 className="h-4 w-4" />}
                      {copied === slug ? 'Lien copié' : 'Lien'}
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {events.length === 0 && (
            <div className="text-center py-12">
              <div className="text-zinc-500 mb-4">
                <p>Aucun événement dans la timeline pour le moment</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewer(null)}
        >
          <figure className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={viewer.photos[viewer.index].url}
              alt={viewer.photos[viewer.index].title}
              className="max-h-[80vh] w-full object-contain rounded-lg"
            />
            <figcaption className="text-center text-zinc-300 mt-3">
              {viewer.photos[viewer.index].title}
              <span className="text-zinc-500"> · {viewer.index + 1}/{viewer.photos.length}</span>
            </figcaption>
            <button
              onClick={() => setViewer(null)}
              className="absolute top-2 right-2 bg-black/60 p-2 rounded-lg text-white hover:bg-orange-500"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            {viewer.photos.length > 1 && (
              <>
                <button
                  onClick={() => setViewer({ ...viewer, index: (viewer.index - 1 + viewer.photos.length) % viewer.photos.length })}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white hover:bg-orange-500"
                  aria-label="Photo précédente"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setViewer({ ...viewer, index: (viewer.index + 1) % viewer.photos.length })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white hover:bg-orange-500"
                  aria-label="Photo suivante"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </figure>
        </div>
      )}
    </section>
  );
};

export default Timeline;