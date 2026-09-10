import { useEffect, useState, useCallback } from 'react';
import { getCategories, createCategory, deleteCategory } from '../api/categories';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', type: 'expense' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await getCategories());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createCategory(form);
      setForm({ name: '', type: form.type });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await deleteCategory(cat.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const income = categories.filter((c) => c.type === 'income');
  const expense = categories.filter((c) => c.type === 'expense');

  const renderGroup = (label, items) => (
    <div className="category-group">
      <h3>{label}</h3>
      <ul className="category-list">
        {items.map((c) => (
          <li key={c.id}>
            <span>{c.name}</span>
            {c.is_default ? (
              <span className="tag-default">default</span>
            ) : (
              <button className="btn-link btn-link-danger" onClick={() => handleDelete(c)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="page">
      <h1>Categories</h1>

      <form className="inline-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="New category name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          maxLength={80}
        />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <button type="submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add Category'}</button>
      </form>

      {error && <div className="auth-error">{error}</div>}

      {loading ? (
        <p className="page-placeholder">Loading...</p>
      ) : (
        <div className="category-groups">
          {renderGroup('Income categories', income)}
          {renderGroup('Expense categories', expense)}
        </div>
      )}
    </div>
  );
}
