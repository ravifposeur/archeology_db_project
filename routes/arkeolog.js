const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isVerifier, isAdmin } = require('../middleware/auth');

const validate = require('../middleware/validation');
const { arkeologSchema, paramsIdSchema } = require('../validators/arkeolog.validator');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM arkeolog ORDER BY nama_lengkap ASC")
        res.json(result.rows);
    } catch (error) {
        console.error('Error saat GET Arkeolog', error);
        res.status(500).json({message: 'Error di Server'});
    }
});

router.get('/:id', authenticateToken, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM arkeolog WHERE arkeolog_id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Arkeolog tidak ditemukan' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error ambil arkeolog by id:', error);
        res.status(500).json({ message: 'Error server.' });
    }    
});

router.post('/', authenticateToken, isVerifier, validate({ body: arkeologSchema }), async (req, res) => {
    try {
        const { nama_lengkap, afiliasi_institusi, spesialisasi, email, nomor_telepon } = req.body;
        const result = await pool.query(
            `INSERT INTO arkeolog (nama_lengkap, afiliasi_institusi, spesialisasi, email, nomor_telepon) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nama_lengkap, afiliasi_institusi, spesialisasi, email, nomor_telepon]
        );
        res.status(201).json({message: 'Arkeolog berhasil ditambahkan', data: result.rows[0]});
    } catch (error) {
        console.error('Error saat POST Arkeolog', error);
        res.status(500).json({message: 'Error di Server'});
    }
});

router.put('/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema, body: arkeologSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_lengkap, afiliasi_institusi, spesialisasi, email, nomor_telepon } = req.body;
        const result = await pool.query(
            `UPDATE arkeolog SET nama_lengkap=$1, afiliasi_institusi=$2, spesialisasi=$3, email=$4, nomor_telepon=$5 
             WHERE arkeolog_id=$6 RETURNING *`,
            [nama_lengkap, afiliasi_institusi, spesialisasi, email, nomor_telepon, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Arkeolog tidak ditemukan' });
        res.json({ message: 'Arkeolog berhasil diupdate', data: result.rows[0] });
    } catch (error) {
        console.error('Error saat Edit Arkeolog', error);
        res.status(500).json({message: 'Error di Server'});
    }
});

router.delete('/:id', authenticateToken, isAdmin, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const {id} = req.params;

        const result = await pool.query(
            "DELETE FROM arkeolog WHERE arkeolog_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Arkeolog tidak ditemukan'});
        }

        res.json({
            message: 'Arkeolog berhasil dihapus',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error saat Delete Arkeolog', error);
        
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Gagal hapus: Arkeolog ini masih dipakai oleh data Situs.' });
        }

        res.status(500).json({message: 'Error di Server'});
    }
});


module.exports = router;