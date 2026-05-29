import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'farmer', label: '🌾 Farmer', desc: 'Register and manage your livestock' },
  { value: 'vet', label: '🩺 Veterinarian', desc: 'Record animal treatments and diagnoses' },
  { value: 'pharmacist', label: '💊 Pharmacist', desc: 'Register and sell medicines' },
  { value: 'milk_center', label: '🥛 Milk Collection Center', desc: 'Manage milk suppliers' },
  { value: 'slaughterhouse', label: '🏭 Slaughterhouse', desc: 'Manage livestock clients' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [location, setLocation] = useState({ sector: '', cell: '', village: '' });
  const [sectors, setSectors] = useState([]);
  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/locations/sectors').then(r => setSectors(r.data)); }, []);
  useEffect(() => {
    if (location.sector) api.get(`/locations/sectors/${location.sector}/cells`).then(r => setCells(r.data));
  }, [location.sector]);
  useEffect(() => {
    if (location.cell) api.get(`/locations/cells/${location.cell}/villages`).then(r => setVillages(r.data));
  }, [location.cell]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (k !== 'confirmPassword') fd.append(k, v); });
      fd.append('role', role);
      Object.entries(location).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (profileImage) fd.append('profileImage', profileImage);

      await api.post('/auth/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <span className="text-4xl">🐄</span>
          <h1 className="font-display text-2xl text-white font-bold mt-2">Create Account</h1>
          <p className="text-primary-200 text-sm">LiveStock RW Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold mb-4">Choose your role</h2>
              <div className="grid gap-3">
                {ROLES.map(r => (
                  <button key={r.value} type="button"
                    onClick={() => { setRole(r.value); setStep(2); }}
                    className={`text-left p-4 rounded-xl border-2 transition-all hover:border-primary-400 ${role === r.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                  >
                    <div className="font-medium">{r.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                <Link to="/login" className="text-primary-600 font-medium hover:underline">Back to login</Link>
              </p>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-primary-600 hover:underline mb-2">← Change role</button>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Full Name</label>
                  <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
                </div>
                <div className="col-span-2">
                  <label className="label">Email</label>
                  <input type="email" className="input" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+250 7XX XXX XXX" />
                </div>
                <div>
                  <label className="label">Profile Photo</label>
                  <input type="file" className="input py-1" accept="image/*" onChange={e => setProfileImage(e.target.files[0])} />
                </div>
                {sectors.length > 0 && (
                  <>
                    <div>
                      <label className="label">Sector</label>
                      <select className="input" value={location.sector} onChange={e => setLocation(p => ({ ...p, sector: e.target.value, cell: '', village: '' }))}>
                        <option value="">Select sector</option>
                        {sectors.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Cell</label>
                      <select className="input" value={location.cell} onChange={e => setLocation(p => ({ ...p, cell: e.target.value, village: '' }))} disabled={!cells.length}>
                        <option value="">Select cell</option>
                        {cells.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="label">Village</label>
                      <select className="input" value={location.village} onChange={e => setLocation(p => ({ ...p, village: e.target.value }))} disabled={!villages.length}>
                        <option value="">Select village</option>
                        {villages.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <div>
                  <label className="label">Password</label>
                  <input type="password" className="input" required minLength={6} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 6 chars" />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input type="password" className="input" required value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat password" />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
