import express from 'express';
// Імпортуємо функцію захисту (middleware)
import { authenticateToken as protect } from '../middleware/auth.js'; 
import { db } from '../index.js';

const router = express.Router();

// ------------------------------------------------------------------
// 1. [GET /api/profile] - Отримати дані профілю
// ------------------------------------------------------------------
router.get('/', protect, async (req, res) => {
    // Middleware 'protect' перевірив токен і додав дані користувача до req.user.
    const userId = req.user.id; 
    const rid = req.rid ? `[${req.rid}] ` : ''; 

    try {
        // Вибираємо всі необхідні поля для відображення на сторінці "Мій кабінет"
        const [users] = await db.promise().query(
            'SELECT user_id, username, email, profile_photo_url, registration_date, role FROM Users WHERE user_id = ?', 
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Користувача не знайдено.' });
        }

        res.status(200).json(users[0]);

    } catch (error) {
        console.error(`${rid}Помилка отримання профілю:`, error);
        res.status(500).json({ message: "Помилка сервера під час завантаження профілю." });
    }
});

// ------------------------------------------------------------------
// 2. [PUT /api/profile] - Оновити логін/ім'я користувача
// ------------------------------------------------------------------
router.put('/', protect, async (req, res) => {
    const userId = req.user.id;
    const { username } = req.body;
    const rid = req.rid ? `[${req.rid}] ` : ''; 
    
    // Валідація
    if (!username || username.trim().length < 3) {
        return res.status(400).json({ message: "Ім'я користувача має бути не менше 3 символів." });
    }

    try {
        // 1. Перевірка унікальності нового імені
        const [existingUsers] = await db.promise().query(
            // Шукаємо, чи існує інший користувач з цим новим іменем
            'SELECT user_id FROM Users WHERE username = ? AND user_id != ?', 
            [username, userId]
        );
        
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: "Користувач з таким іменем вже існує." });
        }

        // 2. Оновлення імені
        await db.promise().query(
            'UPDATE Users SET username = ? WHERE user_id = ?',
            [username, userId]
        );
        
        res.status(200).json({ message: 'Логін успішно оновлено!', username });
        
    } catch (error) {
        console.error(`${rid}Помилка оновлення профілю:`, error);
        res.status(500).json({ message: "Помилка сервера під час оновлення логіну." });
    }
});

// ------------------------------------------------------------------
// 3. [PUT /api/profile/photo] - Логіка для зміни фотографії
//    ПОТРЕБУЄ Multer!
// ------------------------------------------------------------------
// Ми реалізуємо це пізніше, після налаштування Multer

export default router;