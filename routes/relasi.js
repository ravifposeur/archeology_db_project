const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isVerifier, isAdmin } = require('../middleware/auth');

router.get('/penelitian/by-situs/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const PenelitianSitusquery = `
            SELECT a.arkeolog_id, a.nama_lengkap, a.spesialisasi 
            FROM arkeolog a
            JOIN penelitian_situs ps ON a.arkeolog_id = ps.arkeolog_id
            WHERE ps.situs_id = $1
        `;
        const result = await pool.query(PenelitianSitusquery, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error GET penelitian by-situs:', error);
        res.status(500).json({ message: 'Error server.' });   
    }
});

router.post('/penelitian', authenticateToken, isVerifier, async (req, res) => {
    try {
        const { arkeolog_id, situs_id } = req.body;
        const result = await pool.query(
            "INSERT INTO penelitian_situs (arkeolog_id, situs_id) VALUES ($1, $2) RETURNING *",
            [arkeolog_id, situs_id]
        );
        res.status(201).json({ message: 'Relasi penelitian berhasil dibuat', data: result.rows[0] });
    } catch (error) {
        if(error.code === '23505'){
            return res.status(409).json({message: 'Relasi ini sudah ada'});
        }
        console.error('Error POST penelitian', error);
        res.status(500).json({message: 'Error di server'});
    }
});

router.delete('/penelitian', authenticateToken, isVerifier, async (req, res) => {
    try {
        const { arkeolog_id, situs_id } = req.body;
        const result = await pool.query(
            "DELETE FROM penelitian_situs WHERE arkeolog_id = $1 AND situs_id = $2 RETURNING *",
            [arkeolog_id, situs_id]
        );
        res.json({ message: 'Relasi penelitian berhasil dihapus', data: result.rows[0]});
    } catch (error) {
        console.error('Error DELETE penelitian:', error);
        res.status(500).json({ message: 'Error server.' });
    }
});