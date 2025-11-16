const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isVerifier, isAdmin } = require('../middleware/auth');

const validate = require('../middleware/validation');
const { kerajaanSchema, paramsIdSchema } = require('../validators/kerajaan.validator');
router.get('/', authenticateToken, async (req, res) => {
    try {

        const result = await pool.query("SELECT * FROM kerajaan ORDER BY nama_kerajaan ASC");
        res.json(result.rows);

    } catch (error) {

        console.error('Error saat GET Kerajaan', error);
        res.status(500).json({message: 'Error di Server'});

    }

});

router.get('/:id', authenticateToken, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM kerajaan WHERE kerajaan_id = $1", [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Kerajaan tidak ditemukan' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error ambil kerajaan by id:', error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.post('/', authenticateToken, isVerifier, validate({ body: kerajaanSchema }), async (req, res) => {
    try {
        const { nama_kerajaan, tahun_berdiri, tahun_runtuh, pusat_pemerintahan, deskripsi_singkat } = req.body;
        
        const result = await pool.query(
            `
            INSERT INTO kerajaan
            (nama_kerajaan, tahun_berdiri, tahun_runtuh, pusat_pemerintahan, deskripsi_singkat) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *
            `,
            [nama_kerajaan, tahun_berdiri, tahun_runtuh, pusat_pemerintahan, deskripsi_singkat]
        );

        res.status(201).json({message: 'Kerajaan berhasil dibuat', data: result.rows[0]});
    
    } catch (error) {
        console.error('Error saat POST Kerajaan', error);
        res.status(500).json({message: 'Error di Server'});
    }

});

router.put('/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema, body: kerajaanSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_kerajaan, tahun_berdiri, tahun_runtuh, pusat_pemerintahan, deskripsi_singkat } = req.body;
        
        const result = await pool.query(
            `UPDATE kerajaan 
             SET nama_kerajaan = $1, tahun_berdiri = $2, tahun_runtuh = $3, 
                 pusat_pemerintahan = $4, deskripsi_singkat = $5
             WHERE kerajaan_id = $6 
             RETURNING *`,
            [nama_kerajaan, tahun_berdiri, tahun_runtuh, pusat_pemerintahan, deskripsi_singkat, id]
        );

        if (result.rows.length === 0){
            return res.status(404).json({ message: 'Kerajaan tidak ditemukan' });
        }

        res.json({message: 'Kerajaan berhasil diupdate', data: result.rows[0]});
    } catch (error) {
        console.error('Error saat Edit Kerajaan', error);
        res.status(500).json({message: 'Error di Server'});
    }
});

router.delete('/:id', authenticateToken, isAdmin, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const {id} = req.params;

        const result = await pool.query(
            "DELETE FROM kerajaan WHERE kerajaan_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Kerajaan tidak ditemukan'});
        }

        res.json({
            message: 'Kerajaan berhasil dihapus',
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

module.exports = router;