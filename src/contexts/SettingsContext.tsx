import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSettings } from '../lib/supabase';
import { SettingValues, buildSettingValues, defaultSettingValues } from '../lib/siteSettings';

interface SettingsContextType {
  settings: SettingValues;
  loaded: boolean;
  reload: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettingValues(),
  loaded: false,
  reload: async () => {}
});

// eslint-disable-next-line react-refresh/only-export-components
export const useSiteSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingValues>(defaultSettingValues);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const rows = await getSettings();
      setSettings(buildSettingValues(rows || []));
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Le chargement est déclenché par l'application, une fois la session connue
  // (un admin connecté lit aussi les paramètres non publics).

  // Description pour les moteurs de recherche (le titre de l'onglet est géré par page dans App)
  useEffect(() => {
    document.querySelector('meta[name="description"]')?.setAttribute('content', String(settings.site_description));
  }, [settings.site_description]);

  return (
    <SettingsContext.Provider value={{ settings, loaded, reload }}>
      {children}
    </SettingsContext.Provider>
  );
};
