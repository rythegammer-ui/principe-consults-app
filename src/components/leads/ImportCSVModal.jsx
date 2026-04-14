import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Modal, EmptyState } from '../ui';
import useAppStore from '../../store/useAppStore';
import { parseCSV, mapCSVToLead } from '../../utils/csv';

export default function ImportCSVModal({ open, onClose }) {
  const importLeads = useAppStore(s => s.importLeads);
  const addNotification = useAppStore(s => s.addNotification);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [parsed, setParsed] = useState([]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      setParsed(rows);
      setPreview(rows.slice(0, 5));
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    const leads = parsed.map(mapCSVToLead).filter(l => l.businessName);
    importLeads(leads);
    addNotification(`Successfully imported ${leads.length} leads`, 'success');
    setPreview(null);
    setParsed([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Import CSV" width={700}>
      <div style={{ marginBottom: '16px' }}>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
        <button className="btn-ghost" onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={16} /> Choose CSV File
        </button>
        <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '8px' }}>
          Headers: business_name, type, owner_name, city, phone, email, website, rating, source, notes
        </p>
      </div>

      {preview && preview.length > 0 && (
        <>
          <div style={{ overflow: 'auto', marginBottom: '16px' }}>
            <table>
              <thead>
                <tr>
                  {Object.keys(preview[0]).map(k => <th key={k}>{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => <td key={j} style={{ fontSize: '12px' }}>{String(v).slice(0, 40)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
            Showing first {preview.length} of {parsed.length} rows.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-red" onClick={handleImport}>Import {parsed.length} Leads</button>
          </div>
        </>
      )}

      {!preview && (
        <EmptyState icon={Upload} message="Upload a CSV file to preview and import leads." />
      )}
    </Modal>
  );
}
