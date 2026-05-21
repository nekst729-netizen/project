import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../app/hooks';
import { register } from '../features/authSlice';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password.length >= 3) {
      dispatch(register({ name, email, password }));
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Регистрация</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Имя" value={name} onChange={e => setName(e.target.value)} /><br />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br />
        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} /><br />
        <button type="submit">Зарегистрироваться</button>
      </form>
      <Link to="/login">Вход</Link>
    </div>
  );
};
