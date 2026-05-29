import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';

const ROUTES = ['oral', 'injection', 'topical', 'intravenous', 'intramuscular', 'other'];

export default function NewTreatment() {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    farmerId: '', animalId: '', diagnosis: '',
    symptoms: '', followUpDate: '',
    withdrawalPeriodDays: 0, notes: '', status: 'ongoing'
  });
  const [medications, setMedications] = useState([
    { medicine: '', medicineName: '', dosage: '', administrationRoute: 'oral', frequency: '', duration: '' }
  ]);

  useEffect(() => {
    api.get('/farmers').then(r => setFarmers(r.data));
    api.get('/medicines').then(r => setMedicines(r.data));
  }, []);

  useEffect(() => {
    if (form.farmerId) {
      api.get(`/animals?owner=${form.farmerId}`).then(r => setAnimals(r.data));
    } else {
      setAnimals([]);
    }
  }, [form.farmerId]);

  const addMedication = () => setMedications(prev => [...prev, { medicine: '', medicineName: '', dosage: '', administrationRoute: 'oral', frequency: '', duration: '' }]);
  const removeMedication = (i) => setMedications(prev => prev.filter((_, idx) => idx !== i));
  const updateMed = (i, field, val) => setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/treatments', {
        ...form,
        symptoms: form.symptoms.split(',').map(s => s.trim()).filter(Boolean),
        medications
      });
      toast.success('Treatment recorded successfully!');
      navigate('/treatments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record treatment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Record New Treatment</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Farmer & Animal */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Patient Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Farmer *</label>
              <select className="input" required value={form.farmerId} onChange={e => setForm(p => ({ ...p, farmerId: e.target.value, animalId: '' }))}>
                <option value="">Select farmer</option>
                {farmers.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Animal</label>
              <select className="input" value={form.animalId} onChange={e => setForm(p => ({ ...p, animalId: e.target.value }))} disabled={!animals.length}>
                <option value="">Select animal</option>
                {animals.map(a => <option key={a._id} value={a._id}>{a.animalType} {a.breed ? `(${a.breed})` : ''} {a.tagNumber ? `#${a.tagNumber}` : ''}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Diagnosis</h2>
          <div>
            <label className="label">Diagnosis *</label>
            <input className="input" required placeholder="e.g. Bovine Respiratory Disease" value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} />
          </div>
          <div>
            <label className="label">Symptoms <span className="text-gray-400 font-normal">(comma-separated)</span></label>
            <input className="input" placeholder="fever, coughing, lethargy" value={form.symptoms} onChange={e => setForm(p => ({ ...p, symptoms: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Follow-up Date</label>
              <input type="date" className="input" value={form.followUpDate} onChange={e => setForm(p => ({ ...p, followUpDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Withdrawal Period (days)</label>
              <input type="number" className="input" min="0" value={form.withdrawalPeriodDays} onChange={e => setForm(p => ({ ...p, withdrawalPeriodDays: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="follow_up_required">Follow-up Required</option>
            </select>
          </div>
        </div>

        {/* Medications */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Medications</h2>
            <button type="button" onClick={addMedication} className="btn-secondary text-sm flex items-center gap-1">
              <Plus size={15} /> Add Medication
            </button>
          </div>
          {medications.map((med, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 relative">
              {medications.length > 1 && (
                <button type="button" onClick={() => removeMedication(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Medicine (from system)</label>
                  <select className="input" value={med.medicine} onChange={e => {
                    const m = medicines.find(x => x._id === e.target.value);
                    updateMed(i, 'medicine', e.target.value);
                    if (m) updateMed(i, 'medicineName', m.name);
                  }}>
                    <option value="">Select or type below</option>
                    {medicines.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Medicine Name</label>
                  <input className="input" placeholder="Or type medicine name" value={med.medicineName} onChange={e => updateMed(i, 'medicineName', e.target.value)} />
                </div>
                <div>
                  <label className="label">Dosage</label>
                  <input className="input" placeholder="e.g. 10ml" value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} />
                </div>
                <div>
                  <label className="label">Route</label>
                  <select className="input" value={med.administrationRoute} onChange={e => updateMed(i, 'administrationRoute', e.target.value)}>
                    {ROUTES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Frequency</label>
                  <input className="input" placeholder="e.g. Twice daily" value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} />
                </div>
                <div>
                  <label className="label">Duration</label>
                  <input className="input" placeholder="e.g. 5 days" value={med.duration} onChange={e => updateMed(i, 'duration', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="card p-5">
          <label className="label">Additional Notes</label>
          <textarea className="input resize-none" rows={3} placeholder="Any additional observations or instructions..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-secondary" onClick={() => navigate('/treatments')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Record Treatment'}</button>
        </div>
      </form>
    </div>
  );
}
