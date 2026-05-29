import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Plus, AlertTriangle, CheckCircle } from 'lucide-react';

const STATUS_BADGE = {
  healthy: 'badge-healthy',
  restricted: 'badge-restricted',
  under_treatment: 'badge-treatment',
  deceased: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600',
};

export default function MyAnimals() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ animalType: '', breed: '', tagNumber: '', gender: 'female', dateOfBirth: '' });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAnimals = () => api.get('/animals').then(r => setAnimals(r.data));
  useEffect(() => { fetchAnimals(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (image) fd.append('profileImage', image);
      await api.post('/animals', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Animal registered!');
      setShowForm(false);
      setForm({ animalType: '', breed: '', tagNumber: '', gender: 'female', dateOfBirth: '' });
      setImage(null);
      fetchAnimals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register animal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">My Animals</h1>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Register Animal
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Register New Animal</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Animal Type *</label>
              <input className="input" required placeholder="e.g. Cow, Goat, Sheep" value={form.animalType} onChange={e => setForm(p => ({ ...p, animalType: e.target.value }))} />
            </div>
            <div>
              <label className="label">Breed</label>
              <input className="input" placeholder="e.g. Jersey, Guernsey" value={form.breed} onChange={e => setForm(p => ({ ...p, breed: e.target.value }))} />
            </div>
            <div>
              <label className="label">Tag Number</label>
              <input className="input" placeholder="Ear tag / ID" value={form.tagNumber} onChange={e => setForm(p => ({ ...p, tagNumber: e.target.value }))} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
            </div>
            <div>
              <label className="label">Photo</label>
              <input type="file" className="input py-1" accept="image/*" onChange={e => setImage(e.target.files[0])} />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Register Animal'}</button>
            </div>
          </form>
        </div>
      )}

      {animals.length === 0
        ? <div className="card p-10 text-center text-gray-400">No animals registered yet. Click "Register Animal" to add one.</div>
        : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {animals.map(a => (
              <Link key={a._id} to={`/animals/${a._id}`} className="card p-4 hover:shadow-md transition-shadow flex gap-4">
                {a.profileImage
                  ? <img src={a.profileImage} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-16 h-16 rounded-lg bg-primary-50 flex items-center justify-center text-3xl flex-shrink-0">🐄</div>
                }
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900">{a.animalType} {a.breed && <span className="text-gray-500 font-normal text-sm">({a.breed})</span>}</div>
                  {a.tagNumber && <div className="text-xs text-gray-400">Tag: {a.tagNumber}</div>}
                  <div className="mt-1.5">
                    <span className={STATUS_BADGE[a.status] || 'badge-healthy'}>{a.status.replace('_', ' ')}</span>
                  </div>
                  {a.status === 'restricted' && a.restrictionUntil && (
                    <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle size={11} /> Until {new Date(a.restrictionUntil).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      }
    </div>
  );
}
