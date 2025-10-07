import React, { useState } from 'react';
import { LogOut, Image, Calendar, Settings, BarChart3, Wrench, Euro } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PhotoManager from './PhotoManager';
import TimelineManager from './TimelineManager';
import TechnicalSpecsManager from './TechnicalSpecsManager';
import SettingsManager from './SettingsManager';
import StatsOverview from './StatsOverview';
import CostsManager from './CostsManager';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('photos');
  const { user, signOut } = useAuth();

  const tabs = [
    { id: 'stats', label: 'Aperçu', icon: BarChart3 },
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'technical', label: 'Technique', icon: Wrench },
    { id: 'costs', label: 'Coûts', icon: Euro },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Administration</h1>
              <p className="text-zinc-400">Gestion du contenu - Bultaco Sherpa 350</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-zinc-400">Connecté en tant que {user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg text-zinc-300 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
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
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 min-h-[600px]">
              {activeTab === 'stats' && <StatsOverview />}
              {activeTab === 'photos' && <PhotoManager />}
              {activeTab === 'timeline' && <TimelineManager />}
              {activeTab === 'technical' && <TechnicalSpecsManager />}
              {activeTab === 'costs' && <CostsManager />}
              {activeTab === 'settings' && <SettingsManager />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;