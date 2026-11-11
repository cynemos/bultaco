// Contenus structurés du site (fiche technique, palmarès), modifiables dans
// Admin → Technique. Stockés dans la table settings sous forme JSON.
// Les valeurs ci-dessous servent par défaut tant que rien n'a été enregistré.

export interface SpecRow {
  label: string;
  value: string;
}

export interface IdentificationCard {
  label: string;
  value: string;
  note: string;
}

export type SectionIcon = 'general' | 'engine' | 'transmission' | 'chassis' | 'dimensions' | 'electrical' | 'other';

export interface SpecSection {
  title: string;
  icon: SectionIcon;
  items: SpecRow[];
}

export interface TechSheet {
  identification: IdentificationCard[];
  sections: SpecSection[];
}

export interface PalmaresEntry {
  year: string;
  title: string;
  rider: string;
  details: string;
}

export interface Palmares {
  headline: string;
  subtitle: string;
  entries: PalmaresEntry[];
}

export const CONTENT_KEYS = {
  techSheet: 'tech_sheet',
  palmares: 'tech_palmares',
  beforeAfter: 'before_after_pairs'
} as const;

// Couples de photos avant / après (comparateur de l'accueil)
export interface BeforeAfterPair {
  title: string;
  before: string;
  after: string;
}

export const SECTION_ICON_LABELS: Record<SectionIcon, string> = {
  general: 'Informations générales',
  engine: 'Moteur',
  transmission: 'Transmission',
  chassis: 'Châssis',
  dimensions: 'Dimensions',
  electrical: 'Électricité',
  other: 'Autre'
};

export const DEFAULT_TECH_SHEET: TechSheet = {
  identification: [
    {
      label: 'Numéro de châssis',
      value: '18301224',
      note: 'Le numéro de châssis permet d’identifier l’année et le modèle exact de la moto. Le préfixe « 183 » correspond à la Sherpa 350T modèle {annee} (première mise en circulation le {mise_en_circulation}).'
    },
    {
      label: 'Numéro de moteur',
      value: 'JM-15901843',
      note: 'Le numéro moteur JM indique un moteur Bultaco Trial 350cc. Les numéros de série permettent de vérifier la concordance châssis/moteur.'
    }
  ],
  sections: [
    {
      title: 'Informations générales',
      icon: 'general',
      items: [
        { label: 'Modèle', value: 'Bultaco {modele}' },
        { label: 'Année modèle', value: '{annee}' },
        { label: 'Première mise en circulation', value: '{mise_en_circulation}' },
        { label: 'Type', value: 'Trial' },
        { label: "Pays d'origine", value: 'Espagne' },
        { label: 'Constructeur', value: 'Bultaco (Bultó)' },
        { label: 'Production', value: '1975-1979' }
      ]
    },
    {
      title: 'Moteur',
      icon: 'engine',
      items: [
        { label: 'Type moteur', value: 'Monocylindre 2 temps refroidi par air' },
        { label: 'Cylindrée', value: '325 cc' },
        { label: 'Alésage x Course', value: '83 x 60 mm' },
        { label: 'Taux de compression', value: '11.5:1' },
        { label: 'Puissance', value: '22 ch à 6000 tr/min' },
        { label: 'Allumage', value: 'Magneto Motoplat' },
        { label: 'Carburation', value: 'Bing 84' },
        { label: 'Graissage', value: 'Mélange essence-huile 3%' },
        { label: 'Démarrage', value: 'Kick starter' }
      ]
    },
    {
      title: 'Transmission',
      icon: 'transmission',
      items: [
        { label: 'Boîte de vitesses', value: '5 rapports' },
        { label: 'Embrayage', value: "Multidisque à bain d'huile" },
        { label: 'Transmission primaire', value: 'Engrenages droits' },
        { label: 'Transmission secondaire', value: 'Chaîne' }
      ]
    },
    {
      title: 'Châssis & Suspensions',
      icon: 'chassis',
      items: [
        { label: 'Cadre', value: 'Tube acier soudé, simple berceau' },
        { label: 'Suspension avant', value: 'Fourche télescopique Betor Ø35mm, débattement 160mm' },
        { label: 'Suspension arrière', value: 'Monoamortisseur Betor, débattement 100mm' },
        { label: 'Frein avant', value: 'Tambour Betor 200mm' },
        { label: 'Frein arrière', value: 'Tambour Betor 160mm' },
        { label: 'Jantes', value: 'Akront aluminium' },
        { label: 'Pneu avant', value: '2.75-21"' },
        { label: 'Pneu arrière', value: '4.00-18"' }
      ]
    },
    {
      title: 'Dimensions & Poids',
      icon: 'dimensions',
      items: [
        { label: 'Longueur', value: '2050 mm' },
        { label: 'Largeur', value: '830 mm' },
        { label: 'Hauteur de selle', value: '830 mm' },
        { label: 'Empattement', value: '1320 mm' },
        { label: 'Garde au sol', value: '300 mm' },
        { label: 'Poids à sec', value: '88 kg' },
        { label: 'Capacité réservoir', value: '6.5 litres' },
        { label: 'Capacité huile boîte', value: '0.7 litre' }
      ]
    }
  ]
};

export const DEFAULT_PALMARES: Palmares = {
  headline: '5 Titres Mondiaux Consécutifs',
  subtitle: 'La Bultaco Sherpa 350T a dominé le trial mondial de 1975 à 1979',
  entries: [
    { year: '1975', title: 'Champion du Monde Trial', rider: 'Martin Lampkin', details: 'Premier titre mondial pour Bultaco en trial' },
    { year: '1976', title: 'Champion du Monde Trial', rider: 'Yrjö Vesterinen', details: 'Deuxième titre consécutif avec la Sherpa 350T' },
    { year: '1977', title: 'Champion du Monde Trial', rider: 'Yrjö Vesterinen', details: 'Troisième titre mondial consécutif pour Bultaco' },
    { year: '1978', title: 'Champion du Monde Trial', rider: 'Yrjö Vesterinen', details: 'Troisième titre consécutif pour Vesterinen' },
    { year: '1979', title: 'Champion du Monde Trial', rider: 'Bernie Schreiber', details: 'Cinquième titre consécutif pour Bultaco' }
  ]
};

export interface SiteContent {
  techSheet: TechSheet;
  palmares: Palmares;
  // null tant qu'aucun couple n'a été enregistré : l'accueil utilise alors
  // les photos « avant » / « après » des Paramètres
  beforeAfter: BeforeAfterPair[] | null;
}

const parse = <T,>(raw: unknown, fallback: T, isValid: (v: unknown) => boolean): T => {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return isValid(value) ? (value as T) : fallback;
};

export const buildSiteContent = (rows: { key: string; value: unknown }[]): SiteContent => {
  const get = (key: string) => rows.find(r => r.key === key)?.value;
  return {
    techSheet: parse(get(CONTENT_KEYS.techSheet), DEFAULT_TECH_SHEET, v =>
      !!v && Array.isArray((v as TechSheet).sections) && Array.isArray((v as TechSheet).identification)
    ),
    palmares: parse(get(CONTENT_KEYS.palmares), DEFAULT_PALMARES, v =>
      !!v && Array.isArray((v as Palmares).entries)
    ),
    beforeAfter: parse<BeforeAfterPair[] | null>(get(CONTENT_KEYS.beforeAfter), null, v => Array.isArray(v) && v.length > 0)
  };
};

export const defaultSiteContent = (): SiteContent => ({
  techSheet: DEFAULT_TECH_SHEET,
  palmares: DEFAULT_PALMARES,
  beforeAfter: null
});

// Remplace {modele}, {annee}, {mise_en_circulation} par les valeurs des paramètres.
// Une ligne dont la valeur devient vide est masquée à l'affichage.
export const fillPlaceholders = (text: string, values: { modele: string; annee: string; mise_en_circulation: string }) =>
  text
    .replace(/\{modele\}/g, values.modele)
    .replace(/\{annee\}/g, values.annee)
    .replace(/\{mise_en_circulation\}/g, values.mise_en_circulation)
    .replace(/\s*\(première mise en circulation le \)\./, '.');
