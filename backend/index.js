import express from "express";
import mysql from "mysql2";
import cors from "cors";
import { v4 as uuidv4 } from 'uuid';
// Імпорт усіх контролерів
import productController from "./api/productController.js";
import reviewController from "./api/reviewController.js";
import authController from "./api/authController.js";
import profileController from "./api/profileController.js"; // Впевнені, що файл існує

const app = express();
const PORT = 5000;

// Видаляємо дублювання middleware
app.use(cors());
app.use(express.json());
app.use(cors({
    exposedHeaders: ['Retry-After', 'X-Request-Id'],
}));
// Примітка: app.use(express.json()) можна залишити лише один раз

export const db = mysql.createPool({
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    host: "26.210.121.124",
    user: "stasnya",
    password: "Aa20061095!",
    database: "music_catalog"
});

const rate = new Map();
const WINDOW_MS = 10_000, MAX_REQ = 5;
const now = () => Date.now();

// Middleware для Request ID
app.use((req, res, next) => {
    const rid = req.get("X-Request-Id") || uuidv4();
    req.rid = rid;
    res.setHeader("X-Request-Id", rid);
    next();
});

// Middleware для Rate Limiting
app.use((req, res, next) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local";
    const b = rate.get(ip) ?? { count: 0, ts: now() };
    const within = now() - b.ts < WINDOW_MS;
    const state = within ? { count: b.count + 1, ts: b.ts } : { count: 1, ts: now() };
    rate.set(ip, state);
    if (state.count > MAX_REQ) {
        res.setHeader("Retry-After", "2");
        return res.status(429).json({ error: "too_many_requests", requestId: req.rid });
    }
    next();
});

// Закоментований блок імітації затримок та помилок (залишаємо як є)

// --------------------------------------------------------
// ПІДКЛЮЧЕННЯ МАРШРУТІВ
// --------------------------------------------------------

// 1. Маршрути авторизації (/api/register, /api/login)
app.use("/api", authController); 

// 2. Маршрути профілю (/api/profile, /api/profile/photo, etc.)
// Це виправляє помилку 404 на /api/profile
app.use("/api/profile", profileController); 

// 3. Маршрути продуктів та відгуків
app.use("/api", productController); 
app.use("/api", reviewController);

// Статичні файли
app.use("/uploads", express.static("uploads")); 

app.get("/", (req, res) => {
    res.send("API працює! Маршрути підключено.");
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});