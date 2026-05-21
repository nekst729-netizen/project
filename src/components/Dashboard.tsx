import { useEffect, useState, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { loadDocuments, createDocument, deleteDocument, duplicateDocument, updateDocument, setActiveDocument } from '../features/documentsSlice';

const exportToCSV = (doc: any) => {
  const cells = doc.data?.cells || {};
  const rows = doc.data?.rows || 100;
  const cols = doc.data?.cols || 26;
  
  let csv = '';
  for (let r = 1; r <= rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      const col = String.fromCharCode(65 + c);
      const cell = cells[`${col}${r}`];
      const val = (cell?.value || cell?.formattedValue || '').toString().replace(/"/g, '""');
      row.push(`"${val}"`);
    }
    csv += row.join(',') + '\n';
  }
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${doc.name}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const exportToJSON = (doc: any) => {
  const json = JSON.stringify(doc.data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${doc.name}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const importCSV = (dispatch: any, e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target?.result as string;
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;
    
    const firstLine = lines[0];
    const colCount = (firstLine.match(/,/g) || []).length + 1;
    const cells: Record<string, any> = {};
    
    const colHeaders: string[] = [];
    const headerCols = firstLine.match(/(".*?"|[^",]+)(?=,|$)/g) || [];
    for (let i = 0; i < colCount; i++) {
      const col = String.fromCharCode(65 + (i % 26));
      const fullCol = i >= 26 ? 'A' + col : col;
      colHeaders.push(fullCol);
      cells[`${fullCol}1`] = { value: headerCols[i]?.replace(/^"|"$/g, '') || fullCol + '1', formattedValue: headerCols[i]?.replace(/^"|"$/g, '') || fullCol + '1', bold: true, italic: false, bgColor: '#e3f2fd', textColor: '#000', align: 'left' };
    }
    
    lines.slice(1).forEach((line, ri) => {
      const cols = line.match(/(".*?"|[^",]+)(?=,|$)/g) || [];
      cols.forEach((val, ci) => {
        const col = colHeaders[ci] || String.fromCharCode(65 + ci);
        const cleanVal = val.replace(/^"|"$/g, '').replace(/""/g, '"');
        if (cleanVal) {
          cells[`${col}${ri + 2}`] = { value: cleanVal, formattedValue: cleanVal, bold: false, italic: false, bgColor: '#fff', textColor: '#000', align: 'left' };
        }
      });
    });
    
    const name = file.name.replace(/\.[^/.]+$/, '');
    dispatch(createDocument({ name, rows: lines.length + 1, cols: colCount }));
    const saved = localStorage.getItem('documents');
    if (saved) {
      const docs = JSON.parse(saved);
      if (docs.length > 0) {
        docs[0].data.cells = cells;
        localStorage.setItem('documents', JSON.stringify(docs));
      }
    }
    window.location.reload();
  };
  reader.readAsText(file);
};

export const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { documents } = useAppSelector(s => s.documents);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('Новая таблица');
  const [rows, setRows] = useState('100');
  const [cols, setCols] = useState('26');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] =


useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('documents');
    dispatch(loadDocuments(saved ? JSON.parse(saved) : [{ id: '1', name: 'Пример', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), data: { rows: 50, cols: 10, cells: {} } }]));
    if (!saved) localStorage.setItem('documents', JSON.stringify([{ id: '1', name: 'Пример', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), data: { rows: 50, cols: 10, cells: {} } }]));
  }, []);

  const getPreview = (doc: any) => {
    const cells = doc.data?.cells || {};
    const preview = [];
    for (let r = 1; r <= 3; r++) {
      const row = [];
      for (let c = 0; c < 3; c++) {
        const col = String.fromCharCode(65 + c);
        const cell = cells[`${col}${r}`];
        row.push(cell?.formattedValue || cell?.value || '');
      }
      preview.push(row);
    }
    return preview;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5);
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const saveRename = (id: string) => {
    if (editName.trim()) {
      dispatch(updateDocument({ id, name: editName.trim() }));
    }
    setEditingId(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Мои документы</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setShowModal(true)} style={{ padding: '8px 20px', fontSize: 14, border: '1px solid #000', background: '#eee', fontFamily: 'inherit', borderRadius: 0 }}>+ Новый документ</button>
          <input type="file" accept=".csv" id="import-csv" style={{ display: 'none' }} onChange={e => importCSV(dispatch, e)} />
          <label htmlFor="import-csv" style={{ padding: '8px 20px', fontSize: 14, cursor: 'pointer', border: '1px solid #000', background: '#eee', textAlign: 'center', display: 'inline-block', minWidth: 120, fontFamily: 'inherit', borderRadius: 0 }}>Импорт CSV</label>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {documents.map(doc => (
          <div key={doc.id} style={{ display: 'flex', border: '1px solid #ccc', background: '#fafafa', overflow: 'hidden' }}>
            <div onClick={() => { dispatch(setActiveDocument(doc.id)); navigate(`/documents/${doc.id}`); }} style={{ cursor: 'pointer', borderRight: '1px solid #ddd', background: 'white', padding: 8 }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
                <tbody>
                  {getPreview(doc).map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ border: '1px solid #eee', padding: 2, width: 50, maxWidth: 50, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {editingId === doc.id ? (
                <input ref={inputRef} value={editName} onChange={e => setEditName(e.target.value)} onBlur={() => saveRename(doc.id)} onKeyDown={e => { if (e.key === 'Enter') saveRename(doc.id); if (e.key === 'Escape') setEditingId(null); }} style={{ fontSize: 16, fontWeight: 'bold', border: '1px solid #007bff', padding: '4px 8px', width: '60%' }} />
              ) : (
                <h3 style={{ margin: '0 0 4px 0', cursor: 'pointer' }} onClick={() => startRename(doc.id, doc.name)}>{doc.name}</h3>)}
              <div style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Экспорт:</span>
                <button onClick={() => exportToCSV(doc)} style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #000', background: '#eee', fontFamily: 'inherit', borderRadius: 0 }}>CSV</button>
                <button onClick={() => exportToJSON(doc)} style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #000', background: '#eee', fontFamily: 'inherit', borderRadius: 0 }}>JSON</button>
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                <div>Создан: {formatDate(doc.createdAt)}</div>
                <div>Изменен: {formatDate(doc.updatedAt)}</div>
              </div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}>
              <button onClick={() => { dispatch(setActiveDocument(doc.id)); navigate(`/documents/${doc.id}`); }} style={{ padding: '8px 20px', fontSize: 14, background: '#007bff', color: 'white', border: 'none', fontFamily: 'inherit' }}>Открыть</button>
              <button onClick={() => startRename(doc.id, doc.name)} style={{ padding: '4px 12px', fontSize: 12, fontFamily: 'inherit', borderRadius: 0 }}>Переименовать</button>
              <button onClick={() => dispatch(duplicateDocument(doc.id))} style={{ padding: '4px 12px', fontSize: 12, fontFamily: 'inherit', borderRadius: 0 }}>Копировать</button>
              <button onClick={() => { if (confirm('Удалить документ "' + doc.name + '"?')) dispatch(deleteDocument(doc.id)); }} style={{ padding: '4px 12px', fontSize: 12, color: '#dc3545', fontFamily: 'inherit', borderRadius: 0 }}>Удалить</button>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Новый документ</h3>
            <div style={{ marginBottom: 12 }}>
              <label>Название:</label>

              <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div>
                <label>Строк:</label>

                <input type="number" value={rows} onChange={e => setRows(e.target.value)} min="1" max="1000" style={{ width: 80, padding: '8px 12px', fontSize: 14 }} />
              </div>
              <div>
                <label>Столбцов:</label>

                <input type="number" value={cols} onChange={e => setCols(e.target.value)} min="1" max="702" style={{ width: 80, padding: '8px 12px', fontSize: 14 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #000', background: '#eee', fontFamily: 'inherit', borderRadius: 0 }}>Отмена</button>
              <button onClick={() => { dispatch(createDocument({ name, rows: parseInt(rows) || 100, cols: parseInt(cols) || 26 })); setShowModal(false); setName('Новая таблица'); }} style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #000', background: '#eee', fontFamily: 'inherit', borderRadius: 0 }}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};