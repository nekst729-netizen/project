import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: { id: string; name: string; email: string; registeredAt: string } | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = { user: null, isAuthenticated: false };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ email: string; password: string }>) => {
      state.user = { id: '1', name: action.payload.email.split('@')[0], email: action.payload.email, registeredAt: new Date().toISOString() };
      state.isAuthenticated = true;
      localStorage.setItem('token', 'mock');
    },
    register: (state, action: PayloadAction<{ name: string; email: string; password: string }>) => {
      state.user = { id: Date.now().toString(), name: action.payload.name, email: action.payload.email, registeredAt: new Date().toISOString() };
      state.isAuthenticated = true;
      localStorage.setItem('token', 'mock');
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    updateProfile: (state, action: PayloadAction<{ name: string }>) => {
      if (state.user) state.user.name = action.payload.name;
    },
  },
});

export const { login, register, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
