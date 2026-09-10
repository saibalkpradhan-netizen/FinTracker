import { useState, useEffect } from 'react';

const TODAY = new Date().toISOString().slice(0, 10);

const EMPTY = {
  type: 'expense',
  amount: '',
  date: TODAY,
  category_id: '',
  description: '',
  payment_method: '',
  notes: '',
};

// Add/edit form for a single transaction. `fixedType`, when set, hides the
// type toggle (used by the Income/Expenses pages so users can't accidentally
// log an expense from the Income screen).
export default function TransactionForm({ categories, initialData, fixedType, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({ ...EMPTY, ...(fixedType ? { type: fixedType } : {}), ...(initialData || {}) });
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({ ...EMPTY, ...(fixedType ? { type: fixedType } : {}), ...(initialData || {}) });
  }, [initialData, fixedType]);

  const categoriesForType = categories.filter((c) => c.type === form.type);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value, ...(name === 'type' ? { category_id: '' } : {}) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category_id) {
      setError('Please choose a category');
      return;
    }
    try {
      await onSubmit({ ...form, amount: parseFloat(form.amount) });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <form className="tx-form" onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}
      <div className="tx-form-grid">
        {!fixedType && (
          <label>
            Type
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>
        )}
        <label>
          Amount
          <input type="number" name="amount" step="0.01" min="0.01" value={form.amount} onChange={handleChange} required />
        </label>
        <label>
          Date
          <input type="date" name="date" value={form.date?.slice(0, 10)} onChange={handleChange} required />
        </label>
        <label>
          Category
          <select name="category_id" value={form.category_id} onChange={handleChange} required>
            <option value="">Select category</option>
            {categoriesForType.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label>
          Payment method
          <input type="text" name="payment_method" placeholder="Cash, Card, UPI..." value={form.payment_method || ''} onChange={handleChange} />
        </label>
        <label className="tx-form-wide">
          Description
          <input type="text" name="description" value={form.description || ''} onChange={handleChange} maxLength={255} />
        </label>
        <label className="tx-form-wide">
          Notes
          <textarea name="notes" value={form.notes || ''} onChange={handleChange} rows={2} />
        </label>
      </div>
      <div className="tx-form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}
