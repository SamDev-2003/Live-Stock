import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Search, ShoppingBag, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const STATUS_STYLES = {
  active: 'badge-treatment',
  completed: 'badge-healthy',
  expired: 'badge-restricted',
  cancelled: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500',
};

export default function SalesRecords() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    api.get('/medicines/sales').then(r => setSales(r.data));
  }, []);

  const filtered = sales.filter(s => {
    const matchSearch = !search ||
      s.medicine?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.farmer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = sales.length; // placeholder — add price field to extend

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold text-gray-900">Sales Records</h1>
        <Link to="/sell-medicine" className="btn-primary flex items-center gap-2">
          <ShoppingBag size={16} /> New Sale
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sales', value: sales.length, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Prescriptions', value: sales.filter(s => s.status === 'active').length, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Completed', value: sales.filter(s => s.status === 'completed').length, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        ].map(stat => (
          <div key={stat.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search medicine or farmer…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0
        ? <div className="card p-10 text-center text-gray-400">No sales records found.</div>
        : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Medicine', 'Farmer', 'Animal', 'Qty', 'Doses', 'Sale Date', 'Withdrawal Ends', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{s.medicine?.name}</div>
                        <div className="text-xs text-gray-400 capitalize">{s.medicine?.type}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{s.farmer?.name}</div>
                        <div className="text-xs text-gray-400">{s.farmer?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {s.animal ? `${s.animal.animalType}${s.animal.breed ? ` (${s.animal.breed})` : ''}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{s.quantity}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{s.dosesGiven}/{s.totalDoses}</div>
                        <div className="w-16 bg-gray-100 rounded-full h-1.5 mt-1">
                          <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${(s.dosesGiven / s.totalDoses) * 100}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(s.saleDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {s.withdrawalEndDate
                          ? <span className={`text-xs ${new Date(s.withdrawalEndDate) > new Date() ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                              {new Date(s.withdrawalEndDate).toLocaleDateString()}
                            </span>
                          : <span className="text-gray-300 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={STATUS_STYLES[s.status] || ''}>{s.status}</span>
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
