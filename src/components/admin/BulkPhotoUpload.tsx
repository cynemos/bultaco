import React, { useMemo, useState } from 'react';
import { X, Upload, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { addPhoto, uploadImage } from '../../lib/supabase';
import StepSelect from './StepSelect';

interface BulkPhotoUploadProps {
  categories: { value: string; label: string }[];
  onClose: () => void;
  onDone: () => void;
}

const input =
  'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500';

// Titre proposé à partir du nom de fichier : « remontage_moteur-2.jpg » → « Remontage moteur 2 »
const titleFromFile = (name: string) => {
  const base = name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Photo';
};

// Envoi de plusieurs photos d'un coup, avec catégorie, date et étape communes.
// Chaque photo est compressée avant l'envoi (voir uploadImage).
const BulkPhotoUpload: React.FC<BulkPhotoUploadProps> = ({ categories, onClose, onDone }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [category, setCategory] = useState(categories[0]?.value || 'restoration');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [stepId, setStepId] = useState('');
  const [status, setStatus] = useState<('waiting' | 'sending' | 'done' | 'error')[]>([]);
  const [running, setRunning] = useState(false);

  const previews = useMemo(() => files.map(f => URL.createObjectURL(f)), [files]);

  const pick = (list: FileList | null) => {
    const images = Array.from(list || []).filter(f => f.type.startsWith('image/'));
    setFiles(images);
    setTitles(images.map(f => titleFromFile(f.name)));
    setStatus(images.map(() => 'waiting'));
  };

  const send = async () => {
    setRunning(true);
    const next = [...status];
    for (let i = 0; i < files.length; i++) {
      if (next[i] === 'done') continue;
      next[i] = 'sending';
      setStatus([...next]);
      try {
        const url = await uploadImage(files[i], 'photos');
        await addPhoto({
          url,
          title: titles[i].trim() || titleFromFile(files[i].name),
          description: '',
          category,
          date,
          tags: [],
          timeline_event_id: stepId || null
        });
        next[i] = 'done';
      } catch (error) {
        console.error('Envoi impossible :', files[i].name, error);
        next[i] = 'error';
      }
      setStatus([...next]);
    }
    setRunning(false);
    onDone();
  };

  const done = status.filter(s => s === 'done').length;
  const errors = status.filter(s => s === 'error').length;
  const finished = files.length > 0 && done === files.length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !running && onClose()}>
      <div className="bg-zinc-900 rounded-xl w-full max-w-3xl border border-zinc-800 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-zinc-800">
          <h3 className="text-xl font-semibold text-white">Envoyer plusieurs photos</h3>
          <button onClick={onClose} disabled={running} className="text-zinc-400 hover:text-white disabled:opacity-30"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-zinc-700 hover:border-orange-500 rounded-xl cursor-pointer text-zinc-400">
            <Upload className="h-8 w-8" />
            <span>{files.length ? `${files.length} photo${files.length > 1 ? 's' : ''} sélectionnée${files.length > 1 ? 's' : ''} — cliquer pour changer` : 'Choisir les photos (sélection multiple possible)'}</span>
            <input type="file" accept="image/*" multiple className="hidden" disabled={running} onChange={e => pick(e.target.files)} />
          </label>

          {files.length > 0 && (
            <>
              <div className="grid sm:grid-cols-3 gap-4">
                <label className="text-sm text-zinc-300">Catégorie
                  <select className={`${input} mt-1`} value={category} onChange={e => setCategory(e.target.value)} disabled={running}>
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
                <label className="text-sm text-zinc-300">Date
                  <input type="date" className={`${input} mt-1`} value={date} onChange={e => setDate(e.target.value)} disabled={running} />
                </label>
                <div className="text-sm">
                  <StepSelect value={stepId} onChange={setStepId} />
                </div>
              </div>

              <div className="space-y-2">
                {files.map((_file, i) => (
                  <div key={i} className="flex items-center gap-3 bg-zinc-800/60 rounded-lg p-2">
                    <img src={previews[i]} alt="" className="h-12 w-16 object-cover rounded" />
                    <input
                      className={input}
                      value={titles[i]}
                      disabled={running || status[i] === 'done'}
                      onChange={e => setTitles(titles.map((t, j) => (j === i ? e.target.value : t)))}
                    />
                    <span className="w-6 flex justify-center">
                      {status[i] === 'sending' && <RefreshCw className="h-4 w-4 text-orange-400 animate-spin" />}
                      {status[i] === 'done' && <CheckCircle className="h-4 w-4 text-green-400" />}
                      {status[i] === 'error' && <AlertTriangle className="h-4 w-4 text-red-400" />}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-t border-zinc-800">
          <span className="text-sm text-zinc-400">
            {files.length > 0 && `${done}/${files.length} envoyée${done > 1 ? 's' : ''}`}
            {errors > 0 && <span className="text-red-400"> · {errors} en erreur (relancez pour réessayer)</span>}
          </span>
          {finished ? (
            <button onClick={onClose} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg">Terminé</button>
          ) : (
            <button
              onClick={send}
              disabled={running || files.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50"
            >
              {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {running ? 'Envoi en cours…' : `Envoyer ${files.length || ''} photo${files.length > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkPhotoUpload;
