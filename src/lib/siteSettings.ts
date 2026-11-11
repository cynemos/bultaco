// Paramètres du site, modifiables depuis l'admin (onglet Paramètres) et lus
// par les pages publiques. Chaque paramètre a une valeur par défaut : le site
// fonctionne même si la ligne n'existe pas encore en base.

export type SettingType = 'text' | 'textarea' | 'email' | 'tel' | 'date' | 'number' | 'boolean' | 'url' | 'range';

export interface SettingDefinition {
  key: string;
  label: string;
  category: string;
  type: SettingType;
  defaultValue: string | number | boolean;
  help?: string;
  // Curseur (type range) : bornes et unité affichée
  min?: number;
  max?: number;
  unit?: string;
}

export const SETTING_CATEGORIES = [
  { id: 'general', label: 'Général' },
  { id: 'bike', label: 'Moto' },
  { id: 'project', label: 'Projet' },
  { id: 'texts', label: 'Textes du site' },
  { id: 'contact', label: 'Contact' },
  { id: 'display', label: 'Affichage' },
  { id: 'system', label: 'Système' }
];

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  { key: 'site_title', label: 'Titre du site', category: 'general', type: 'text', defaultValue: 'Bultaco Sherpa 350',
    help: "Affiché dans l'en-tête, la page d'accueil, le pied de page et l'onglet du navigateur." },
  { key: 'site_description', label: 'Description du site', category: 'general', type: 'textarea',
    defaultValue: "Documentation complète de la restauration d'une légende du trial espagnol.",
    help: 'Affichée dans le pied de page et utilisée par les moteurs de recherche.' },

  { key: 'bike_model', label: 'Modèle', category: 'bike', type: 'text', defaultValue: 'Sherpa 350',
    help: "Utilisé dans les textes de l'accueil, de la page Coûts et de la fiche technique." },
  { key: 'bike_year', label: 'Année modèle', category: 'bike', type: 'number', defaultValue: 1976,
    help: "Année du modèle (préfixe de châssis 183 = 1976). Affichée dans l'en-tête, l'accueil et la fiche technique." },
  { key: 'first_registration_date', label: 'Première mise en circulation', category: 'bike', type: 'date', defaultValue: '1977-01-01',
    help: 'Date inscrite sur la carte grise. Affichée sur l’accueil et la fiche technique.' },

  { key: 'project_start_date', label: 'Début du projet', category: 'project', type: 'date', defaultValue: '2025-08-01',
    help: 'Affiché dans le pied de page et sur la page Coûts (mois et année).' },
  { key: 'work_hours', label: 'Heures de travail personnel', category: 'project', type: 'number', defaultValue: 200,
    help: "Estimation du temps passé. Affichée sur l'accueil et la page Coûts (0 pour la masquer)." },
  { key: 'work_hourly_rate', label: 'Valorisation horaire (€/h, facultatif)', category: 'project', type: 'number', defaultValue: 0,
    help: "0 = pas de valorisation. Sinon, la page Coûts indique ce que représenterait ce travail, sans l'ajouter au prix de revient." },

  { key: 'hero_origin', label: 'Accueil — carte « Origine »', category: 'texts', type: 'text', defaultValue: 'Bultaco, Espagne' },
  { key: 'hero_initial_state', label: 'Accueil — carte « État initial »', category: 'texts', type: 'text', defaultValue: 'Épave - Moteur bloqué' },
  { key: 'hero_project_text', label: 'Accueil — texte « Le Projet »', category: 'texts', type: 'textarea',
    defaultValue: `Cette Bultaco {modele} de {annee}, icône du trial espagnol, était à l'abandon depuis des décennies. Moteur grippé, carrosserie rouillée, électricité défaillante... Un défi de taille pour redonner vie à cette machine légendaire qui a marqué l'histoire du trial mondial.

Suivez chaque étape de cette restauration méticuleuse : du démontage complet à la remise en route, en passant par la réfection du moteur, la restauration de la carrosserie et la modernisation discrète de certains composants pour allier authenticité et fiabilité.`,
    help: 'Laissez une ligne vide entre deux paragraphes. Vous pouvez écrire {modele}, {annee} et {mise_en_circulation} : ils seront remplacés automatiquement.' },
  { key: 'tech_heritage_text', label: 'Fiche technique — « L’Héritage Bultaco »', category: 'texts', type: 'textarea',
    defaultValue: `La Bultaco Sherpa 350T de {annee} représente l'apogée de l'ingénierie espagnole en matière de trial. Conçue par Francisco Xavier \"Paco\" Bultó, cette machine révolutionnaire a redéfini les standards du trial mondial grâce à son moteur 2 temps performant et son châssis ultra-léger.

Avec ses 5 titres mondiaux consécutifs, la Sherpa 350T reste l'une des motos de trial les plus titrées de l'histoire. Sa restauration à l'identique permet de préserver ce patrimoine mécanique exceptionnel et de perpétuer la légende Bultaco.`,
    help: 'Laissez une ligne vide entre deux paragraphes. Vous pouvez écrire {modele}, {annee} et {mise_en_circulation} : ils seront remplacés automatiquement.' },

  { key: 'owner_name', label: 'Nom du propriétaire', category: 'contact', type: 'text', defaultValue: '',
    help: 'Affiché dans le copyright du pied de page (laisser vide pour le masquer).' },
  { key: 'owner_email', label: 'E-mail', category: 'contact', type: 'email', defaultValue: '' },
  { key: 'show_contact_email', label: "Afficher l'e-mail sur le site", category: 'contact', type: 'boolean', defaultValue: true,
    help: "Décoché, l'adresse n'est plus visible ni lisible publiquement." },
  { key: 'owner_phone', label: 'Téléphone', category: 'contact', type: 'tel', defaultValue: '' },
  { key: 'show_contact_phone', label: 'Afficher le téléphone sur le site', category: 'contact', type: 'boolean', defaultValue: true,
    help: "Décoché, le numéro n'est plus visible ni lisible publiquement." },

  { key: 'hero_image_url', label: "Image de fond de l'accueil", category: 'display', type: 'url',
    defaultValue: 'https://images.pexels.com/photos/279949/pexels-photo-279949.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop',
    help: 'Choisissez une photo de la galerie ou collez l’adresse d’une image.' },
  { key: 'hero_overlay_opacity', label: "Assombrissement de l'image d'accueil", category: 'display', type: 'range',
    defaultValue: 60, min: 0, max: 95, unit: '%',
    help: '0 % = image intacte, 95 % = presque noire. Un voile plus fort rend le texte plus lisible.' },
  { key: 'before_image_url', label: 'Photo « avant »', category: 'display', type: 'url',
    defaultValue: 'https://i.servimg.com/u/f28/12/40/02/10/trial-12.jpg',
    help: 'Choisissez une photo de la galerie ou collez l’adresse d’une image.' },
  { key: 'after_image_url', label: 'Photo « après »', category: 'display', type: 'url',
    defaultValue: 'https://i.servimg.com/u/f73/20/54/60/69/img_5111.jpg' },
  { key: 'gallery_items_per_page', label: 'Photos affichées par page dans la galerie', category: 'display', type: 'number', defaultValue: 12,
    help: 'Un bouton « Afficher plus » charge la suite.' },

  { key: 'maintenance_mode', label: 'Mode maintenance', category: 'system', type: 'boolean', defaultValue: false,
    help: "Les visiteurs voient une page d'attente ; vous gardez l'accès via « Admin »." },
  { key: 'maintenance_message', label: 'Message de maintenance', category: 'system', type: 'textarea',
    defaultValue: 'Le site est en cours de mise à jour. Revenez dans quelques instants !' }
];

export type SettingValues = Record<string, string | number | boolean>;

// Les paramètres de contact ne sont lisibles publiquement que si leur affichage est activé
export const PRIVACY_TOGGLES: Record<string, string> = {
  owner_email: 'show_contact_email',
  owner_phone: 'show_contact_phone'
};

// Certaines anciennes valeurs ont été enregistrées deux fois encodées ("\"texte\"") :
// on les décode jusqu'à obtenir la vraie valeur.
export const decodeSettingValue = (value: unknown): unknown => {
  let current = value;
  for (let i = 0; i < 3 && typeof current === 'string'; i++) {
    const trimmed = current.trim();
    if (!(trimmed.startsWith('"') && trimmed.endsWith('"'))) break;
    try {
      current = JSON.parse(trimmed);
    } catch {
      break;
    }
  }
  return current;
};

const coerce = (definition: SettingDefinition, raw: unknown): string | number | boolean => {
  const value = decodeSettingValue(raw);
  if (value === null || value === undefined || value === '') {
    return ['boolean', 'number', 'range'].includes(definition.type) ? definition.defaultValue : '';
  }
  switch (definition.type) {
    case 'boolean':
      return value === true || value === 'true';
    case 'range':
    case 'number': {
      const n = Number(value);
      return Number.isFinite(n) ? n : definition.defaultValue;
    }
    default:
      return String(value);
  }
};

export const defaultSettingValues = (): SettingValues =>
  Object.fromEntries(SETTING_DEFINITIONS.map(d => [d.key, d.defaultValue]));

// Construit les valeurs à partir des lignes de la table settings
export const buildSettingValues = (rows: { key: string; value: unknown }[]): SettingValues => {
  const values = defaultSettingValues();
  for (const row of rows) {
    const definition = SETTING_DEFINITIONS.find(d => d.key === row.key);
    if (definition) values[row.key] = coerce(definition, row.value);
  }
  return values;
};

export const formatMonthYear = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};
