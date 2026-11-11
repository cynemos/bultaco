import React, { useState } from 'react';
import { FileText, Trophy, Wrench } from 'lucide-react';
import TechSheetEditor from './TechSheetEditor';
import TechnicalSpecsManager from './TechnicalSpecsManager';

const TABS = [
  { id: 'sheet', label: 'Fiche technique', icon: FileText },
  { id: 'palmares', label: 'Palmarès', icon: Trophy },
  { id: 'restoration', label: 'Détail de la restauration', icon: Wrench }
] as const;

type TabId = (typeof TABS)[number]['id'];

// Onglet « Technique » de l'admin : tout le contenu de la page publique Technique
const TechnicalAdmin: React.FC = () => {
  const [tab, setTab] = useState<TabId>('sheet');

  return (
    <div>
      <div className="px-4 sm:px-8 pt-6 sm:pt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Page Technique</h2>
        <p className="text-zinc-400 mb-6">Fiche technique, palmarès et détail des pièces restaurées</p>
        <div className="flex flex-wrap gap-2 border-b border-zinc-800">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors ${
                tab === id ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'restoration' ? (
        <TechnicalSpecsManager />
      ) : (
        <div className="p-4 sm:p-8">
          <TechSheetEditor key={tab} mode={tab} />
        </div>
      )}
    </div>
  );
};

export default TechnicalAdmin;
