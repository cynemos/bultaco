// Catégories de dépenses, partagées entre la page publique et l'admin.
//
// Trois postes sont séparés des pièces :
//   - purchase       : achat de la moto
//   - labour         : main d'œuvre
//   - administrative : frais administratifs (assurance, FFVE, carte grise…)

export interface CostCategory {
  value: string;
  label: string;
  color: string;
}

export const PURCHASE_CATEGORY = 'purchase';
export const LABOUR_CATEGORY = 'labour';
export const ADMIN_CATEGORY = 'administrative';

const NON_PART_CATEGORIES = [PURCHASE_CATEGORY, LABOUR_CATEGORY, ADMIN_CATEGORY];

export const isPartCategory = (category: string) => !NON_PART_CATEGORIES.includes(category);

export const COST_CATEGORIES: CostCategory[] = [
  { value: 'engine', label: 'Moteur', color: 'text-red-400' },
  { value: 'bodywork', label: 'Carrosserie', color: 'text-blue-400' },
  { value: 'electrical', label: 'Électricité', color: 'text-yellow-400' },
  { value: 'wheels', label: 'Roues & Freins', color: 'text-green-400' },
  { value: 'transmission', label: 'Transmission', color: 'text-purple-400' },
  { value: 'suspension', label: 'Suspension', color: 'text-orange-400' },
  { value: 'accessories', label: 'Accessoires', color: 'text-cyan-400' },
  { value: 'tools', label: 'Outils', color: 'text-pink-400' },
  { value: LABOUR_CATEGORY, label: "Main d'œuvre", color: 'text-teal-400' },
  { value: ADMIN_CATEGORY, label: 'Administratif', color: 'text-indigo-400' },
  { value: PURCHASE_CATEGORY, label: 'Achat de la moto', color: 'text-rose-400' }
];
