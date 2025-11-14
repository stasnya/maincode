// backend/api/ProductController.js
import express from "express";
import { db } from "../index.js"; 
// === 1. КРИТИЧНО: ІМПОРТУЄМО MIDDLEWARE ===
import { authenticateToken, authorizeAdmin } from "../middleware/authMiddleware.js"; 
// ======================================
const router = express.Router();

/**
 * @param {string} entityType 
 * @returns {object}
 */
const createCrudHandlers = (entityType) => {
    const table = entityType;
    const idField = 'ID'; 

    return {
        // ... (getAll, getById залишаються без змін) ...
        getAll: (req, res) => {
            db.query(`SELECT * FROM ${table}`, (err, results) => {
                if (err) return res.status(500).json({ error: "DBError", message: err.message });
                res.json(results);
            });
        },
        getById: (req, res) => {
            const id = req.params.id;
            db.query(`SELECT * FROM ${table} WHERE ${idField} = ?`, [id], (err, results) => {
                if (err) return res.status(500).json({ error: "DBError", message: err.message });
                res.json(results[0] || null);
            });
        },
        create: (req, res) => {
            const { Title, Artist, Genre, Published, Price, Country, Photo } = req.body;
            const sql = `
                INSERT INTO ${table} (Title, Artist, Genre, Published, Price, Country, Photo)
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql, [Title, Artist, Genre, Published, Price, Country, Photo], (err, result) => {
                if (err) return res.status(500).json({ error: "DBError", message: err.message });
                res.status(201).json({ ID: result.insertId, message: `${entityType} додано` });
            });
        },
        update: (req, res) => {
            const id = req.params.id;
            const { Title, Artist, Genre, Published, Price, Country, Photo } = req.body;
            const sql = `
                UPDATE ${table}
                SET Title = ?, Artist = ?, Genre = ?, Published = ?, Price = ?, Country = ?, Photo = ?
                WHERE ${idField} = ?`;
            db.query(sql, [Title, Artist, Genre, Published, Price, Country, Photo, id], (err) => {
                if (err) return res.status(500).json({ error: "DBError", message: err.message });
                res.json({ message: `${entityType} оновлено` });
            });
        },
        delete: (req, res) => {
            const id = req.params.id;
            db.query(`DELETE FROM ${table} WHERE ${idField} = ?`, [id], (err) => {
                if (err) return res.status(500).json({ error: "DBError", message: err.message });
                res.status(204).send();
            });
        }
    };
};

const vinylHandlers = createCrudHandlers('Vinyls');
const cassetteHandlers = createCrudHandlers('Cassettes');

router.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// =========================================================
// VINYLS ROUTES: GET доступні всім. POST/PUT/DELETE - ТІЛЬКИ АДМІНУ
// =========================================================
router.get("/vinyls", vinylHandlers.getAll);
router.get("/vinyls/:id", vinylHandlers.getById);

// 2. ЗАСТОСУВАННЯ ЗАХИСТУ:
router.post("/vinyls", authenticateToken, authorizeAdmin, vinylHandlers.create);
router.put("/vinyls/:id", authenticateToken, authorizeAdmin, vinylHandlers.update);
router.delete("/vinyls/:id", authenticateToken, authorizeAdmin, vinylHandlers.delete);

// =========================================================
// CASSETTES ROUTES: GET доступні всім. POST/PUT/DELETE - ТІЛЬКИ АДМІНУ
// =========================================================
router.get("/cassettes", cassetteHandlers.getAll);
router.get("/cassettes/:id", cassetteHandlers.getById);

// 2. ЗАСТОСУВАННЯ ЗАХИСТУ:
router.post("/cassettes", authenticateToken, authorizeAdmin, cassetteHandlers.create);
router.put("/cassettes/:id", authenticateToken, authorizeAdmin, cassetteHandlers.update);
router.delete("/cassettes/:id", authenticateToken, authorizeAdmin, cassetteHandlers.delete);

export default router;