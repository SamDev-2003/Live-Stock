import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Pill, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export default function MyMedicines() {
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState('all');

  const fetchSales = () => api.get('/medicines/sales').then(r => setSales(r.data));
  useEffect(() => { fetchSales(); }, []);

  const filtered = sales.filter(s => filter === 'all' || s.status === filter);

  const confirmDose = async (saleId, doseIndex) => {
    try {
      await api.put(`/medicines/sales/${saleId}/confirm-dose`, { doseIndex });
      toast.success('Dose marked as given!');
      fetchSales();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm dose');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold text-gray-900">My Medicines & Feeding Schedule</h1>
        <div className="flex gap-2">
          {['all', 'active', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium capitalize transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0
        ? <div className="card p-10 text-center text-gray-400">No medicine records found.</div>
        : (
          <div className="space-y-4">
            {filtered.map(sale => {
              const nextDose = sale.feedingSchedule?.find(d => !d.givenAt);
              const progress = sale.totalDoses > 0 ? (sale.dosesGiven / sale.totalDoses) * 100 : 0;
              return (
                <div key={sale._id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Pill size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{sale.medicine?.name}</div>
                        <div className="text-xs text-gray-500">
                          {sale.animal ? `${sale.animal.animalType}${sale.animal.breed ? ` (${sale.animal.breed})` : ''}` : 'General'}
                          {' · '}Prescribed by {sale.pharmacist?.name}
                        </div>
                      </div>
                    </div>
                    <span className={
                      sale.status === 'active' ? 'badge-treatment' :
                      sale.status === 'completed' ? 'badge-healthy' : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'
                    }>{sale.status}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{sale.dosesGiven} / {sale.totalDoses} doses</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Withdrawal warning */}
                  {sale.withdrawalEndDate && sale.status === 'active' && (
                    <div className="mb-3 flex items-center gap-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                      <AlertTriangle size={14} />
                      Animal restricted until: <strong>{new Date(sale.withdrawalEndDate).toLocaleDateString()}</strong>
                      {sale.animal && (
                        <Link to={`/animals/${sale.animal._id}`} className="ml-auto text-orange-600 hover:underline">View animal →</Link>
                      )}
                    </div>
                  )}

                  {/* Next dose */}
                  {nextDose && sale.status === 'active' && (
                    <div className="mb-3 flex items-center justify-between p-3 bg-primary-50 border border-primary-100 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-primary-800">
                        <Clock size={15} />
                        <span>Next dose: <strong>{new Date(nextDose.scheduledAt).toLocaleString()}</strong></span>
                      </div>
                      <button
                        onClick={() => {
                          const idx = sale.feedingSchedule.findIndex(d => !d.givenAt);
                          confirmDose(sale._id, idx);
                        }}
                        className="text-xs btn-primary py-1"
                      >Mark Given</button>
                    </div>
                  )}

                  {/* Full schedule (collapsible) */}
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700 select-none">View full schedule</summary>
                    <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                      {sale.feedingSchedule?.map((dose, i) => (
                        <div key={i} className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${dose.givenAt ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <span className="text-xs text-gray-600">Dose {i + 1} — {new Date(dose.scheduledAt).toLocaleString()}</span>
                          {dose.givenAt
                            ? <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Given {new Date(dose.givenAt).toLocaleDateString()}</span>
                            : (
                              <button onClick={() => confirmDose(sale._id, i)} className="text-xs text-primary-600 font-medium hover:underline">
                                Mark given
                              </button>
                            )
                          }
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
