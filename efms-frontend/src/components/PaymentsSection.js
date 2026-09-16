import { useState } from 'react';
import { createPayment, deletePayment } from '../api';

function PaymentsSection({ token, employeeId, payments, onRefresh, readOnly }) {
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_type: '',
    payment_date: '',
    notes: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await createPayment(token, employeeId, paymentForm);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to record payment');
      return;
    }
    setPaymentForm({ amount: '', payment_type: '', payment_date: '', notes: '' });
    onRefresh();
  };

  const handleDelete = async (id) => {
    setError('');
    const res = await deletePayment(token, id);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to delete payment');
      return;
    }
    onRefresh();
  };

  return (
    <>
      <h3>Payments</h3>
      {!readOnly && (
        <form onSubmit={handleSubmit} className="upload-form">
          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={paymentForm.amount}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="payment_type"
            placeholder="Type (e.g. Salary, Bonus)"
            value={paymentForm.payment_type}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="payment_date"
            value={paymentForm.payment_date}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="notes"
            placeholder="Notes"
            value={paymentForm.notes}
            onChange={handleChange}
          />
          <button type="submit">Add Payment</button>
        </form>
      )}
      {error && <p className="error-text">{error}</p>}

      <ul className="document-list">
        {payments.map((p) => (
          <li key={p.id}>
            <span>
              {p.payment_type} — {p.amount} — {p.payment_date.slice(0, 10)}
              {p.notes ? ` — ${p.notes}` : ''}
            </span>
            {!readOnly && (
              <button className="delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
            )}
          </li>
        ))}
        {payments.length === 0 && <li className="empty">No payments recorded yet.</li>}
      </ul>
    </>
  );
}

export default PaymentsSection;