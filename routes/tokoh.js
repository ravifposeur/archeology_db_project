const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isVerifier, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const getQuery = 
            `
            SELECT t.*, k.nama_kerajaan 
            FROM tokoh t
            LEFT JOIN kerajaan k ON t.kerajaan_id = k.kerajaan_id
            ORDER BY t.nama_tokoh ASC
            `;
        const result = await pool.query(getQuery);
        res.json(result.rows);
    } catch (error) {
        console.error('Error ketika ambil tokoh', error);
        res.status(500).json({message: 'Error di server'});
    }
})

router.post('/', authenticateToken, isVerifier, async (req, res) => {
    try {
        const { nama_tokoh, tahun_lahir, tahun_wafat, biografi_singkat, kerajaan_id } = req.body;
        const result = await pool.query(
            `INSERT INTO tokoh (nama_tokoh, tahun_lahir, tahun_wafat, biografi_singkat, kerajaan_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nama_tokoh, tahun_lahir, tahun_wafat, biografi_singkat, kerajaan_id]
        );

        res.status(201).json({message: 'Tokoh berhasil dibuat', data: result.rows[0]});
    } catch (error) {
        console.error('Error ketika post tokoh', error);
        res.status(500).json({message: 'Error di server'});
    }
})