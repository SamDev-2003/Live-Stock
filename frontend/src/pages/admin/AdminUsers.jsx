import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Search, Plus, ToggleLeft, ToggleRight, Trash2, UserPlus } from 'lucide-react';

const ROLES = ['farmer', 'vet', 'pharmacist', 'inspector', 'milk_center', 'slaughterhouse', 'admin'];
const ROLE_COLORS = {
  farmer: 'bg-green-100 text-green-800',
  vet: 'bg-blue-100 text-blue-800',
  pharmacist: 'bg-purple-100 text-purple-800',
  inspector: 'bg-teal-100 text-teal-800',
  milk_center: 'bg-yellow-100 text-yellow-800',
  slaughterhouse: 'bg-orange-100 text-orange-800',
  admin: 'bg-red-100 text-red-800',
};

export default function AdminUsers() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all');
  const [showInspectorForm, setShowInspectorForm] = useState(false);
  const [inspectorForm, setInspectorForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const fetchUsers = () => {
    const params = roleFilter !== 'all' ? `?role=${roleFilter}` : '';
    api.get(`/admin/users${params}`).then(r => setUsers(r.data));
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const toggleActive = async (id) => {
    try {
      const res = await api.put(`/admin/users/${id}/toggle-active`);
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const createInspector = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/inspectors', inspectorForm);
      toast.success('Inspector account created!');
      setShowInspectorForm(false);
      setInspectorForm({ name: '', email: '', phone: '', password: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create inspector');
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold text-gray-900">User Management</h1>
        <button onClick={() => setShowInspectorForm(v => !v)} className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> Add Inspector
        </button>
      </div>

      {/* Create Inspector Form */}
      {showInspectorForm && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Create Inspector Account</h2>
          <form onSubmit={createInspector} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" required value={inspectorForm.name}
                onChange={e => setInspectorForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" required value={inspectorForm.email}
                onChange={e => setInspectorForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={inspectorForm.phone}
                onChange={e => setInspectorForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password <span className="text-gray-400 font-normal">(default: Inspector@1234)</span></label>
              <input type="password" className="input" placeholder="Leave blank for default"
                value={inspectorForm.password}
                onChange={e => setInspectorForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowInspectorForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create Inspector'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search name or email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
      </div>

      {/* Stats badges */}
      <div className="flex gap-2 flex-wrap text-xs">
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{filtered.length} users shown</span>
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">{filtered.filter(u => u.isActive).length} active</span>
        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full">{filtered.filter(u => !u.isActive).length} inactive</span>
      </div>

      {/* Users Table */}
      {filtered.length === 0
        ? <div className="card p-10 text-center text-gray-400">No users found.</div>
        : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['User', 'Contact', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(u => (
                    <tr key={u._id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {u.profileImage
                            ? <img src={u.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                            : <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">{u.name?.[0]}</div>
                          }
                          <div>
                            <div className="font-medium text-gray-900">{u.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-600">{u.email}</div>
                        {u.phone && <div className="text-xs text-gray-400">{u.phone}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={u.isActive ? 'badge-healthy' : 'badge-restricted'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActive(u._id)}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                          >
                            {u.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => deleteUser(u._id, u.name)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }
    </div>
  );
}
