import React, { useEffect, useState } from 'react';
import { getTimelineEvents } from '../../lib/supabase';
import { TimelineEvent } from '../../types';

interface StepSelectProps {
  value: string;
  onChange: (stepId: string) => void;
}

// Liste déroulante « Étape associée » (chronologie), utilisée dans les formulaires
// de photo et de dépense.
const StepSelect: React.FC<StepSelectProps> = ({ value, onChange }) => {
  const [steps, setSteps] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    getTimelineEvents()
      .then(data => setSteps(data || []))
      .catch(error => console.error('Erreur lors du chargement des étapes:', error));
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">Étape associée</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
      >
        <option value="">Aucune étape</option>
        {steps.map(step => (
          <option key={step.id} value={step.id}>
            {new Date(step.date).toLocaleDateString('fr-FR')} — {step.title}
          </option>
        ))}
      </select>
      <p className="text-xs text-zinc-500 mt-1">Affiche cet élément sous l'étape, dans la chronologie publique.</p>
    </div>
  );
};

export default StepSelect;
