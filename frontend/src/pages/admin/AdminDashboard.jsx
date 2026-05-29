import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Users, Beef, Stethoscope, Pill, AlertTriangle, Building2, ClipboardList, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [restrictedAnimals, setRestrictedAnimals] = useState([]);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data));
    api.get('/admin/users?isActive=true').then(r => setRecentUsers(r.data.slice(0, 8)));
    api.get('/animals?status=restricted').then(r => setRestrictedAnimals(r.data.slice(0, 5)));
  }, []);

  const chartData = stats ? [
    { name: 'Farmers', count: stats.farmers },
    { name: 'Vets', count: stats.vets },
    { name: 'Pharmacists', count: stats.pharmacists },
    { name: 'Inspectors', count: stats.inspectors },
    { name: 'Centers', count: stats.centers },
  ] : [];

  const StatBox = ({ icon: Icon, label, value, color, to }) => {
    const colors = {
      green: 'bg-green-50 text-green-700',
      blue: 'bg-blue-50 text-blue-700',
      purple: 'bg-purple-50 text-purple-700',
      orange: 'bg-orange-50 text-orange-700',
      red: 'bg-red-50 text-red-700',
      teal: 'bg-teal-50 text-teal-700',
    };
    const card = (
      <div className="card p-5 hover:shadow-md transition-shadow">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
          <Icon size={22} />
        </div>
        <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      </div>
    );
    return to ? <Link to={to}>{card}</Link> : card;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-gray-900">System Overview</h1>
        <Link to="/admin/users" className="btn-primary text-sm">Manage Users</Link>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatBox icon={Users} label="Farmers" value={stats.farmers} color="green" to="/admin/users?role=farmer" />
          <StatBox icon={Stethoscope} label="Veterinarians" value={stats.vets} color="blue" to="/admin/users?role=vet" />
          <StatBox icon={Pill} label="Pharmacists" value={stats.pharmacists} color="purple" to="/admin/users?role=pharmacist" />
          <StatBox icon={UserCheck} label="Inspectors" value={stats.inspectors} color="teal" to="/admin/users?role=inspector" />
          <StatBox icon={Building2} label="Centers" value={stats.centers} color="orange" />
          <StatBox icon={Beef} label="Animals" value={stats.animals} color="green" />
          <StatBox icon={AlertTriangle} label="Restricted" value={stats.restrictedAnimals} color="red" />
          <StatBox icon={ClipboardList} label="Treatments" value={stats.treatments} color="blue" to="/treatments" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Users by role chart */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Users by Role</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Restricted Animals */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" /> Restricted Animals
            </h2>
          </div>
          {restrictedAnimals.length === 0
            ? <p className="text-sm text-gray-400">No restricted animals 🎉</p>
            : restrictedAnimals.map(a => (
              <div key={a._id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-800">{a.animalType}{a.breed ? ` (${a.breed})` : ''}</div>
                  <div className="text-xs text-gray-500">Owner: {a.owner?.name}</div>
                  <div className="text-xs text-red-500 truncate max-w-48">{a.restrictionReason}</div>
                </div>
                {a.restrictionUntil && (
                  <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    Until {new Date(a.restrictionUntil).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          }
        </div>

        {/* Recent Users */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Recent Users</h2>
            <Link to="/admin/users" className="text-sm text-primary-600 hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Name', 'Email', 'Role', 'Status', 'Joined'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentUsers.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        {u.profileImage
                          ? <img src={u.profileImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                          : <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700">{u.name?.[0]}</div>
                        }
                        <span className="font-medium text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500">{u.email}</td>
                    <td className="py-2.5 pr-4">
                      <span className="capitalize text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{u.role.replace('_', ' ')}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={u.isActive ? 'badge-healthy' : 'badge-restricted'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="py-2.5 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
