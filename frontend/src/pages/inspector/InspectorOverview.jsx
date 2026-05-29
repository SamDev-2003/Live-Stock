import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { AlertTriangle, Stethoscope, Pill, Users, ShieldCheck } from 'lucide-react';

export default function InspectorOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/inspectors/overview').then(r => setData(r.data));
  }, []);

  if (!data) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Inspector Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Veterinarians', value: data.vets, icon: Stethoscope, color: 'bg-blue-50 text-blue-600' },
          { label: 'Pharmacists', value: data.pharmacists, icon: Pill, color: 'bg-purple-50 text-purple-600' },
          { label: 'Restricted Animals', value: data.restrictedAnimals?.length || 0, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
          { label: 'Recent Treatments', value: data.recentTreatments?.length || 0, icon: ShieldCheck, color: 'bg-teal-50 text-teal-600' },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Restricted Animals */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-500" /> Restricted Animals
          </h2>
          {data.restrictedAnimals?.length === 0
            ? <p className="text-sm text-gray-400">No restricted animals — all clear ✅</p>
            : data.restrictedAnimals?.map(a => (
              <div key={a._id} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {a.animalType}{a.breed ? ` (${a.breed})` : ''}
                  </div>
                  <div className="text-xs text-gray-500">Owner: {a.owner?.name} · {a.owner?.email}</div>
                  <div className="text-xs text-red-500 mt-0.5">{a.restrictionReason}</div>
                </div>
                {a.restrictionUntil && (
                  <div className="text-xs text-gray-400 whitespace-nowrap ml-2 mt-0.5">
                    Until {new Date(a.restrictionUntil).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          }
        </div>

        {/* Recent Treatments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Stethoscope size={16} className="text-teal-600" /> Recent Treatments
            </h2>
            <Link to="/treatments" className="text-sm text-primary-600 hover:underline">View all →</Link>
          </div>
          {data.recentTreatments?.length === 0
            ? <p className="text-sm text-gray-400">No treatments recorded yet.</p>
            : data.recentTreatments?.map(t => (
              <div key={t._id} className="py-2.5 border-b border-gray-100 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-800">{t.diagnosis}</div>
                  <span className={t.status === 'ongoing' ? 'badge-treatment' : 'badge-healthy'}>{t.status}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {t.animal?.animalType} · {t.farmer?.name} · Dr. {t.vet?.name}
                  <span className="ml-2 text-gray-400">{new Date(t.treatmentDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Quick links */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { to: '/treatments', label: 'All Treatments', icon: Stethoscope },
            { to: '/all-diagnoses', label: 'Diagnoses Analytics', icon: ShieldCheck },
            { to: '/inventory', label: 'Medicine Inventory', icon: Pill },
          ].map(link => (
            <Link key={link.to} to={link.to}
              className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-sm font-medium text-gray-700 hover:text-primary-700">
              <link.icon size={16} />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
