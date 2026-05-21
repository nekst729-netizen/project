import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const


evalFormula = (formula: string, cells: Record<string, any>): string => {
  if (!formula.startsWith('=')) return formula;
  let expr = formula.slice(1);
  
  const getCellVal = (ref: string): number | null => {
    const cell = cells[ref];
    if (!cell || cell.value === '' || cell.value === undefined) return null;
    const raw = cell.formattedValue !== undefined && !cell.formattedValue.startsWith('=') ? cell.formattedValue : cell.value || '';
    const num = parseFloat(raw);
    return isNaN(num) ? null : num;
  };
  
  const getRange = (start: string, end: string): number[] => {
    const sc = start.match(/[A-Z]+/)?.[0] || 'A';
    const sr = parseInt(start.match(/\d+/)?.[0] || '1');
    const ec = end.match(/[A-Z]+/)?.[0] || 'A';
    const er = parseInt(end.match(/\d+/)?.[0] || '1');
    const out: number[] = [];
    for (let c = sc.charCodeAt(0); c <= ec.charCodeAt(0); c++) {
      for (let r = sr; r <= er; r++) {
        const v = getCellVal(`${String.fromCharCode(c)}${r}`);
        if (v !== null) out.push(v);
      }
    }
    return out;
  };
  
  expr = expr.replace(/SUM\s*\(\s*([A-Z]+\d+)\s*:\s*([A-Z]+\d+)\s*\)/gi, (_, s, e) => getRange(s, e).reduce((a, b) => a + b, 0).toString());
  expr = expr.replace(/AVERAGE\s*\(\s*([A-Z]+\d+)\s*:\s*([A-Z]+\d+)\s*\)/gi, (_, s, e) => { const v = getRange(s, e); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toString() : '0'; });
  expr = expr.replace(/([A-Z]+\d+)/g, m => { const v = getCellVal(m); return v !== null ? v.toString() : '0'; });
  
  try {
    const r = Function('"use strict"; return (' + expr + ')')();
    return typeof r === 'number' && !isNaN(r) ? r.toString() : '#ОШИБКА';
  } catch { return '#ОШИБКА'; }
};

const initialState = {
  cells: {} as Record<string, { value: string; formattedValue: string; bold: boolean; italic: boolean; bgColor: string; textColor: string; align: string }>,
  selectedCells: [] as string[],
  rows: 100,
  cols: 26,
  colWidths: {} as Record<string, number>,
  rowHeights: {} as Record<number, number>,
  history: [] as { cells: any }[],
  historyIndex: -1,
};

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    setCellValue: (state, action: PayloadAction<{ cellId: string; value: string }>) => {
      if (state.historyIndex < state.history.length - 1) state.history = state.history.slice(0, state.historyIndex + 1);
      const newCells = JSON.parse(JSON.stringify(state.cells));
      if (!newCells[action.payload.cellId]) newCells[action.payload.cellId] = { value: '', formattedValue: '', bold: false, italic: false, bgColor: '#fff', textColor: '#000', align: 'left' };
      newCells[action.payload.cellId].value = action.payload.value;
      newCells[action.payload.cellId].formattedValue = action.payload.value.startsWith('=') ? evalFormula(action.payload.value, newCells) : action.payload.value;
      state.history.push({ cells: newCells });
      state.historyIndex = state.history.length - 1;
      state.cells = newCells;
    },
    setCellsValue: (state, action: PayloadAction<{ cellIds: string[]; value: string }>) => {
      if (state.historyIndex < state.history.length - 1) state.history = state.history.slice(0, state.historyIndex + 1);
      const newCells = JSON.parse(JSON.stringify(state.cells));
      action.payload.cellIds.forEach(cellId => {
        if (!newCells[cellId]) newCells[cellId] = { value: '', formattedValue: '', bold: false, italic: false, bgColor: '#fff', textColor: '#000', align: 'left' };
        newCells[cellId].value = action.payload.value;
        newCells[cellId].formattedValue = action.payload.value.startsWith('=') ? evalFormula(action.payload.value, newCells) : action.payload.value;
      });
      state.history.push({ cells: newCells });
      state.historyIndex = state.history.length - 1;
      state.cells = newCells;
    },
    selectCell: (state, action: PayloadAction<string>) => { state.selectedCells = [action.payload]; },
    selectCells: (state, action:


PayloadAction<string[]>) => { state.selectedCells = action.payload; },
    addToSelection: (state, action: PayloadAction<string>) => { if (!state.selectedCells.includes(action.payload)) state.selectedCells.push(action.payload); },
    clearSelection: (state) => { state.selectedCells = []; },
    setCellStyle: (state, action: PayloadAction<{ cellId: string; style: any }>) => {
      if (!state.cells[action.payload.cellId]) state.cells[action.payload.cellId] = { value: '', formattedValue: '', bold: false, italic: false, bgColor: '#fff', textColor: '#000', align: 'left' };
      Object.assign(state.cells[action.payload.cellId], action.payload.style);
    },
    setCellsStyle: (state, action: PayloadAction<{ cellIds: string[]; style: any }>) => {
      if (state.historyIndex < state.history.length - 1) state.history = state.history.slice(0, state.historyIndex + 1);
      const newCells = JSON.parse(JSON.stringify(state.cells));
      action.payload.cellIds.forEach(cellId => {
        if (!newCells[cellId]) newCells[cellId] = { value: '', formattedValue: '', bold: false, italic: false, bgColor: '#fff', textColor: '#000', align: 'left' };
        Object.assign(newCells[cellId], action.payload.style);
      });
      state.history.push({ cells: newCells });
      state.historyIndex = state.history.length - 1;
      state.cells = newCells;
    },
    undo: (state) => { 
      if (state.history.length === 0) return;
      if (state.historyIndex > 0) { 
        state.historyIndex--;
        state.cells = JSON.parse(JSON.stringify(state.history[state.historyIndex].cells));
      } else if (state.historyIndex === 0) {
        state.historyIndex = -1;
        state.cells = JSON.parse(JSON.stringify(state.history[0].cells));
      }
    },
    redo: (state) => { 
      if (state.historyIndex < state.history.length - 1) { 
        state.historyIndex++;
        state.cells = JSON.parse(JSON.stringify(state.history[state.historyIndex].cells));
      }
    },
    setColWidth: (state, action: PayloadAction<{ col: string; width: number }>) => { state.colWidths[action.payload.col] = action.payload.width; },
    setRowHeight: (state, action: PayloadAction<{ row: number; height: number }>) => { state.rowHeights[action.payload.row] = action.payload.height; },
    addRow: (state) => { state.history.push({ cells: JSON.parse(JSON.stringify(state.cells)) }); state.historyIndex = state.history.length - 1; state.rows++; },
    addCol: (state) => { state.history.push({ cells: JSON.parse(JSON.stringify(state.cells)) }); state.historyIndex = state.history.length - 1; state.cols++; },
    deleteRow: (state, action: PayloadAction<number>) => {
      if (state.rows > 1) {
        state.history.push({ cells: JSON.parse(JSON.stringify(state.cells)) });
        state.historyIndex = state.history.length - 1;
        state.rows--;
        Object.keys(state.cells).forEach(key => {
          const match = key.match(/[A-Z]+(\d+)/);
          if (match && parseInt(match[1]) === action.payload) delete state.cells[key];
        });
      }
    },
    deleteCol: (state, action: PayloadAction<string>) => {
      if (state.cols > 1) {
        state.history.push({ cells: JSON.parse(JSON.stringify(state.cells)) });
        state.historyIndex = state.history.length - 1;
        state.cols--;
        Object.keys(state.cells).forEach(key => {
          const match = key.match(/([A-Z]+)\d+/);
          if (match && match[1] === action.payload) delete state.cells[key];
        });
      }
    },
    loadDocument: (_state, action: PayloadAction<any>) => { 
      return { 
        ...initialState, 
        rows: action.payload.rows ?? 100, 
        cols: action.payload.cols ?? 26, 
        cells: action.payload.cells || {}, 
        colWidths: action.payload.colWidths || {}, 
        rowHeights: action.payload.rowHeights || {},
        history: action.payload.history || [],
        historyIndex: action.payload.history ? action.payload.history.length - 1 : -1,
      }; 
    },
  },
});

export const {


setCellValue, 
  setCellsValue, 
  selectCell, 
  selectCells, 
  addToSelection, 
  clearSelection, 
  setCellStyle, 
  setCellsStyle, 
  undo, 
  redo, 
  setColWidth, 
  setRowHeight, 
  addRow, 
  addCol, 
  deleteRow, 
  deleteCol, 
  loadDocument 
} = spreadsheetSlice.actions;
export default spreadsheetSlice.reducer;