import React, { useEffect } from 'react';
import { Wrench } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSiteSettings } from './contexts/SettingsContext';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import Gallery from './components/Gallery';
import BeforeAfter from './components/BeforeAfter';
import Timeline from './components/Timeline';
import TechnicalSpecs from './components/TechnicalSpecs';
import CostsOverview from './components/CostsOverview';
import Footer from './components/Footer';
import { SECTION_PATHS, SECTION_TITLES, navigate, useRoute } from './lib/router';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { section, goTo } = useRoute();
  const activeSection = section;
  const showAdmin = section === 'admin';
  const setShowAdmin = (open: boolean) => navigate(open ? SECTION_PATHS.admin : SECTION_PATHS.home);
  const { settings, reload: reloadSettings } = useSiteSettings();

  // Titre de l'onglet selon la page
  useEffect(() => {
    const site = String(settings.site_title);
    document.title = section === 'home' ? `${site} — Restauration` : `${SECTION_TITLES[section]} — ${site}`;
  }, [section, settings.site_title]);

  // Une fois connecté, l'admin lit aussi les paramètres non publics
  useEffect(() => {
    if (!loading) reloadSettings();
  }, [user?.id, loading, reloadSettings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  // Mode admin demandé : tableau de bord si connecté, sinon page de connexion.
  // Un admin connecté peut revenir sur le site public avec « Voir le site ».
  if (showAdmin) {
    return user
      ? <AdminDashboard onViewSite={() => setShowAdmin(false)} />
      : <AdminLogin onCancel={() => setShowAdmin(false)} />;
  }

  // Mode maintenance : les visiteurs voient une page d'attente, l'admin garde l'accès
  if (settings.maintenance_mode && !user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-2xl mb-6">
          <Wrench className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-orange-400 mb-4">{String(settings.site_title)}</h1>
        <p className="text-zinc-300 max-w-xl whitespace-pre-line">{String(settings.maintenance_message)}</p>
        <button
          onClick={() => setShowAdmin(true)}
          className="mt-10 text-sm text-zinc-600 hover:text-zinc-400"
        >
          Admin
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {settings.maintenance_mode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-orange-500 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          Mode maintenance actif : les visiteurs voient la page d'attente
        </div>
      )}
      <Header
        activeSection={activeSection}
        onAdminClick={() => setShowAdmin(true)}
      />
      
      {activeSection === 'home' && (
        <>
          <HeroSection
            onDiscover={() => goTo('timeline')}
          />
          <div className="py-16">
            <BeforeAfter />
          </div>
        </>
      )}

      {activeSection === 'gallery' && <Gallery />}
      {activeSection === 'timeline' && <Timeline />}
      {activeSection === 'technical' && <TechnicalSpecs />}
      {activeSection === 'costs' && <CostsOverview />}

      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;