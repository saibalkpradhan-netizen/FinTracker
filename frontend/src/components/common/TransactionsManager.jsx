import { useEffect, useState, useCallback } from 'react';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../../api/transactions';
import { getCategories } from '../../api/categories';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/format';
import TransactionForm from './TransactionForm';

// Powers the Transactions, Income, and Expenses pages. `fixedType` restricts
// the view (and the add form) to just income or just expense; leave it
// undefined for the full Transactions page with a type filter dropdown.
export default function TransactionsManager({ fixedType, title }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ type: fixedType || '', category_id: '', date_from: '', date_to: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = useCallback(async () => {
    const cats = await getCategories(fixedType);
    setCategories(cats);
  }, [fixedType]);

  const loadTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (filters.type) params.type = filters.type;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.search) params.search = filters.search;

      const data = await getTransactions(params);
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadTransactions(1); }, [loadTransactions]);

  const handleFilterChange = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  const openCreate = () => { setEditingTx(null); setShowForm(true); };
  const openEdit = (tx) => { setEditingTx(tx); setShowForm(true); };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (editingTx) {
        await updateTransaction(editingTx.id, payload);
      } else {
        await createTransaction(payload);
      }
      setShowForm(false);
      setEditingTx(null);
      await loadTransactions(pagination.page);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tx) => {
    if (!window.confirm(`Delete this ${tx.type} of ${formatCurrency(tx.amount, user?.currency)}?`)) return;
    await deleteTransaction(tx.id);
    await loadTransactions(pagination.page);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{title}</h1>
        <button onClick={openCreate}>+ Add {fixedType ? fixedType[0].toUpperCase() + fixedType.slice(1) : 'Transaction'}</button>
      </div>

      <div className="filters-bar">
        {!fixedType && (
          <select name="type" value={filters.type} onChange={handleFilterChange}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        )}
        <select name="category_id" value={filters.category_id} onChange={handleFilterChange}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} />
        <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} />
        <input type="search" name="search" placeholder="Search description..." value={filters.search} onChange={handleFilterChange} />
      </div>

      {showForm && (
        <div className="tx-form-panel">
          <h3>{editingTx ? 'Edit' : 'Add'} {fixedType || 'Transaction'}</h3>
          <TransactionForm
            categories={categories}
            initialData={editingTx}
            fixedType={fixedType}
            submitting={submitting}
            onCancel={() => { setShowForm(false); setEditingTx(null); }}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}
      {loading ? (
        <p className="page-placeholder">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="page-placeholder">No transactions found.</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                {!fixedType && <th>Type</th>}
                <th>Category</th>
                <th>Description</th>
                <th>Method</th>
                <th className="align-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{formatDate(tx.date)}</td>
                  {!fixedType && <td className={`type-badge type-${tx.type}`}>{tx.type}</td>}
                  <td>{tx.category_name || '—'}</td>
                  <td>{tx.description || '—'}</td>
                  <td>{tx.payment_method || '—'}</td>
                  <td className={`align-right amount-${tx.type}`}>{formatCurrency(tx.amount, user?.currency)}</td>
                  <td className="row-actions">
                    <button className="btn-link" onClick={() => openEdit(tx)}>Edit</button>
                    <button className="btn-link btn-link-danger" onClick={() => handleDelete(tx)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button disabled={pagination.page <= 1} onClick={() => loadTransactions(pagination.page - 1)}>Previous</button>
            <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadTransactions(pagination.page + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}
