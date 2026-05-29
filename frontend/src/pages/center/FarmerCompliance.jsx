import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { ShieldCheck, ShieldX, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function FarmerCompliance() {
  const { farmerId } = useParams();
  const [data, setData] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/centers/farmers/${farmerId}/compliance`),
      api.get(`/farmers/${farmerId}`)
    ]).then(([compRes, farmerRes]) => {
      setData(compRes.data);
      setFarmer(farmerRes.data.farmer);
    }).finally(() => setLoading(false));
  }, [farmerId]);

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;
  if (!data) return <div className="card p-10 text-center text-red-500">Failed to load compliance data.</div>;

  const { animals, restricted, cleared, treatments, summary } = data;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back */}
      <Link to="/stakeholders" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to Farmers
      </Link>

      {/* Header */}
      <div className="card p-6 flex items-center gap-5">
        {farmer?.profileImage
          ? <img src={farmer.profileImage} alt="" className="w-16 h-16 rounded-xl object-cover" />
          : <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700">{farmer?.name?.[0]}</div>
        }
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{farmer?.name}</h1>
          <div className="text-sm text-gray-500">{farmer?.email} · {farmer?.phone}</div>
        </div>
        {/* Overall compliance verdict */}
        <div className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl ${summary.canSell ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
          {summary.canSell
            ? <ShieldCheck size={32} className="text-green-600" />
            : <ShieldX size={32} className="text-red-600" />
          }
          <div className={`text-xs font-bold mt-1 ${summary.canSell ? 'text-green-700' : 'text-red-700'}`}>
            {summary.canSell ? 'CLEARED' : 'BLOCKED'}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          <div className="text-xs text-gray-500 mt-1">Total Animals</div>
        </div>
        <div className="card p-4 text-center border-green-200">
          <div className="text-2xl font-bold text-green-700">{summary.cleared}</div>
          <div className="text-xs text-gray-500 mt-1">Cleared</div>
        </div>
        <div className="card p-4 text-center border-red-200">
          <div className="text-2xl font-bold text-red-600">{summary.restricted}</div>
          <div className="text-xs text-gray-500 mt-1">Restricted</div>
        </div>
      </div>

      {/* Compliance verdict banner */}
      {!summary.canSell && restricted.length > 0 && (
        <div className="card border-red-300 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
            <AlertTriangle size={18} /> Compliance Issue — Sale / Collection NOT Allowed
          </div>
          <p className="text-sm text-red-700 mb-3">The following animals are under active withdrawal restrictions:</p>
          <div className="space-y-2">
            {restricted.map(a => (
              <div key={a._id} className="bg-white border border-red-200 rounded-lg p-3 text-sm">
                <div className="font-medium text-gray-800">{a.animalType}{a.breed ? ` (${a.breed})` : ''}{a.tagNumber ? ` — Tag #${a.tagNumber}` : ''}</div>
                <div className="text-red-600 text-xs mt-0.5">{a.restrictionReason}</div>
                {a.restrictionUntil && (
                  <div className="text-xs text-gray-500">Clears on: <strong>{new Date(a.restrictionUntil).toLocaleDateString()}</strong></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.canSell && (
        <div className="card border-green-300 bg-green-50 p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <div className="text-green-800 font-medium">All animals are cleared. This farmer is compliant for sale/collection.</div>
        </div>
      )}

      {/* All Animals */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4">All Animals</h2>
        {animals.length === 0
          ? <p className="text-sm text-gray-400">No registered animals.</p>
          : (
            <div className="space-y-2">
              {animals.map(a => (
                <div key={a._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {a.animalType}{a.breed ? ` (${a.breed})` : ''}
                      {a.tagNumber && <span className="text-gray-400 ml-1">#{a.tagNumber}</span>}
                    </div>
                    {a.status === 'restricted' && (
                      <div className="text-xs text-red-500">{a.restrictionReason}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.status === 'restricted'
                      ? <span className="badge-restricted flex items-center gap-1"><ShieldX size={11} /> Restricted</span>
                      : <span className="badge-healthy flex items-center gap-1"><ShieldCheck size={11} /> Cleared</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Treatment History */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Treatment History</h2>
        {treatments.length === 0
          ? <p className="text-sm text-gray-400">No treatment records.</p>
          : treatments.slice(0, 10).map(t => (
            <div key={t._id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
              <div>
                <div className="text-sm font-medium text-gray-800">{t.diagnosis}</div>
                <div className="text-xs text-gray-400">
                  {t.animal?.animalType} · Dr. {t.vet?.name} · {new Date(t.treatmentDate).toLocaleDateString()}
                </div>
              </div>
              {t.withdrawalEndDate && (
                <div className="text-xs text-orange-600 font-medium whitespace-nowrap">
                  Until {new Date(t.withdrawalEndDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
