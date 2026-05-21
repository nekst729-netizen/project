import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setCellValue, setCellsValue, selectCell, selectCells, setCellsStyle, undo, redo, setColWidth, addRow, addCol, deleteRow, deleteCol, loadDocument } from '../features/spreadsheetSlice';
import { updateDocument, setSaveStatus, setActiveDocument } from '../features/documentsSlice';

export const Spreadsheet = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { cells, selectedCells, rows, cols, colWidths, rowHeights } = useAppSelector(s => s.spreadsheet);
  const { documents, activeDocumentId, saveStatus } = useAppSelector(s => s.documents);
  const [editCell, setEditCell] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [ctx, setCtx] = useState<any>(null);
  const [formulaBarVal, setFormulaBarVal] = useState('');
  const [dragStart, setDragStart] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<any>(null);

  useEffect(() => {
    if (!documentId) return;
    const doc = documents.find(d => d.id === documentId);
    if (doc) { dispatch(setActiveDocument(documentId)); if (doc.data) dispatch(loadDocument(doc.data)); }
    else navigate('/dashboard');
  }, [documentId, documents]);

  useEffect(() => {
    if (selectedCells.length > 0) {
      const cell = cells[selectedCells[0]];
      setFormulaBarVal(cell?.value || '');
    }
  }, [selectedCells, cells]);

  const save = () => {
    if (timer.current) clearTimeout(timer.current);
    dispatch(setSaveStatus('saving'));
    timer.current = setTimeout(() => {
      if (activeDocumentId) dispatch(updateDocument({ id: activeDocumentId, data: { cells, rows, cols, colWidths, rowHeights } }));
      dispatch(setSaveStatus('saved'));
      setTimeout(() => dispatch(setSaveStatus('idle')), 500);
    }, 500);
  };

  useEffect(() => { if (activeDocumentId) save(); }, [cells, rows, cols, colWidths, rowHeights]);

  useEffect(() => {
    console.log('selectedCells:', selectedCells);
    const handler = (e: KeyboardEvent) => {
      console.log('key:', e.key, 'target:', (e.target as HTMLElement).tagName);
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); dispatch(undo()); }
        if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) { e.preventDefault(); dispatch(redo()); }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCells.length > 0) {
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        console.log('Deleting cells:', selectedCells);
        e.preventDefault();
        dispatch(setCellsValue({ cellIds: selectedCells, value: '' }));
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dispatch, selectedCells]);

  const getCol = (i: number) => String.fromCharCode(65 + i);

  const getCellRange = (start: string, end: string): string[] => {
    const sc = start.match(/[A-Z]+/)?.[0] || 'A';
    const sr = parseInt(start.match(/\d+/)?.[0] || '1');
    const ec = end.match(/[A-Z]+/)?.[0] || 'A';
    const er = parseInt(end.match(/\d+/)?.[0] || '1');
    const minC = Math.min(sc.charCodeAt(0),
    ec.charCodeAt(0));
    const maxC = Math.max(sc.charCodeAt(0), ec.charCodeAt(0));
    const minR = Math.min(sr, er);
    const maxR = Math.max(sr, er);
    const result: string[] = [];
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        result.push(`${String.fromCharCode(c)}${r}`);
      }
    }
    return result;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editCell) return;
    const key = e.key;
    if ((key.length === 1 || key === '=') && !e.ctrlKey && !e.metaKey && selectedCells.length > 0) {
      e.preventDefault();
      const firstCell = selectedCells[selectedCells.length - 1];
      setEditCell(firstCell);
      setEditVal(key === '=' ? '=' : key);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  const getSelectionDisplay = () => {
    if (selectedCells.length === 0) return '—';
    if (selectedCells.length === 1) return selectedCells[0];
    
    let minC = 999, maxC = 0, minR = 9999, maxR = 0;
    selectedCells.forEach(cell => {
      const col = cell.match(/[A-Z]+/)?.[0] || '';
      const row = parseInt(cell.match(/\d+/)?.[0] || '0');
      if (col.charCodeAt(0) < minC) minC = col.charCodeAt(0);
      if (col.charCodeAt(0) > maxC) maxC = col.charCodeAt(0);
      if (row < minR) minR = row;
      if (row > maxR) maxR = row;
    });
    
    const start = `${String.fromCharCode(minC)}${minR}`;
    const end = `${String.fromCharCode(maxC)}${maxR}`;
    return start === end ? start : `${start}:${end}`;
  };

  return (
    <div style={{ userSelect: 'none' }} onKeyDown={handleKeyDown} tabIndex={0}>
      <div style={{ padding: 5, background: '#eee', fontSize: 12 }}>
        <span>Выделено: {getSelectionDisplay()} | Статус: {saveStatus === 'saving' ? 'Сохранение..' : saveStatus === 'saved' ? 'Сохранено' : '—'}</span>
        <button onClick={() => dispatch(undo())} style={{ marginLeft: 10 }}>↩</button>
        <button onClick={() => dispatch(redo())}>↪</button>
        <span style={{ marginLeft: 20 }}>Формула: </span>
        <input 
          value={formulaBarVal} 
          onChange={e => setFormulaBarVal(e.target.value)} 
          onKeyDown={e => { 
            e.stopPropagation(); 
            if (e.key === 'Enter' && selectedCells.length > 0) { 
              e.preventDefault(); 
              dispatch(setCellsValue({ cellIds: selectedCells, value: formulaBarVal })); 
              (e.target as HTMLInputElement).blur();
            } 
          }}
          style={{ width: 300, border: '1px solid #ccc', padding: '2px 4px' }}
        />
      </div>
      
      <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 100px)' }} onMouseDown={e => {
        const target = e.target as HTMLElement;
        const td = target.closest('td');
        if (!td || td.getAttribute('data-row')) return;
        const cellId = td.getAttribute('data-cell');
        if (!cellId) return;
        e.preventDefault();
        if (e.shiftKey && selectedCells.length > 0) {
          const start = selectedCells[0];
          const cells = getCellRange(start, cellId);
          dispatch(selectCells(cells));
        } else {
          dispatch(selectCell(cellId));
        }
      }} onMouseMove={e => {
        if (e.buttons !== 1) return;
        const target = e.target as HTMLElement;
        const td = target.closest('td');
        if (!td || td.getAttribute('data-row')) return;
        const cellId = td.getAttribute('data-cell');
        if (cellId) {
          if (selectedCells.includes(cellId)) return;
          const anchor = selectedCells[0] || dragStart;
          if (!dragStart && selectedCells.length > 0) {
            const cells = getCellRange(selectedCells[0], cellId);
            dispatch(selectCells(cells));
          } else if (anchor) {
            const cells = getCellRange(anchor, cellId);
            dispatch(selectCells(cells));
          }
        }
      }} onMouseUp={() => { setDragStart(null); }}>
        <table style={{


borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 40, background: '#f1f1f1' }}></th>
              {Array(cols).fill(0).map((_, i) => (
                <th key={i} style={{ width: colWidths[getCol(i)] || 80, background: '#f1f1f1', border: '1px solid #ccc', position: 'relative' }}>
                  {getCol(i)}
                  <div style={{ position: 'absolute', right: 0, top: 0, width: 4, height: '100%', cursor: 'col-resize' }} onMouseDown={e => {
                    e.stopPropagation();
                    const start = e.clientX, startW = colWidths[getCol(i)] || 80;
                    const move = (me: MouseEvent) => dispatch(setColWidth({ col: getCol(i), width: Math.max(40, startW + me.clientX - start) }));
                    document.addEventListener('mousemove', move);
                    document.addEventListener('mouseup', () => document.removeEventListener('mousemove', move), { once: true });
                  }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array(rows).fill(0).map((_, r) => {
              const row = r + 1;
              return (
                <tr key={row}>
                  <td data-row="true" style={{ background: '#f1f1f1', border: '1px solid #ccc', textAlign: 'center', height: rowHeights[row] || 20 }}>{row}</tr>
                  {Array(cols).fill(0).map((_, c) => {
                    const cellId = `${getCol(c)}${row}`;
                    const cell = cells[cellId] || { formattedValue: '', bold: false, italic: false, bgColor: '#fff', textColor: '#000', align: 'left', value: '' };
                    const isSelected = selectedCells.includes(cellId);
                    return (
                      <td key={cellId} data-cell={cellId} onDoubleClick={() => { setEditCell(cellId); setEditVal(cells[cellId]?.value || ''); }} onContextMenu={e => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, row, col: getCol(c) }); }}
                        style={{ border: '1px solid #ccc', padding: '2px 4px', height: rowHeights[row] || 20, backgroundColor: isSelected ? '#e3f2fd' : cell.bgColor, color: cell.textColor, fontWeight: cell.bold ? 'bold' : 'normal', fontStyle: cell.italic ? 'italic' : 'normal', textAlign: cell.align as 'left' | 'center' | 'right' }}>
                        {editCell === cellId ? (
                          <input autoFocus ref={inputRef} value={editVal} onChange={e => setEditVal(e.target.value)} onBlur={() => { dispatch(setCellValue({ cellId, value: editVal })); setEditCell(null); }} onKeyDown={e => { if (e.key === 'Escape') { setEditCell(null); } if (e.key === 'Enter') { dispatch(setCellValue({ cellId, value: editVal })); setEditCell(null); } }} style={{ width: '100%', border: 'none', boxSizing: 'border-box' }} />
                        ) : (
                          cell.formattedValue || ''
                        )}
                      </td>
                    );
                  })}
                <tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Контекстное меню с кнопками B, I */}
      {ctx && (
        <div style={{ position: 'fixed', top: ctx.y, left: ctx.x, background: 'white', border: '1px solid #ccc', padding: 5, zIndex: 1000 }}>
          <button onClick={() => { dispatch(addRow()); setCtx(null); }}>+ строку</button>
          <button onClick={() => { dispatch(deleteRow(ctx.row)); setCtx(null); }}>- строку</button>
          <button onClick={() => { dispatch(addCol()); setCtx(null); }}>+ столбец</button>
          <button onClick={() => { dispatch(deleteCol(ctx.col)); setCtx(null); }}>- столбец</button>
          <hr />
          {/* Кнопки B (жирный) и I (курсив) */}
          <button onClick={() => { dispatch(setCellsStyle({ cellIds: selectedCells.length > 0 ? selectedCells : [ctx.col + ctx.row], style: { bold: !cells[ctx.col + ctx.row]?.bold } })); setCtx(null); }}>B</button>
          <button


onClick={() => { dispatch(setCellsStyle({ cellIds: selectedCells.length > 0 ? selectedCells : [ctx.col + ctx.row], style: { italic: !cells[ctx.col + ctx.row]?.italic } })); setCtx(null); }}>I</button>
        </div>
      )}
      
      {/* Затемнение фона при открытом контекстном меню */}
      {ctx && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setCtx(null)} />}
    </div>
  );
};