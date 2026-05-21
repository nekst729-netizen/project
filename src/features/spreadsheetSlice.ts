import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const evalFormula = (formula: string, cells: Record<string, any>): string => {
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
    selectCell: (state, action: PayloadAction<string>) => { state.selectedCells = [action.payload]; },
    selectCells: (state, action: PayloadAction<string[]>) => { state.selectedCells = action.payload; },
    addToSelection: (state, action: PayloadAction<string>) => { if (!state.selectedCells.includes(action.payload)) state.selectedCells.push(action.payload); },
    clearSelection: (state) => { state.selectedCells = []; },
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
      if


    (state.historyIndex < state.history.length - 1) { 
        state.historyIndex++;
        state.cells = JSON.parse(JSON.stringify(state.history[state.historyIndex].cells));
      }
    },
  },
});

export const { setCellValue, selectCell, selectCells, addToSelection, clearSelection, undo, redo } = spreadsheetSlice.actions;
export default spreadsheetSlice.reducer;