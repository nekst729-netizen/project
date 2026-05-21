import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { updateProfile } from '../features/authSlice';

export const Profile = () => {
  const { user } = useAppSelector(s => s.auth);
  const { documents } = useAppSelector(s => s.documents);
  const dispatch = useAppDispatch();
  const [name, setName] = useState(user?.name || '');

  return (
    <div style={{ padding: 20 }}>
      <h2>Профиль</h2>
      <p>Email: {user?.email}</p>
      <p>Документов: {documents.length}</p>
      <p>Регистрация: {user?.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : ''}</p>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={() => dispatch(updateProfile({ name }))}>Сменить имя</button>
    </div>
  );
};
