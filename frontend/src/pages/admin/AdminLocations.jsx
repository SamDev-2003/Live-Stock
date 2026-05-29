import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MapPin, Plus, ChevronRight } from 'lucide-react';

export default function AdminLocations() {
  const [sectors, setSectors] = useState([]);
  const [cells, setCells] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  const [newSector, setNewSector] = useState('');
  const [newCell, setNewCell] = useState('');
  const [newVillage, setNewVillage] = useState('');

  const fetchSectors = () => api.get('/locations/sectors').then(r => setSectors(r.data));

  useEffect(() => { fetchSectors(); }, []);

  useEffect(() => {
    if (selectedSector) {
      api.get(`/locations/sectors/${selectedSector._id}/cells`).then(r => setCells(r.data));
      setSelectedCell(null);
      setVillages([]);
    }
  }, [selectedSector]);

  useEffect(() => {
    if (selectedCell) {
      api.get(`/locations/cells/${selectedCell._id}/villages`).then(r => setVillages(r.data));
    }
  }, [selectedCell]);

  const addSector = async (e) => {
    e.preventDefault();
    if (!newSector.trim()) return;
    try {
      await api.post('/locations/sectors', { name: newSector.trim() });
      toast.success('Sector added!');
      setNewSector('');
      fetchSectors();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addCell = async (e) => {
    e.preventDefault();
    if (!newCell.trim() || !selectedSector) return;
    try {
      await api.post('/locations/cells', { name: newCell.trim(), sectorId: selectedSector._id });
      toast.success('Cell added!');
      setNewCell('');
      api.get(`/locations/sectors/${selectedSector._id}/cells`).then(r => setCells(r.data));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addVillage = async (e) => {
    e.preventDefault();
    if (!newVillage.trim() || !selectedCell) return;
    try {
      await api.post('/locations/villages', { name: newVillage.trim(), cellId: selectedCell._id, sectorId: selectedSector._id });
      toast.success('Village added!');
      setNewVillage('');
      api.get(`/locations/cells/${selectedCell._id}/villages`).then(r => setVillages(r.data));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const Panel = ({ title, items, selected, onSelect, onAdd, newVal, setNewVal, placeholder, disabled }) => (
    <div className="card flex flex-col overflow-hidden" style={{ minHeight: 320 }}>
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <MapPin size={15} className="text-primary-600" />
        <h3 className="font-semibold text-sm text-gray-800">{title} <span className="text-gray-400 font-normal">({items.length})</span></h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.length === 0
          ? <div className="p-4 text-xs text-gray-400 text-center">{disabled ? 'Select a parent first' : 'None added yet'}</div>
          : items.map(item => (
            <button key={item._id} onClick={() => onSelect && onSelect(item)}
              className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center justify-between
                ${selected?._id === item._id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'}`}>
              {item.name}
              {onSelect && selected?._id === item._id && <ChevronRight size={14} />}
            </button>
          ))
        }
      </div>
      <form onSubmit={onAdd} className="border-t border-gray-100 p-3 flex gap-2">
        <input className="input flex-1 text-sm" placeholder={placeholder}
          value={newVal} onChange={e => setNewVal(e.target.value)}
          disabled={disabled} />
        <button type="submit" className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1" disabled={disabled || !newVal.trim()}>
          <Plus size={14} /> Add
        </button>
      </form>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-gray-900">Location Management</h1>
      <p className="text-sm text-gray-500">Manage the Sector → Cell → Village hierarchy used for farmer and user locations.</p>

      <div className="grid grid-cols-3 gap-4">
        <Panel
          title="Sectors"
          items={sectors}
          selected={selectedSector}
          onSelect={(s) => setSelectedSector(s)}
          onAdd={addSector}
          newVal={newSector}
          setNewVal={setNewSector}
          placeholder="New sector name…"
        />
        <Panel
          title="Cells"
          items={cells}
          selected={selectedCell}
          onSelect={(c) => setSelectedCell(c)}
          onAdd={addCell}
          newVal={newCell}
          setNewVal={setNewCell}
          placeholder="New cell name…"
          disabled={!selectedSector}
        />
        <Panel
          title="Villages"
          items={villages}
          onAdd={addVillage}
          newVal={newVillage}
          setNewVal={setNewVillage}
          placeholder="New village name…"
          disabled={!selectedCell}
        />
      </div>

      {/* Breadcrumb */}
      {(selectedSector || selectedCell) && (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <span className="text-gray-400">Selected:</span>
          {selectedSector && <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">{selectedSector.name}</span>}
          {selectedCell && <><ChevronRight size={14} className="text-gray-400" /><span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">{selectedCell.name}</span></>}
        </div>
      )}
    </div>
  );
}
