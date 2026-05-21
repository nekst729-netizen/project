import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from './app/hooks';
import { logout } from './features/authSlice';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';
import { Spreadsheet } from './components/Spreadsheet';
import { Profile } from './components/Profile';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAppSelector(s => s.auth);
  const dispatch = useAppDispatch();
  if (!isAuthenticated) return <>{children}</>;
  return (
    <div>
      <div style={{ background: '#333', color: 'white', padding: '5px 10px', display: 'flex', gap: 20 }}>
        <Link to="/dashboard" style={{ color: 'white' }}>Документы</Link>
        <Link to="/profile" style={{ color: 'white' }}>Профиль</Link>
        <span style={{ flex: 1 }}></span>
        <span>{user?.name}</span>
        <button onClick={() => dispatch(logout())}>Выйти</button>
      </div>
      {children}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents/:documentId" element={<Spreadsheet />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
