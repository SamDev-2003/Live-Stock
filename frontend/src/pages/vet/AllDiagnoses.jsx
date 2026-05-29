import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AllDiagnoses() {
  const [treatments, setTreatments] = useState([]);

  useEffect(() => {
    api.get('/treatments').then(r => setTreatments(r.data));
  }, []);

  // Count by diagnosis
  const diagnosisCounts = Object.entries(
    treatments.reduce((acc, t) => {
      acc[t.diagnosis] = (acc[t.diagnosis] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);

  // Count by animal type
  const animalCounts = Object.entries(
    treatments.reduce((acc, t) => {
      const type = t.animal?.animalType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Count by status
  const statusCounts = [
    { name: 'Ongoing', value: treatments.filter(t => t.status === 'ongoing').length },
    { name: 'Completed', value: treatments.filter(t => t.status === 'completed').length },
    { name: 'Follow-up', value: treatments.filter(t => t.status === 'follow_up_required').length },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">All Diagnoses & Analytics</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Cases', value: treatments.length },
          { label: 'Unique Diagnoses', value: new Set(treatments.map(t => t.diagnosis)).size },
          { label: 'Farmers Treated', value: new Set(treatments.map(t => t.farmer?._id)).size },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Top Diagnoses</h2>
          {diagnosisCounts.length === 0
            ? <p className="text-sm text-gray-400">No data yet</p>
            : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={diagnosisCounts} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">By Treatment Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusCounts} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusCounts.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">By Animal Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={animalCounts}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Recent Cases</h2>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {treatments.slice(0, 10).map(t => (
              <div key={t._id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-medium text-gray-800">{t.diagnosis}</div>
                  <div className="text-xs text-gray-400">{t.farmer?.name} · {new Date(t.treatmentDate).toLocaleDateString()}</div>
                </div>
                <span className={t.status === 'ongoing' ? 'badge-treatment' : 'badge-healthy'}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
