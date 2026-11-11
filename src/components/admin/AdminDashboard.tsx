import React, { useState } from 'react';
import { LogOut, Image, Calendar, Settings, BarChart3, Wrench, Euro, ExternalLink, Gauge, FolderOpen, Printer } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PhotoManager from './PhotoManager';
import TimelineManager from './TimelineManager';
import TechnicalAdmin from './TechnicalAdmin';
import SettingsManager from './SettingsManager';
import StatsOverview from './StatsOverview';
import CostsManager from './CostsManager';
import MaintenanceManager from './MaintenanceManager';
import DocumentsManager from './DocumentsManager';
import { SECTION_PATHS } from '../../lib/router';

const TABS = [
  { id: 'stats', label: 'Aperçu', icon: BarChart3 },
  { id: 'photos', label: 'Photos', icon: Image },
  { id: 'timeline', label: 'Chronologie', icon: Calendar },
  { id: 'technical', label: 'Technique', icon: Wrench },
  { id: 'costs', label: 'Coûts', icon: Euro },
  { id: 'maintenance', label: 'Entretien', icon: Gauge },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'settings', label: 'Paramètres', icon: Settings },
];

const TAB_STORAGE_KEY = 'bultaco-admin-tab';

const readSavedTab = () => {
  try {
    const saved = localStorage.getItem(TAB_STORAGE_KEY);
    return TABS.some(tab => tab.id === saved) ? saved! : 'stats';
  } catch {
    return 'stats';
  }
};

interface AdminDashboardProps {
  onViewSite?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onViewSite }) => {
  const [activeTab, setActiveTab] = useState(readSavedTab);
  const { user, signOut } = useAuth();

  const selectTab = (id: string) => {
    setActiveTab(id);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, id);
    } catch {
      // stockage local indisponible : on garde simplement l'onglet en mémoire
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center gap-4 py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Administration</h1>
              <p className="text-zinc-400 text-sm">
                Bultaco Sherpa 350 · <span className="text-zinc-500">v{__APP_VERSION__}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="hidden md:inline text-zinc-400 text-sm">{user?.email}</span>
              <a
                href={SECTION_PATHS.dossier}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-zinc-300 hover:text-white transition-colors"
                title="Ouvrir le dossier de restauration imprimable (PDF)"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Dossier PDF</span>
              </a>
              {onViewSite && (
                <button
                  onClick={onViewSite}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-zinc-300 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Voir le site</span>
                </button>
              )}
              <button
                onClick={signOut}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-zinc-300 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Navigation : barre horizontale sur mobile, colonne sur grand écran */}
          <nav className="lg:w-56 flex-shrink-0">
            <div className="flex lg:flex-col gap-2 overflow-x-auto bg-zinc-900 rounded-xl p-2 lg:p-4 border border-zinc-800">
              {TABS.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => selectTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-500 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 min-h-[600px]">
              {activeTab === 'stats' && <StatsOverview />}
              {activeTab === 'photos' && <PhotoManager />}
              {activeTab === 'timeline' && <TimelineManager />}
              {activeTab === 'technical' && <TechnicalAdmin />}
              {activeTab === 'costs' && <CostsManager />}
              {activeTab === 'maintenance' && <MaintenanceManager />}
              {activeTab === 'documents' && <DocumentsManager />}
              {activeTab === 'settings' && <SettingsManager />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
