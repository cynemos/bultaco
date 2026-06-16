import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, X, Euro, Receipt, ExternalLink, TrendingUp, Package, FileText, Calendar, Filter, Search, PieChart, Wrench } from 'lucide-react';
import { 
  getPartsCosts, 
  addPartCost, 
  updatePartCost, 
  deletePartCost,
  getInvoices,
  addInvoice,
  updateInvoice,
  deleteInvoice,
  getCostStatistics
} from '../../lib/supabase';
import { PartCost, Invoice } from '../../types';

const CostsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'parts' | 'invoices' | 'stats'>('parts');
  const [partsCosts, setPartsCosts] = useState<PartCost[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statistics, setStatistics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PartCost | Invoice | null>(null);
  const [formType, setFormType] = useState<'part' | 'invoice'>('part');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [partFormData, setPartFormData] = useState({
    part_name: '',
    category: 'engine' as PartCost['category'],
    condition: 'new' as PartCost['condition'],
    price: '',
    currency: 'EUR',
    supplier: '',
    purchase_date: new Date().toISOString().split('T')[0],
    invoice_id: '',
    notes: ''
  });

  const [invoiceFormData, setInvoiceFormData] = useState({
    invoice_number: '',
    supplier: '',
    total_amount: '',
    currency: 'EUR',
    invoice_date: new Date().toISOString().split('T')[0],
    google_drive_url: '',
    description: ''
  });

  const categories = [
    { value: 'engine', label: 'Moteur', color: 'text-red-400' },
    { value: 'bodywork', label: 'Carrosserie', color: 'text-blue-400' },
    { value: 'electrical', label: 'Électricité', color: 'text-yellow-400' },
    { value: 'wheels', label: 'Roues & Freins', color: 'text-green-400' },
    { value: 'transmission', label: 'Transmission', color: 'text-purple-400' },
    { value: 'suspension', label: 'Suspension', color: 'text-orange-400' },
    { value: 'accessories', label: 'Accessoires', color: 'text-cyan-400' },
    { value: 'tools', label: 'Outils', color: 'text-pink-400' },
    { value: 'administrative', label: 'Administratif', color: 'text-indigo-400' }
  ];

  const conditions = [
    { value: 'new', label: 'Neuf', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { value: 'used', label: 'Occasion', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { value: 'refurbished', label: 'Reconditionné', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [costsData, invoicesData, statsData] = await Promise.all([
        getPartsCosts(),
        getInvoices(),
        getCostStatistics()
      ]);
      
      setPartsCosts(costsData || []);
      setInvoices(invoicesData || []);
      setStatistics(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const partData: any = {
        part_name: partFormData.part_name.trim(),
        category: partFormData.category,
        condition: partFormData.condition,
        price: parseFloat(partFormData.price),
        currency: partFormData.currency,
        supplier: partFormData.supplier?.trim() || undefined,
        purchase_date: partFormData.purchase_date,
        notes: partFormData.notes?.trim() || undefined
      };

      // Gestion spéciale de invoice_id : uniquement si non vide
      if (partFormData.invoice_id && partFormData.invoice_id.trim() !== '') {
        partData.invoice_id = partFormData.invoice_id.trim();
      } else {
        partData.invoice_id = null;
      }

      if (editingItem && 'part_name' in editingItem) {
        await updatePartCost(editingItem.id, partData);
      } else {
        await addPartCost(partData);
      }

      await loadData();
      resetForm();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMessage = error?.message || error?.error?.message || 'Erreur inconnue';
      alert(`Erreur lors de la sauvegarde de la pièce: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const invoiceData = {
        invoice_number: invoiceFormData.invoice_number,
        supplier: invoiceFormData.supplier,
        total_amount: parseFloat(invoiceFormData.total_amount),
        currency: invoiceFormData.currency,
        invoice_date: invoiceFormData.invoice_date,
        google_drive_url: invoiceFormData.google_drive_url || undefined,
        description: invoiceFormData.description || undefined
      };

      if (editingItem && 'invoice_number' in editingItem) {
        await updateInvoice(editingItem.id, invoiceData);
      } else {
        await addInvoice(invoiceData);
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la facture');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPart = (part: PartCost) => {
    setEditingItem(part);
    setFormType('part');
    setPartFormData({
      part_name: part.part_name,
      category: part.category,
      condition: part.condition,
      price: part.price.toString(),
      currency: part.currency,
      supplier: part.supplier || '',
      purchase_date: part.purchase_date,
      invoice_id: part.invoice_id || '',
      notes: part.notes || ''
    });
    setShowAddForm(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingItem(invoice);
    setFormType('invoice');
    setInvoiceFormData({
      invoice_number: invoice.invoice_number,
      supplier: invoice.supplier,
      total_amount: invoice.total_amount.toString(),
      currency: invoice.currency,
      invoice_date: invoice.invoice_date,
      google_drive_url: invoice.google_drive_url || '',
      description: invoice.description || ''
    });
    setShowAddForm(true);
  };

  const handleDeletePart = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette pièce ?')) return;
    
    try {
      await deletePartCost(id);
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la pièce');
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;
    
    try {
      await deleteInvoice(id);
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la facture');
    }
  };

  const resetForm = () => {
    setPartFormData({
      part_name: '',
      category: 'engine',
      condition: 'new',
      price: '',
      currency: 'EUR',
      supplier: '',
      purchase_date: new Date().toISOString().split('T')[0],
      invoice_id: '',
      notes: ''
    });
    setInvoiceFormData({
      invoice_number: '',
      supplier: '',
      total_amount: '',
      currency: 'EUR',
      invoice_date: new Date().toISOString().split('T')[0],
      google_drive_url: '',
      description: ''
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const getConditionColor = (condition: string) => {
    const conditionOption = conditions.find(c => c.value === condition);
    return conditionOption?.color || 'bg-zinc-700 text-zinc-400 border-zinc-600';
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const filteredParts = partsCosts.filter(part => {
    const matchesSearch = part.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || part.category === categoryFilter;
    const isNotBasePurchase = part.category !== 'administrative';
    return matchesSearch && matchesCategory && isNotBasePurchase;
  });

  const basePurchase = statistics.basePurchase;

  const tabs = [
    { id: 'parts', label: 'Pièces', icon: Package },
    { id: 'invoices', label: 'Factures', icon: FileText },
    { id: 'stats', label: 'Statistiques', icon: PieChart }
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Gestion des Coûts</h2>
          <p className="text-zinc-400">Suivi des dépenses et factures de restauration</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setFormType('part');
              setShowAddForm(true);
            }}
            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Ajouter pièce</span>
          </button>
          <button
            onClick={() => {
              setFormType('invoice');
              setShowAddForm(true);
            }}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Ajouter facture</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-zinc-800 p-1 rounded-lg">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              <IconComponent className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingItem 
                  ? `Modifier ${formType === 'part' ? 'la pièce' : 'la facture'}`
                  : `Ajouter ${formType === 'part' ? 'une pièce' : 'une facture'}`
                }
              </h3>
              <button onClick={resetForm} className="text-zinc-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            {formType === 'part' ? (
              <form onSubmit={handleSubmitPart} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Nom de la pièce *
                    </label>
                    <input
                      type="text"
                      value={partFormData.part_name}
                      onChange={(e) => setPartFormData({ ...partFormData, part_name: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Catégorie *
                    </label>
                    <select
                      value={partFormData.category}
                      onChange={(e) => setPartFormData({ ...partFormData, category: e.target.value as any })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      État *
                    </label>
                    <select
                      value={partFormData.condition}
                      onChange={(e) => setPartFormData({ ...partFormData, condition: e.target.value as any })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      required
                    >
                      {conditions.map((condition) => (
                        <option key={condition.value} value={condition.value}>
                          {condition.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Prix *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={partFormData.price}
                      onChange={(e) => setPartFormData({ ...partFormData, price: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Devise
                    </label>
                    <select
                      value={partFormData.currency}
                      onChange={(e) => setPartFormData({ ...partFormData, currency: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Fournisseur
                    </label>
                    <input
                      type="text"
                      value={partFormData.supplier}
                      onChange={(e) => setPartFormData({ ...partFormData, supplier: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Date d'achat *
                    </label>
                    <input
                      type="date"
                      value={partFormData.purchase_date}
                      onChange={(e) => setPartFormData({ ...partFormData, purchase_date: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Facture associée
                  </label>
                  <select
                    value={partFormData.invoice_id}
                    onChange={(e) => setPartFormData({ ...partFormData, invoice_id: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Aucune facture</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - {invoice.supplier}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={partFormData.notes}
                    onChange={(e) => setPartFormData({ ...partFormData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Sauvegarde...' : editingItem ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmitInvoice} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Numéro de facture *
                    </label>
                    <input
                      type="text"
                      value={invoiceFormData.invoice_number}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoice_number: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Fournisseur *
                    </label>
                    <input
                      type="text"
                      value={invoiceFormData.supplier}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, supplier: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Montant total *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={invoiceFormData.total_amount}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, total_amount: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Devise
                    </label>
                    <select
                      value={invoiceFormData.currency}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, currency: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Date de facture *
                    </label>
                    <input
                      type="date"
                      value={invoiceFormData.invoice_date}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoice_date: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Lien Google Drive
                  </label>
                  <input
                    type="url"
                    value={invoiceFormData.google_drive_url}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, google_drive_url: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={invoiceFormData.description}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Sauvegarde...' : editingItem ? 'Modifier' : 'Ajouter'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-zinc-400">Chargement des données...</div>
        </div>
      ) : (
        <>
          {activeTab === 'parts' && (
            <div>
              {/* Base Purchase Section */}
              {basePurchase && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Package className="h-5 w-5 text-red-400 mr-2" />
                    Achat de l'épave
                  </h2>
                  <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/30">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-white font-semibold text-lg">{basePurchase.part_name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getConditionColor(basePurchase.condition)}`}>
                            {conditions.find(c => c.value === basePurchase.condition)?.label}
                          </span>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-zinc-500">Prix:</span>
                            <span className="text-red-400 ml-2 font-semibold text-lg">
                              {formatPrice(basePurchase.price, basePurchase.currency)}
                            </span>
                          </div>
                          {basePurchase.supplier && (
                            <div>
                              <span className="text-zinc-500">Fournisseur:</span>
                              <span className="text-zinc-300 ml-2">{basePurchase.supplier}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-zinc-500">Date:</span>
                            <span className="text-zinc-300 ml-2">{formatDate(basePurchase.purchase_date)}</span>
                          </div>
                        </div>
                        {basePurchase.notes && (
                          <p className="text-zinc-400 text-sm mt-2 italic">{basePurchase.notes}</p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditPart(basePurchase)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Search and Filter */}
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Rechercher une pièce..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-zinc-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="all">Toutes catégories</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Restoration Parts List */}
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Wrench className="h-5 w-5 text-orange-400 mr-2" />
                Pièces de restauration
                {categoryFilter !== 'all' && (
                  <span className="text-orange-400 ml-2">
                    - {categories.find(c => c.value === categoryFilter)?.label}
                  </span>
                )}
              </h2>
              <div className="grid gap-4">
                {filteredParts.map((part) => (
                  <div key={part.id} className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-white font-semibold text-lg">{part.part_name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getConditionColor(part.condition)}`}>
                            {conditions.find(c => c.value === part.condition)?.label}
                          </span>
                          <span className="bg-zinc-700 px-2 py-1 rounded text-xs text-zinc-300">
                            {categories.find(c => c.value === part.category)?.label}
                          </span>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-zinc-500">Prix:</span>
                            <span className="text-orange-400 ml-2 font-semibold">
                              {formatPrice(part.price, part.currency)}
                            </span>
                          </div>
                          {part.supplier && (
                            <div>
                              <span className="text-zinc-500">Fournisseur:</span>
                              <span className="text-zinc-300 ml-2">{part.supplier}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-zinc-500">Date:</span>
                            <span className="text-zinc-300 ml-2">{formatDate(part.purchase_date)}</span>
                          </div>
                          {part.invoice_id && (
                            <div>
                              <span className="text-zinc-500">Facture:</span>
                              <span className="text-blue-400 ml-2">Liée</span>
                            </div>
                          )}
                        </div>
                        {part.notes && (
                          <p className="text-zinc-400 text-sm mt-2 italic">{part.notes}</p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditPart(part)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePart(part.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredParts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-4">Aucune pièce trouvée</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="grid gap-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-white font-semibold text-lg">{invoice.invoice_number}</h3>
                        {invoice.google_drive_url && (
                          <a
                            href={invoice.google_drive_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs hover:bg-green-500/30 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Drive</span>
                          </a>
                        )}
                      </div>
                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-zinc-500">Fournisseur:</span>
                          <span className="text-zinc-300 ml-2">{invoice.supplier}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Montant:</span>
                          <span className="text-orange-400 ml-2 font-semibold">
                            {formatPrice(invoice.total_amount, invoice.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Date:</span>
                          <span className="text-zinc-300 ml-2">{formatDate(invoice.invoice_date)}</span>
                        </div>
                      </div>
                      {invoice.description && (
                        <p className="text-zinc-400 text-sm mt-2 italic">{invoice.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditInvoice(invoice)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {invoices.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-4">Aucune facture ajoutée</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'procedures' && (
            <div className="grid gap-4">
              {procedures.map((procedure) => {
                const statusOption = statusOptions.find(s => s.value === procedure.status);
                const priorityOption = priorityOptions.find(p => p.value === procedure.priority);
                return (
                  <div key={procedure.id} className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-white font-semibold text-lg">{procedure.title}</h3>
                          {statusOption && (
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${statusOption.color}`}>
                              <statusOption.icon className="h-3 w-3" />
                              <span>{statusOption.label}</span>
                            </span>
                          )}
                          {priorityOption && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-700 ${priorityOption.color}`}>
                              {priorityOption.label}
                            </span>
                          )}
                        </div>
                        <div className="text-zinc-300 text-sm mb-3">{procedure.description}</div>
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          {procedure.responsible && (
                            <div>
                              <span className="text-zinc-500">Responsable:</span>
                              <span className="text-zinc-300 ml-2">{procedure.responsible}</span>
                            </div>
                          )}
                          {procedure.due_date && (
                            <div>
                              <span className="text-zinc-500">Date limite:</span>
                              <span className="text-zinc-300 ml-2">{new Date(procedure.due_date).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                        </div>
                        {procedure.notes && (
                          <p className="text-zinc-400 text-sm mt-2 italic">{procedure.notes}</p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditProcedure(procedure)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProcedure(procedure.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {procedures.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 mb-4">Aucune démarche ajoutée</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-red-500/20 p-3 rounded-lg">
                      <Package className="h-6 w-6 text-red-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatPrice(statistics.basePurchaseCost || 0, 'EUR')}
                  </div>
                  <div className="text-sm text-zinc-400">Achat épave</div>
                </div>

                <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-orange-500/20 p-3 rounded-lg">
                      <Euro className="h-6 w-6 text-orange-400" />
                    </div>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatPrice(statistics.totalCost || 0, 'EUR')}
                  </div>
                  <div className="text-sm text-zinc-400">Investissement total</div>
                </div>

                <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-500/20 p-3 rounded-lg">
                      <Euro className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatPrice(statistics.restorationCost || 0, 'EUR')}
                  </div>
                  <div className="text-sm text-zinc-400">Coût restauration</div>
                </div>

                <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-green-500/20 p-3 rounded-lg">
                      <Package className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {statistics.totalParts || 0}
                  </div>
                  <div className="text-sm text-zinc-400">Éléments achetés</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Cost by Category */}
                <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                  <h3 className="text-lg font-semibold text-white mb-6">Coûts par catégorie</h3>
                  <div className="space-y-4">
                    {Object.entries(statistics.costsByCategory || {}).map(([category, cost]) => {
                      const categoryInfo = categories.find(c => c.value === category);
                      const percentage = ((cost as number) / (statistics.totalCost || 1)) * 100;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`text-sm font-medium ${categoryInfo?.color || 'text-zinc-400'}`}>
                              {categoryInfo?.label || category}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-zinc-700 rounded-full h-2">
                              <div
                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="text-sm text-zinc-400 w-16 text-right">
                              {formatPrice(cost as number, 'EUR')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cost by Condition */}
                <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                  <h3 className="text-lg font-semibold text-white mb-6">Coûts par état</h3>
                  <div className="space-y-4">
                    {Object.entries(statistics.costsByCondition || {}).map(([condition, cost]) => {
                      const conditionInfo = conditions.find(c => c.value === condition);
                      const percentage = ((cost as number) / (statistics.totalCost || 1)) * 100;
                      return (
                        <div key={condition} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${conditionInfo?.color || 'bg-zinc-700 text-zinc-400 border-zinc-600'}`}>
                              {conditionInfo?.label || condition}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-zinc-700 rounded-full h-2">
                              <div
                                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="text-sm text-zinc-400 w-16 text-right">
                              {formatPrice(cost as number, 'EUR')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CostsManager;