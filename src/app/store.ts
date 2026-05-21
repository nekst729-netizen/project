import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import documentsReducer from '../features/documentsSlice';
import spreadsheetReducer from '../features/spreadsheetSlice';

export const store = configureStore({
  reducer: { auth: authReducer, documents: documentsReducer, spreadsheet: spreadsheetReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
