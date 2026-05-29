import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { AlertTriangle, Stethoscope, Pill, MessageSquare } from 'lucide-react';

const STATUS_COLORS = {
  healthy: 'bg-green-100 text-green-800 border-green-200',
  restricted: 'bg-red-100 text-red-800 border-red-200',
  under_treatment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  deceased: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function AnimalDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [animal, setAnimal] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [sales, setSales] = useState([]);
  const [reportText, setReportText] = useState('');
  const [reporting, setReporting] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    api.get(`/animals/${id}`).then(r => setAnimal(r.data));
    api.get(`/treatments?animalId=${id}`).then(r => setTreatments(r.data));
    api.get(`/medicines/sales?animalId=${id}`).then(r => setSales(r.data)).catch(() => {});
  }, [id]);

  const handleReport = async (e) => {
    e.preventDefault();
    setReporting(true);
    try {
      await api.post(`/animals/${id}/report-issue`, { description: reportText });
      toast.success('Issue reported. Vets have been notified.');
      setReportText('');
      setShowReport(false);
      api.get(`/animals/${id}`).then(r => setAnimal(r.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report issue');
    } finally {
      setReporting(false);
    }
  };

  if (!animal) return <div className="animate-pulse h-64 bg-gray-100 rounded-xl" />;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="card p-6 flex gap-5">
        {animal.profileImage
          ? <img src={animal.profileImage} alt="" className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
          : <div className="w-24 h-24 rounded-xl bg-primary-50 flex items-center justify-center text-5xl flex-shrink-0">🐄</div>
        }
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{animal.animalType} {animal.breed && <span className="text-gray-500 font-normal">({animal.breed})</span>}</h1>
              {animal.tagNumber && <div className="text-sm text-gray-400">Tag: {animal.tagNumber}</div>}
              <div className="text-sm text-gray-500 mt-1">Owner: {animal.owner?.name}</div>
            </div>
            <span className={`text-sm font-medium px-3 py-1 rounded-full border ${STATUS_COLORS[animal.status] || ''}`}>
              {animal.status.replace('_', ' ')}
            </span>
          </div>
          {animal.status === 'restricted' && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 text-sm">
              <div className="flex items-center gap-2 text-red-700 font-medium"><AlertTriangle size={15} /> Restriction Active</div>
              <div className="text-red-600 text-xs mt-1">{animal.restrictionReason}</div>
              {animal.restrictionUntil && <div className="text-red-500 text-xs">Until: {new Date(animal.restrictionUntil).toLocaleDateString()}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Report Issue (farmer only) */}
      {user?.role === 'farmer' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2"><MessageSquare size={18} /> Report Issue</h2>
            <button className="btn-secondary text-sm" onClick={() => setShowReport(v => !v)}>
              {showReport ? 'Cancel' : 'Report Issue'}
            </button>
          </div>
          {showReport && (
            <form onSubmit={handleReport} className="space-y-3">
              <textarea
                className="input resize-none" rows={3} required
                placeholder="Describe what's wrong with this animal..."
                value={reportText} onChange={e => setReportText(e.target.value)}
              />
              <div className="flex justify-end">
                <button type="submit" className="btn-primary" disabled={reporting}>
                  {reporting ? 'Sending…' : 'Send Report to Vets'}
                </button>
              </div>
            </form>
          )}
          {animal.issueReports?.length > 0 && (
            <div className="mt-3 space-y-2">
              <h3 className="text-sm font-medium text-gray-600">Past Reports</h3>
              {animal.issueReports.map((r, i) => (
                <div key={i} className="text-sm bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-gray-700">{r.description}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(r.reportedAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Treatment History */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><Stethoscope size={18} /> Treatment History</h2>
        {treatments.length === 0
          ? <p className="text-sm text-gray-400">No treatment records</p>
          : treatments.map(t => (
            <div key={t._id} className="border border-gray-200 rounded-lg p-4 mb-3 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-gray-900">{t.diagnosis}</div>
                <span className={t.status === 'ongoing' ? 'badge-treatment' : 'badge-healthy'}>{t.status}</span>
              </div>
              <div className="text-sm text-gray-500">Vet: {t.vet?.name} · {new Date(t.treatmentDate).toLocaleDateString()}</div>
              {t.medications?.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-gray-600 mb-1">Medications:</div>
                  {t.medications.map((m, i) => (
                    <div key={i} className="text-xs text-gray-500">• {m.medicineName || m.medicine?.name} — {m.dosage} ({m.administrationRoute})</div>
                  ))}
                </div>
              )}
              {t.withdrawalEndDate && (
                <div className="mt-2 text-xs text-orange-600">Withdrawal ends: {new Date(t.withdrawalEndDate).toLocaleDateString()}</div>
              )}
              {t.notes && <div className="mt-2 text-xs text-gray-400 italic">Note: {t.notes}</div>}
            </div>
          ))
        }
      </div>

      {/* Medicine Sales */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><Pill size={18} /> Medicine Schedule</h2>
        {sales.length === 0
          ? <p className="text-sm text-gray-400">No medicine records</p>
          : sales.map(s => (
            <div key={s._id} className="border border-gray-200 rounded-lg p-4 mb-3 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-sm">{s.medicine?.name}</div>
                <span className={s.status === 'active' ? 'badge-treatment' : 'badge-healthy'}>{s.status}</span>
              </div>
              <div className="text-xs text-gray-500">From: {s.pharmacist?.name}</div>
              <div className="text-xs text-gray-500">Doses: {s.dosesGiven} / {s.totalDoses}</div>
              {s.withdrawalEndDate && (
                <div className="text-xs text-orange-600 mt-1">Withdrawal until: {new Date(s.withdrawalEndDate).toLocaleDateString()}</div>
              )}
              {/* Dose confirmation */}
              {s.status === 'active' && user?.role === 'farmer' && (
                <div className="mt-3 space-y-1">
                  {s.feedingSchedule?.map((dose, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className={dose.givenAt ? 'text-green-600' : 'text-gray-400'}>
                        Dose {i + 1} — {new Date(dose.scheduledAt).toLocaleString()}
                      </span>
                      {!dose.givenAt && (
                        <button
                          className="text-primary-600 font-medium hover:underline"
                          onClick={async () => {
                            await api.put(`/medicines/sales/${s._id}/confirm-dose`, { doseIndex: i });
                            toast.success('Dose confirmed!');
                            api.get(`/medicines/sales?animalId=${id}`).then(r => setSales(r.data));
                          }}
                        >Mark given</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}
