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
});

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
});

router.put('/:id', authenticateToken, isVerifier, async (req, res) => {
    try {
        const {id} = req.params;
        const { nama_tokoh, tahun_lahir, tahun_wafat, biografi_singkat, kerajaan_id } = req.body;

        const result = await pool.query(
            `UPDATE tokoh SET nama_tokoh = $1, tahun_lahir = $2,
            tahun_wafat = $3, biografi_singkat = $4, kerajaan_id = $5
            WHERE tokoh_id =  $6 RETURNING *
            `
            [ nama_tokoh, tahun_lahir, tahun_wafat, biografi_singkat, kerajaan_id, id ]
        );

        if (result.rows.length === 0){
            return res.status(404).json({message: 'Tokoh tidak ditemukan'});
        }

        res.json({message: 'Tokoh berhasil diupdate', data: result.rows[0]});
    } catch (error) {
        console.error('Error ketika post tokoh', error);
        res.status(500).json({message: 'Error di server'});
    }
});

router.delete('/:id', authenticateToken, isAdmin, async (req,res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM tokoh WHERE tokoh_id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Situs tidak ditemukan'});
        }

        res.json({
            message: 'Situs berhasil dihapus',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error saat Delete Kerajaan', error);
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Gagal hapus: Kerajaan ini masih dipakai oleh data Situs.' });
        }
        res.status(500).json({message: 'Error di Server'});
    }
});