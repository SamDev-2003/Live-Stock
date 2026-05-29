import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Users, CheckCircle, XCircle, Clock, Search, ShieldCheck } from 'lucide-react';

const STATUS_BADGE = {
  pending: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
  approved: 'badge-healthy',
  rejected: 'badge-restricted',
  suspended: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600',
};

export default function CenterStakeholders() {
  const { user } = useAuth();
  const [stakeholders, setStakeholders] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchStakeholders = () =>
    api.get('/centers/stakeholders').then(r => setStakeholders(r.data));

  useEffect(() => { fetchStakeholders(); }, []);

  const handleStatus = async (id, status) => {
    try {
      await api.put(`/centers/stakeholders/${id}`, { status });
      toast.success(`Farmer ${status}`);
      fetchStakeholders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filtered = stakeholders.filter(s => {
    const matchSearch = !search ||
      s.farmer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.farmer?.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.status === filter;
    return matchSearch && matchFilter;
  });

  const pending = stakeholders.filter(s => s.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            {user?.role === 'milk_center' ? 'Milk Supplier' : 'Livestock Supplier'} Farmers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your registered farmer stakeholders</p>
        </div>
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <div className="card border-yellow-200 bg-yellow-50 p-4 flex items-center gap-3">
          <Clock size={18} className="text-yellow-600 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>{pending.length} pending request{pending.length > 1 ? 's' : ''}</strong> waiting for your approval.
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected', 'suspended'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium capitalize transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0
        ? <div className="card p-10 text-center text-gray-400">No farmers found.</div>
        : (
          <div className="space-y-3">
            {filtered.map(s => (
              <div key={s._id} className="card p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    {s.farmer?.profileImage
                      ? <img src={s.farmer.profileImage} alt="" className="w-11 h-11 rounded-full object-cover" />
                      : <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">{s.farmer?.name?.[0]}</div>
                    }
                    <div>
                      <div className="font-semibold text-gray-900">{s.farmer?.name}</div>
                      <div className="text-xs text-gray-500">{s.farmer?.email} · {s.farmer?.phone}</div>
                      <div className="text-xs text-gray-400">Joined: {new Date(s.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={STATUS_BADGE[s.status]}>{s.status}</span>

                    {/* Compliance check */}
                    <Link to={`/compliance/${s.farmer?._id}`}
                      className="flex items-center gap-1.5 text-sm text-primary-600 hover:underline font-medium">
                      <ShieldCheck size={15} /> Check Compliance
                    </Link>

                    {/* Action buttons */}
                    {s.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleStatus(s._id, 'approved')}
                          className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button onClick={() => handleStatus(s._id, 'rejected')}
                          className="flex items-center gap-1 text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                    {s.status === 'approved' && (
                      <button onClick={() => handleStatus(s._id, 'suspended')}
                        className="text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                        Suspend
                      </button>
                    )}
                    {(s.status === 'rejected' || s.status === 'suspended') && (
                      <button onClick={() => handleStatus(s._id, 'approved')}
                        className="text-xs text-primary-600 border border-primary-300 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors">
                        Re-approve
                      </button>
                    )}
                  </div>
                </div>
                {s.notes && (
                  <div className="mt-2 text-xs text-gray-400 italic border-t border-gray-100 pt-2">Note: {s.notes}</div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
