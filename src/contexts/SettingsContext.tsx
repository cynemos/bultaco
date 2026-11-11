import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSettings } from '../lib/supabase';
import { SettingValues, buildSettingValues, defaultSettingValues } from '../lib/siteSettings';
import { SiteContent, buildSiteContent, defaultSiteContent, fillPlaceholders } from '../lib/siteContent';

interface SettingsContextType {
  settings: SettingValues;
  content: SiteContent;
  loaded: boolean;
  reload: () => Promise<void>;
  // Remplace {modele}, {annee}, {mise_en_circulation} dans un texte
  fill: (text: string) => string;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettingValues(),
  content: defaultSiteContent(),
  loaded: false,
  reload: async () => {},
  fill: text => text
});

// eslint-disable-next-line react-refresh/only-export-components
export const useSiteSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingValues>(defaultSettingValues);
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const rows = (await getSettings()) || [];
      setSettings(buildSettingValues(rows));
      setContent(buildSiteContent(rows));
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

  const fill = useMemo(() => {
    const registration = settings.first_registration_date
      ? new Date(String(settings.first_registration_date)).toLocaleDateString('fr-FR')
      : '';
    const values = {
      modele: String(settings.bike_model),
      annee: String(settings.bike_year),
      mise_en_circulation: registration
    };
    return (text: string) => fillPlaceholders(text, values);
  }, [settings.bike_model, settings.bike_year, settings.first_registration_date]);

  return (
    <SettingsContext.Provider value={{ settings, content, loaded, reload, fill }}>
      {children}
    </SettingsContext.Provider>
  );
};
