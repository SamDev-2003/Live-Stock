import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {Beef, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Pill } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color = 'primary', link }) => {
  const colors = {
    primary: 'bg-primary-50 text-primary-700',
    red: 'bg-red-50 text-red-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    blue: 'bg-blue-50 text-blue-700',
    gray: 'bg-gray-100 text-gray-700',
  };
  const card = (
    <div className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
  return link ? <Link to={link}>{card}</Link> : card;
};

// --- Farmer Dashboard ---
function FarmerDashboard() {
  const [animals, setAnimals] = useState([]);
  const [medicines, setMedicines] = useState([]);
  useEffect(() => {
    api.get('/animals').then(r => setAnimals(r.data));
    api.get('/medicines/sales').then(r => setMedicines(r.data));
  }, []);
  const restricted = animals.filter(a => a.status === 'restricted');
  const healthy = animals.filter(a => a.status === 'healthy');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">My Farm Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Beef} label="Total Animals" value={animals.length} link="/animals" />
        <StatCard icon={CheckCircle} label="Healthy" value={healthy.length} color="primary" />
        <StatCard icon={AlertTriangle} label="Restricted" value={restricted.length} color="red" />
        <StatCard icon={Pill} label="Active Medicines" value={medicines.filter(m => m.status === 'active').length} color="blue" />
      </div>
      {restricted.length > 0 && (
        <div className="card border-red-200 bg-red-50 p-4">
          <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3"><AlertTriangle size={18} /> Restricted Animals</h3>
          <div className="space-y-2">
            {restricted.map(a => (
              <Link key={a._id} to={`/animals/${a._id}`} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200 hover:border-red-400 transition-colors">
                <div>
                  <div className="font-medium text-sm">{a.animalType} {a.breed && `(${a.breed})`}</div>
                  <div className="text-xs text-red-600">{a.restrictionReason}</div>
                </div>
                <div className="text-xs text-gray-500">{a.restrictionUntil ? `Until ${new Date(a.restrictionUntil).toLocaleDateString()}` : ''}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Recent Feeding Schedule</h3>
        {medicines.filter(m => m.status === 'active').length === 0
          ? <p className="text-sm text-gray-400">No active medicine schedules</p>
          : medicines.filter(m => m.status === 'active').map(sale => (
            <div key={sale._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <div className="text-sm font-medium">{sale.medicine?.name}</div>
                <div className="text-xs text-gray-500">For: {sale.animal?.animalType || 'General'}</div>
              </div>
              <div className="text-xs text-primary-600 font-medium">{sale.dosesGiven}/{sale.totalDoses} doses given</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// --- Vet Dashboard ---
function VetDashboard() {
  const [treatments, setTreatments] = useState([]);
  useEffect(() => { api.get('/treatments').then(r => setTreatments(r.data)); }, []);
  const ongoing = treatments.filter(t => t.status === 'ongoing');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Veterinarian Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} label="Total Treatments" value={treatments.length} />
        <StatCard icon={Clock} label="Ongoing Cases" value={ongoing.length} color="yellow" />
        <StatCard icon={CheckCircle} label="Completed" value={treatments.filter(t => t.status === 'completed').length} color="primary" />
      </div>
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Recent Treatments</h3>
          <Link to="/treatments/new" className="btn-primary text-sm py-1.5">+ New Treatment</Link>
        </div>
        {treatments.slice(0, 8).map(t => (
          <div key={t._id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
            <div>
              <div className="text-sm font-medium">{t.animal?.animalType} — {t.diagnosis}</div>
              <div className="text-xs text-gray-500">Farmer: {t.farmer?.name} · {new Date(t.treatmentDate).toLocaleDateString()}</div>
            </div>
            <span className={t.status === 'ongoing' ? 'badge-treatment' : 'badge-healthy'}>{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Pharmacist Dashboard ---
function PharmacistDashboard() {
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  useEffect(() => {
    api.get('/medicines').then(r => setMedicines(r.data));
    api.get('/medicines/sales').then(r => setSales(r.data));
  }, []);
  const expiringSoon = medicines.filter(m => {
    const diff = (new Date(m.expirationDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff > 0;
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Pharmacy Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Pill} label="Medicines" value={medicines.length} link="/inventory" />
        <StatCard icon={AlertTriangle} label="Expiring Soon" value={expiringSoon.length} color="yellow" />
        <StatCard icon={TrendingUp} label="Total Sales" value={sales.length} link="/sales" />
        <StatCard icon={Clock} label="Active Prescriptions" value={sales.filter(s => s.status === 'active').length} color="blue" />
      </div>
      {expiringSoon.length > 0 && (
        <div className="card border-yellow-200 bg-yellow-50 p-4">
          <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2"><AlertTriangle size={16} /> Medicines Expiring in 30 Days</h3>
          <div className="space-y-2">
            {expiringSoon.map(m => (
              <div key={m._id} className="flex justify-between items-center bg-white rounded-lg p-3 border border-yellow-200">
                <div className="text-sm font-medium">{m.name}</div>
                <div className="text-xs text-yellow-700">Expires: {new Date(m.expirationDate).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Center Dashboard ---
function CenterDashboard() {
  const [stakeholders, setStakeholders] = useState([]);
  useEffect(() => { api.get('/centers/stakeholders').then(r => setStakeholders(r.data)); }, []);
  const pending = stakeholders.filter(s => s.status === 'pending');
  const approved = stakeholders.filter(s => s.status === 'approved');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Center Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Users} label="Approved Farmers" value={approved.length} link="/stakeholders" />
        <StatCard icon={Clock} label="Pending Requests" value={pending.length} color="yellow" link="/stakeholders" />
      </div>
    </div>
  );
}

// --- Admin / Inspector Dashboard ---
function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  useEffect(() => {
    if (user?.role === 'admin') api.get('/admin/dashboard').then(r => setStats(r.data));
    else api.get('/inspectors/overview').then(r => setStats(r.data));
  }, [user]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">{user?.role === 'admin' ? 'Admin' : 'Inspector'} Dashboard</h1>
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {user?.role === 'admin' ? (
            <>
              <StatCard icon={Users} label="Farmers" value={stats.farmers} link="/admin/users" />
              <StatCard icon={Beef} label="Animals" value={stats.animals} />
              <StatCard icon={AlertTriangle} label="Restricted" value={stats.restrictedAnimals} color="red" />
              <StatCard icon={TrendingUp} label="Treatments" value={stats.treatments} />
            </>
          ) : (
            <>
              <StatCard icon={Users} label="Veterinarians" value={stats.vets} />
              <StatCard icon={Pill} label="Pharmacists" value={stats.pharmacists} />
              <StatCard icon={AlertTriangle} label="Restricted Animals" value={stats.restrictedAnimals?.length} color="red" />
              <StatCard icon={TrendingUp} label="Recent Treatments" value={stats.recentTreatments?.length} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'farmer') return <FarmerDashboard />;
  if (user.role === 'vet') return <VetDashboard />;
  if (user.role === 'pharmacist') return <PharmacistDashboard />;
  if (user.role === 'milk_center' || user.role === 'slaughterhouse') return <CenterDashboard />;
  return <AdminDashboard />;
}
