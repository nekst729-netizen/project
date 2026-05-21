import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Document {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: any;
}

const initialState: { documents: Document[] } = {
  documents: []
};

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    loadDocuments: (state, action: PayloadAction<Document[]>) => { state.documents = action.payload; },
    createDocument: (state, action: PayloadAction<{ name: string; rows: number; cols: number }>) => {
      const newDoc = { id: Date.now().toString(), name: action.payload.name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), data: { rows: action.payload.rows, cols: action.payload.cols, cells: {} } };
      state.documents.unshift(newDoc);
      localStorage.setItem('documents', JSON.stringify(state.documents));
    },
    updateDocument: (state, action: PayloadAction<{ id: string; name?: string; data?: any }>) => {
      const doc = state.documents.find(d => d.id === action.payload.id);
      if (doc) {
        if (action.payload.name) doc.name = action.payload.name;
        if (action.payload.data) doc.data = action.payload.data;
        doc.updatedAt = new Date().toISOString();
      }
      localStorage.setItem('documents', JSON.stringify(state.documents));
    },
    deleteDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(d => d.id !== action.payload);
      localStorage.setItem('documents', JSON.stringify(state.documents));
    },
    duplicateDocument: (state, action: PayloadAction<string>) => {
      const original = state.documents.find(d => d.id === action.payload);
      if (original) {
        const copyRegex = /^(.+)\s\(копия\s*(\d*)\)$/;
        const match = original.name.match(copyRegex);
        let newName;
        if (match) {
          const baseName = match[1];
          const num = match[2] ? parseInt(match[2]) + 1 : 2;
          newName = `${baseName} (копия ${num})`;
        } else {
          newName = `${original.name} (копия)`;
        }
        state.documents.unshift({ ...original, id: Date.now().toString(), name: newName, createdAt: new Date().toISOString() });
        localStorage.setItem('documents', JSON.stringify(state.documents));
      }
    },
  },
});

export const { loadDocuments, createDocument, updateDocument, deleteDocument, duplicateDocument } = documentsSlice.actions;
export default documentsSlice.reducer;