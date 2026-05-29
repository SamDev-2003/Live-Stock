import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ShoppingBag, AlertTriangle } from 'lucide-react';

export default function SellMedicine() {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    medicineId: '', farmerId: '', animalId: '',
    quantity: 1, totalDoses: 1,
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    api.get('/farmers').then(r => setFarmers(r.data));
    api.get('/medicines').then(r => setMedicines(r.data.filter(m => m.stockQuantity > 0 && m.isActive)));
  }, []);

  useEffect(() => {
    if (form.farmerId) {
      api.get(`/animals?owner=${form.farmerId}`).then(r => setAnimals(r.data));
    } else {
      setAnimals([]);
    }
  }, [form.farmerId]);

  useEffect(() => {
    if (form.medicineId) {
      const med = medicines.find(m => m._id === form.medicineId);
      setSelectedMed(med || null);
    } else {
      setSelectedMed(null);
    }
  }, [form.medicineId, medicines]);

  // Calculate estimated withdrawal end date
  const calcWithdrawalEnd = () => {
    if (!selectedMed || !form.startDate || !form.totalDoses) return null;
    const start = new Date(form.startDate);
    const treatmentEnd = new Date(start.getTime() + form.totalDoses * selectedMed.feedingIntervalHours * 3600000);
    const withdrawalEnd = new Date(treatmentEnd.getTime() + selectedMed.withdrawalPeriodDays * 86400000);
    return withdrawalEnd.toLocaleDateString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/medicines/sell', {
        ...form,
        quantity: Number(form.quantity),
        totalDoses: Number(form.totalDoses)
      });
      toast.success('Medicine sold and schedule created!');
      navigate('/sales');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Sell / Assign Medicine</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Medicine selection */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Medicine Details</h2>
          <div>
            <label className="label">Select Medicine *</label>
            <select className="input" required value={form.medicineId}
              onChange={e => setForm(p => ({ ...p, medicineId: e.target.value }))}>
              <option value="">-- Choose medicine --</option>
              {medicines.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.type}) — Stock: {m.stockQuantity} {m.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Medicine preview card */}
          {selectedMed && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-1">
              <div className="font-semibold text-blue-900">{selectedMed.name}</div>
              {selectedMed.description && <div className="text-blue-700">{selectedMed.description}</div>}
              <div className="grid grid-cols-2 gap-x-4 text-blue-800 mt-2">
                <span>Stock: <strong>{selectedMed.stockQuantity} {selectedMed.unit}</strong></span>
                <span>Withdrawal: <strong>{selectedMed.withdrawalPeriodDays} days</strong></span>
                <span>Interval: <strong>{selectedMed.feedingIntervalHours}h between doses</strong></span>
                <span>Expires: <strong>{new Date(selectedMed.expirationDate).toLocaleDateString()}</strong></span>
              </div>
              {selectedMed.feedingInstructions && (
                <div className="mt-2 text-blue-700 italic">📋 {selectedMed.feedingInstructions}</div>
              )}
              {selectedMed.withdrawalPeriodDays > 0 && (
                <div className="mt-2 flex items-center gap-2 text-orange-700 font-medium">
                  <AlertTriangle size={14} /> Animal will be restricted during withdrawal period
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity to sell *</label>
              <input type="number" className="input" required min="1"
                max={selectedMed?.stockQuantity || 9999}
                value={form.quantity}
                onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
            </div>
            <div>
              <label className="label">Total Doses *</label>
              <input type="number" className="input" required min="1"
                value={form.totalDoses}
                onChange={e => setForm(p => ({ ...p, totalDoses: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Treatment Start Date *</label>
            <input type="date" className="input" required value={form.startDate}
              onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
          </div>

          {/* Withdrawal end date preview */}
          {selectedMed && form.startDate && form.totalDoses && (
            <div className={`rounded-lg p-3 text-sm ${selectedMed.withdrawalPeriodDays > 0 ? 'bg-orange-50 border border-orange-200 text-orange-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
              {selectedMed.withdrawalPeriodDays > 0
                ? <>⛔ Animal restriction ends: <strong>{calcWithdrawalEnd()}</strong></>
                : <>✅ No withdrawal period — animal will not be restricted</>
              }
            </div>
          )}
        </div>

        {/* Farmer & Animal */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Assign To</h2>
          <div>
            <label className="label">Farmer *</label>
            <select className="input" required value={form.farmerId}
              onChange={e => setForm(p => ({ ...p, farmerId: e.target.value, animalId: '' }))}>
              <option value="">-- Select farmer --</option>
              {farmers.map(f => <option key={f._id} value={f._id}>{f.name} ({f.email})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Animal <span className="text-gray-400 font-normal">(optional — leave blank for general use)</span></label>
            <select className="input" value={form.animalId}
              onChange={e => setForm(p => ({ ...p, animalId: e.target.value }))}
              disabled={!form.farmerId || animals.length === 0}>
              <option value="">-- No specific animal --</option>
              {animals.map(a => (
                <option key={a._id} value={a._id}>
                  {a.animalType}{a.breed ? ` (${a.breed})` : ''}{a.tagNumber ? ` #${a.tagNumber}` : ''} — {a.status}
                </option>
              ))}
            </select>
            {form.farmerId && animals.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">This farmer has no registered animals.</p>
            )}
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2}
              placeholder="Special instructions or remarks…"
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-secondary" onClick={() => navigate('/sales')}>Cancel</button>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
            <ShoppingBag size={16} />
            {loading ? 'Processing…' : 'Complete Sale'}
          </button>
        </div>
      </form>
    </div>
  );
}
