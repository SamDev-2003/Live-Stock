import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Stethoscope, Plus, Search, Filter } from 'lucide-react';

export default function TreatmentRecords() {
  const { user } = useAuth();
  const [treatments, setTreatments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    api.get('/treatments').then(r => setTreatments(r.data));
  }, []);

  const filtered = treatments.filter(t => {
    const matchSearch = !search || t.diagnosis.toLowerCase().includes(search.toLowerCase())
      || t.farmer?.name.toLowerCase().includes(search.toLowerCase())
      || t.animal?.animalType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold text-gray-900">Treatment Records</h1>
        {user?.role === 'vet' && (
          <Link to="/treatments/new" className="btn-primary flex items-center gap-2">
            <Plus size={18} /> New Treatment
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search diagnosis, farmer, animal…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="follow_up_required">Follow-up Required</option>
        </select>
      </div>

      {filtered.length === 0
        ? <div className="card p-10 text-center text-gray-400">No treatment records found.</div>
        : (
          <div className="space-y-3">
            {filtered.map(t => (
              <div key={t._id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <Stethoscope size={20} className="text-teal-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{t.diagnosis}</div>
                      <div className="text-sm text-gray-500">
                        {t.animal?.animalType}{t.animal?.breed ? ` (${t.animal.breed})` : ''} · {t.farmer?.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        By Dr. {t.vet?.name} · {new Date(t.treatmentDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={
                      t.status === 'ongoing' ? 'badge-treatment' :
                      t.status === 'follow_up_required' ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800' :
                      'badge-healthy'
                    }>{t.status.replace('_', ' ')}</span>
                    {t.withdrawalEndDate && (
                      <span className="text-xs text-orange-600">
                        Restriction until {new Date(t.withdrawalEndDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {t.symptoms?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {t.symptoms.map(s => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                )}
                {t.medications?.length > 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    Meds: {t.medications.map(m => m.medicineName || m.medicine?.name).filter(Boolean).join(', ')}
                  </div>
                )}
                {t.notes && <div className="mt-2 text-xs text-gray-400 italic">{t.notes}</div>}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
