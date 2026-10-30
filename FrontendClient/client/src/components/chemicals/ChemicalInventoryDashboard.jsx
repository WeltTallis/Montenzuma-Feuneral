import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Beaker, Plus, RefreshCw, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import { getBranchId, getTenantSlug } from '../../utils/globalAuth';
import ActivityFeed from './components/ActivityFeed';
import BranchList from './components/BranchList';
import ChemicalDialog from './components/ChemicalDialog';
import InventoryTable from './components/InventoryTable';
import { DashboardShell, HeaderActions, PageHeader, PrimaryButton, SecondaryButton } from './components/InventoryStyles';
import SummaryCards from './components/SummaryCards';

const responseData = (response) => response?.data?.data ?? response?.data ?? [];

const ChemicalInventoryDashboard = () => {
  const [chemicals, setChemicals] = useState([]);
  const [branches, setBranches] = useState([]);
  const [summary, setSummary] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [ppeRequests, setPpeRequests] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [dialog, setDialog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const tenantSlug = getTenantSlug();
      const requests = [
        api.get('/chemicals'),
        api.get('/chemicals/dashboard/summary'),
        api.get('/chemicals/ppe-requests'),
      ];
      if (tenantSlug) requests.push(api.get(`/tenant/${tenantSlug}/branches`));
      const [chemicalResponse, summaryResponse, ppeResponse, branchResponse] = await Promise.all(requests);
      const chemicalData = responseData(chemicalResponse);
      const summaryData = responseData(summaryResponse);
      const ppeData = responseData(ppeResponse);
      const branchPayload = branchResponse ? responseData(branchResponse) : [];
      const branchData = Array.isArray(branchPayload) ? branchPayload : branchPayload?.branches || [];
      setChemicals(Array.isArray(chemicalData) ? chemicalData : []);
      setSummary(summaryData && !Array.isArray(summaryData) ? summaryData : {});
      setTransactions(Array.isArray(summaryData?.recent_transactions) ? summaryData.recent_transactions : []);
      setPpeRequests(Array.isArray(ppeData) ? ppeData : []);

      const normalizedBranches = (Array.isArray(branchData) ? branchData : [])
        .map((branch) => ({
          id: branch.branch_id ?? branch.id,
          name: branch.branch_name ?? branch.name,
          location: branch.branch_location ?? branch.location ?? '',
        }))
        .filter((branch) => branch.id != null && branch.name);
      const activeBranchId = getBranchId();
      if (!normalizedBranches.length && activeBranchId) {
        normalizedBranches.push({ id: activeBranchId, name: 'Current branch', location: '' });
      }
      setBranches(normalizedBranches);
    } catch (loadError) {
      const message = loadError?.response?.data?.message || loadError?.message || 'Could not load chemical inventory.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const filteredChemicals = useMemo(() => chemicals.filter((chemical) => {
    const matchesBranch = selectedBranchId === 'all' || String(chemical.branch_id) === String(selectedBranchId);
    const matchesSearch = `${chemical.chemical_name || ''} ${chemical.category || ''} ${chemical.batch_number || ''}`
      .toLowerCase().includes(search.trim().toLowerCase());
    const matchesCategory = category === 'all' || chemical.category === category;
    const lowStock = Number(chemical.current_stock ?? chemical.quantity_available) <= Number(chemical.min_stock_level || 0);
    const matchesStock = stockFilter === 'all' || (stockFilter === 'low' ? lowStock : !lowStock);
    return matchesBranch && matchesSearch && matchesCategory && matchesStock;
  }), [chemicals, selectedBranchId, search, category, stockFilter]);

  const categories = useMemo(() => [...new Set(chemicals.map((chemical) => chemical.category).filter(Boolean))].sort(), [chemicals]);

  const submitDialog = async (mode, values, chemical) => {
    try {
      if (mode === 'add') await api.post('/chemicals', values);
      if (mode === 'edit') await api.put(`/chemicals/${chemical.chemical_id}`, values);
      if (mode === 'receive') await api.post(`/chemicals/${chemical.chemical_id}/receive`, values);
      if (mode === 'usage') await api.post('/chemicals/usage', values);
      if (mode === 'ppe') await api.post('/chemicals/ppe-requests', values);
      toast.success(mode === 'usage' ? 'Chemical usage recorded.' : mode === 'ppe' ? 'PPE request submitted.' : 'Inventory updated.');
      setDialog(null);
      await loadDashboard(true);
      return true;
    } catch (submitError) {
      const message = submitError?.response?.data?.message || submitError?.message || 'The change could not be saved.';
      toast.error(message);
      return false;
    }
  };

  const branchName = branches.find((branch) => String(branch.id) === String(selectedBranchId))?.name;
  const branchTransactions = selectedBranchId === 'all'
    ? transactions
    : transactions.filter((transaction) => String(transaction.branch_id) === String(selectedBranchId));

  return (
    <DashboardShell>
      <PageHeader>
        <div>
          <div className="eyebrow"><Beaker size={15} /> OPERATIONS / INVENTORY</div>
          <h1>Chemical inventory</h1>
          <p>Monitor stock, record usage and keep branch supplies in check.</p>
        </div>
        <HeaderActions>
          <SecondaryButton type="button" onClick={() => loadDashboard(true)} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} /> Refresh
          </SecondaryButton>
          <SecondaryButton type="button" onClick={() => setDialog({ mode: 'ppe' })}>
            <Shield size={16} /> Request PPE
          </SecondaryButton>
          <PrimaryButton type="button" onClick={() => setDialog({ mode: 'add' })}>
            <Plus size={17} /> Add chemical
          </PrimaryButton>
        </HeaderActions>
      </PageHeader>

      {error && (
        <div className="error-banner" role="alert">
          <AlertCircle size={18} /><span>{error}</span>
          <button type="button" onClick={() => loadDashboard(true)}>Try again</button>
        </div>
      )}
      <SummaryCards chemicals={chemicals} summary={summary} ppeRequests={ppeRequests} />
      <div className="dashboard-layout">
        <BranchList branches={branches} chemicals={chemicals} selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} />
        <main className="inventory-main">
          <InventoryTable
            chemicals={filteredChemicals} loading={loading} branchName={branchName}
            search={search} onSearch={setSearch} categories={categories}
            category={category} onCategory={setCategory}
            stockFilter={stockFilter} onStockFilter={setStockFilter}
            onAdd={() => setDialog({ mode: 'add' })}
            onReceive={(chemical) => setDialog({ mode: 'receive', chemical })}
            onUse={(chemical) => setDialog({ mode: 'usage', chemical })}
            onEdit={(chemical) => setDialog({ mode: 'edit', chemical })}
          />
          <ActivityFeed transactions={branchTransactions} loading={loading} />
        </main>
      </div>
      {dialog && (
        <ChemicalDialog
          mode={dialog.mode} chemical={dialog.chemical} chemicals={chemicals}
          branchId={selectedBranchId === 'all' ? getBranchId() : selectedBranchId}
          onClose={() => setDialog(null)}
          onSubmit={(values) => submitDialog(dialog.mode, values, dialog.chemical)}
        />
      )}
    </DashboardShell>
  );
};

export default ChemicalInventoryDashboard;