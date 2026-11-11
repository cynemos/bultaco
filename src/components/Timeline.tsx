import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { getTimelineEvents } from '../lib/supabase';
import { TimelineEvent } from '../types';

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
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getTimelineEvents();
      setEvents(data || []);
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
            Suivez chronologiquement chaque étape de la restauration de la Bultaco Sherpa 350
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-orange-400 to-orange-600"></div>

          <div className="space-y-8">
            {events.map((event) => (
              <div key={event.id} className="relative flex items-start">
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

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-700">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm text-zinc-500">
                        {event.status === 'completed' ? 'Terminé' : 
                         event.status === 'in-progress' ? 'En cours' : 'À venir'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
    </section>
  );
};

export default Timeline;