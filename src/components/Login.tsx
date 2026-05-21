import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { login } from '../features/authSlice';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password.length >= 3) {
      dispatch(login({ email, password }));
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Вход</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br />
        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} /><br />
        <button type="submit">Войти</button>
      </form>
      <Link to="/register">Регистрация</Link>
    </div>
  );
};
