// profile/Profile.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css'; 

function ProfilePage() {
    const [profile, setProfile] = useState(null);
    const [newUsername, setNewUsername] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // 1. ФУНКЦІЯ ЗАВАНТАЖЕННЯ ДАНИХ ПРОФІЛЮ (GET)
    const fetchProfile = async () => {
        // ... (логіка, яка вже була раніше)
        setLoading(true);
        const token = localStorage.getItem('authToken');
        
        if (!token) { navigate('/login'); return; }

        try {
            const response = await fetch('http://localhost:5000/api/profile', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();

            if (response.ok) {
                setProfile(data);
                setNewUsername(data.username); 
            } else {
                setError(data.message || 'Помилка завантаження профілю.');
                if (response.status === 401) {
                    localStorage.removeItem("user");
                    localStorage.removeItem("authToken");
                    navigate('/login');
                }
            }
        } catch (err) { setError('Помилка з\'єднання з сервером.'); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchProfile(); }, []);

    // 2. ФУНКЦІЯ ОНОВЛЕННЯ ЛОГІНУ (PUT)
    const handleUpdateUsername = async (e) => {
        e.preventDefault();
        setMessage(''); setError('');
        
        if (newUsername.trim() === (profile ? profile.username : '')) {
             return setMessage('Логін не змінено.');
        }
        
        // ... (логіка PUT-запиту до /api/profile)

        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch('http://localhost:5000/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ username: newUsername }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setProfile(prev => ({ ...prev, username: newUsername }));
                // Оновлюємо також localStorage, щоб Header оновився
                const savedUser = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({...savedUser, username: newUsername}));
            } else {
                setError(data.message || 'Помилка оновлення профілю.');
            }
        } catch (err) {
            setError('Помилка мережі при оновленні.');
        }
    };
    
    // 3. ЗАГЛУШКА ДЛЯ ФОТО (потребує бекенд-логіки)
    const handlePhotoChange = (e) => {
        // Тут буде логіка відправки файлу на сервер
        setMessage('Функціонал завантаження фото в розробці...');
    };


    if (loading) return <div className="profile-loading">Завантаження профілю...</div>;
    // Запобігаємо збою, якщо profile null після помилки
    if (error && !profile) return <div className="profile-error">Помилка: {error}</div>;


    // 4. РОЗМІТКА
    return (
        <div className="profile-container">
            <h2 className="profile-title">Мій кабінет</h2>
            
            {message && <p className="profile-message success">{message}</p>}
            {error && <p className="profile-message error">{error}</p>}
            
            <div className="profile-details">
                <div className="profile-photo-section">
                    <img 
                        // Якщо profile_photo_url порожнє, використовуємо default-avatar.png
                        src={profile.profile_photo_url || '/default-avatar.png'} 
                        alt="Фото профілю" 
                        className="profile-avatar" 
                    />
                    <button onClick={handlePhotoChange} className="btn-small">Змінити фото</button>
                </div>

                <div className="profile-info-section">
                    <h3>Основна інформація</h3>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>ID:</strong> {profile.user_id}</p>
                    <p><strong>Роль:</strong> {profile.role}</p> 
                    
                    <form onSubmit={handleUpdateUsername} className="profile-form">
                        <label htmlFor="username">Логін / Ім'я:</label>
                        <input
                            type="text"
                            id="username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn-primary">Зберегти логін</button>
                    </form>
                </div>
            </div>
            
            <hr />
            
            <div className="profile-basket-idea">
                <h3>Історія замовлень / Кошик</h3>
                <p>Тут відображатиметься ваш поточний кошик та історія покупок. **ID вашого кошика:** [логіка кошика реалізується через окрему таблицю, пов'язану з <strong>{profile.user_id}</strong>]</p>
                <button className="btn-secondary" onClick={() => navigate('/cart')}>Перейти до кошика</button>
            </div>
        </div>
    );
}

export default ProfilePage;