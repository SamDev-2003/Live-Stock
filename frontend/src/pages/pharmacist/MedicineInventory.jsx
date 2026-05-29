import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Pill, AlertTriangle } from 'lucide-react';

const TYPES = ['medicine', 'food', 'supplement', 'vaccine'];

const defaultForm = {
  name: '', type: 'medicine', description: '', manufacturer: '',
  batchNumber: '', stockQuantity: 0, unit: 'units',
  expirationDate: '', withdrawalPeriodDays: 0,
  feedingInstructions: '', feedingIntervalHours: 24
};

export default function MedicineInventory() {
  const [medicines, setMedicines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  const fetchMeds = () => api.get('/medicines').then(r => setMedicines(r.data));
  useEffect(() => { fetchMeds(); }, []);

  const openEdit = (med) => {
    setEditing(med._id);
    setForm({
      ...defaultForm, ...med,
      expirationDate: med.expirationDate ? med.expirationDate.split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/medicines/${editing}`, form);
        toast.success('Medicine updated!');
      } else {
        await api.post('/medicines', form);
        toast.success('Medicine registered!');
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      fetchMeds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save medicine');
    } finally {
      setLoading(false);
    }
  };

  const daysUntilExpiry = (date) => {
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">Medicine Inventory</h1>
        <button onClick={() => { setShowForm(v => !v); setEditing(null); setForm(defaultForm); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Medicine
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">{editing ? 'Edit Medicine' : 'Register New Medicine / Food'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input className="input" required placeholder="Medicine or food name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="label">Manufacturer</label>
              <input className="input" value={form.manufacturer} onChange={e => setForm(p => ({ ...p, manufacturer: e.target.value }))} />
            </div>
            <div>
              <label className="label">Batch Number</label>
              <input className="input" value={form.batchNumber} onChange={e => setForm(p => ({ ...p, batchNumber: e.target.value }))} />
            </div>
            <div>
              <label className="label">Stock Quantity</label>
              <input type="number" className="input" min="0" value={form.stockQuantity} onChange={e => setForm(p => ({ ...p, stockQuantity: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="label">Unit</label>
              <input className="input" placeholder="ml, tablets, kg, units…" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} />
            </div>
            <div>
              <label className="label">Expiration Date *</label>
              <input type="date" className="input" required value={form.expirationDate} onChange={e => setForm(p => ({ ...p, expirationDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Withdrawal Period (days)</label>
              <input type="number" className="input" min="0" value={form.withdrawalPeriodDays} onChange={e => setForm(p => ({ ...p, withdrawalPeriodDays: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Feeding Instructions</label>
              <input className="input" placeholder="e.g. Feed twice daily for 5 days with water" value={form.feedingInstructions} onChange={e => setForm(p => ({ ...p, feedingInstructions: e.target.value }))} />
            </div>
            <div>
              <label className="label">Feeding Interval (hours)</label>
              <input type="number" className="input" min="1" value={form.feedingIntervalHours} onChange={e => setForm(p => ({ ...p, feedingIntervalHours: parseInt(e.target.value) || 24 }))} />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : editing ? 'Update Medicine' : 'Add Medicine'}</button>
            </div>
          </form>
        </div>
      )}

      {medicines.length === 0
        ? <div className="card p-10 text-center text-gray-400">No medicines registered yet.</div>
        : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicines.map(m => {
              const days = daysUntilExpiry(m.expirationDate);
              const expiringSoon = days <= 30 && days > 0;
              const expired = days <= 0;
              return (
                <div key={m._id} className={`card p-4 ${expired ? 'border-red-300' : expiringSoon ? 'border-yellow-300' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Pill size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-gray-900">{m.name}</div>
                        <div className="text-xs text-gray-400 capitalize">{m.type}</div>
                      </div>
                    </div>
                    <button onClick={() => openEdit(m)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Stock</span><span className="font-medium text-gray-800">{m.stockQuantity} {m.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Withdrawal</span><span className="font-medium text-gray-800">{m.withdrawalPeriodDays} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Expires</span>
                      <span className={`font-medium ${expired ? 'text-red-600' : expiringSoon ? 'text-yellow-600' : 'text-gray-800'}`}>
                        {new Date(m.expirationDate).toLocaleDateString()}
                        {expiringSoon && !expired && <span className="ml-1 text-yellow-500">({days}d)</span>}
                        {expired && <span className="ml-1 text-red-500">(expired)</span>}
                      </span>
                    </div>
                  </div>
                  {(expiringSoon || expired) && (
                    <div className={`mt-2 flex items-center gap-1 text-xs ${expired ? 'text-red-600' : 'text-yellow-600'}`}>
                      <AlertTriangle size={12} /> {expired ? 'Expired — do not use' : 'Expiring soon'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
