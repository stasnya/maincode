import jwt from 'jsonwebtoken';
import { db } from '../index.js';
// ВАЖЛИВО: ЦЕЙ КЛЮЧ ПОВИНЕН ЗБІГАТИСЯ З КЛЮЧЕМ В authController.js!
const JWT_SECRET = 'YOUR_SUPER_SECRET_KEY_FOR_JWT'; 

// 1. Middleware для перевірки, чи користувач залогінений (автентифікація)
export const authenticateToken = (req, res, next) => {
    // Токен очікується в заголовку Authorization у форматі: Bearer [токен]
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        // 401: Unauthorized (Немає токена)
        return res.status(401).json({ message: 'Потрібна автентифікація (токен відсутній).' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // 403: Forbidden (Невалідний токен, прострочений, тощо)
            return res.status(403).json({ message: 'Недійсний або прострочений токен.' });
        }
        
        // Успішно: Додаємо дані користувача (id, username, role) до запиту
        req.user = user; 
        next(); // Продовжуємо виконання запиту
    });
};

// 2. Middleware для перевірки ролі Адміна (авторизація)
export const authorizeAdmin = (req, res, next) => {
    // req.user було встановлено в попередній функції authenticateToken
    if (req.user && req.user.role === 'Admin') {
        next(); // Користувач — Адмін, дозволяємо
    } else {
        // 403: Forbidden (Недостатньо прав)
        res.status(403).json({ message: 'Доступ заборонено: Потрібні права Адміністратора.' });
    }
};

// 3. Middleware для перевірки прав Юзера (для змін, дозволених всім, наприклад, коментарів)
// Достатньо, щоб користувач був залогінений (User або Admin)
export const authorizeUser = (req, res, next) => {
    if (req.user && (req.user.role === 'User' || req.user.role === 'Admin')) {
        next(); 
    } else {
        res.status(403).json({ message: 'Доступ заборонено: Потрібно бути залогіненим користувачем.' });
    }
};

export const isReviewAuthor = async (req, res, next) => { // <<< ДОДАНО async
    const reviewId = req.params.id;
    
    // 1. Адмін має повний доступ
    if (req.user && req.user.role === 'Admin') {
        return next();
    }
    
    const userIdFromToken = req.user.id; 
    
    const findReviewSql = `
        SELECT userId FROM ReviewsVinyls WHERE ID = ? 
        UNION ALL 
        SELECT userId FROM ReviewsCassettes WHERE ID = ?
    `;
    
    try {
        // 2. Використовуємо db.promise() для надійної роботи з асинхронним кодом
        const [results] = await db.promise().query(findReviewSql, [reviewId, reviewId]); 
        
        const review = results[0];
        
        if (!review) {
            // Якщо коментар не знайдено, ми зазвичай дозволяємо операцію DELETE пройти
            // (щоб не розкривати, існує коментар чи ні), але для PUT повертаємо 404.
            // Тут повертаємо 404, щоб не допустити PUT.
            return res.status(404).json({ message: 'Коментар не знайдено.' });
        }

        // 3. Перевірка авторства
        if (review.userId === userIdFromToken) {
            next(); // Користувач — автор, дозволяємо
        } else {
            res.status(403).json({ message: 'Forbidden: Ви можете редагувати лише власні коментарі.' });
        }
    } catch (err) {
        console.error("DB Error in isReviewAuthor:", err);
        res.status(500).json({ message: 'Внутрішня помилка сервера при перевірці авторства.' });
    }
};