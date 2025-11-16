const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isVerifier, isAdmin } = require('../middleware/auth');

const validate = require('../middleware/validation');
const {
    createObjekSchema,
    updateObjekSchema,
    paramsIdSchema,
    paramsSitusIdSchema
} = require('../validators/objek_temuan.validator');

// GET VERIFIED OBJECT BERDASAR SITUS

router.get('/verified/by-situs/:situs_id', validate({ params: paramsSitusIdSchema }), async (req, res) => {
    try {
        const {situs_id} = req.params;
        const result = await pool.query(
            "SELECT * FROM objek_temuan WHERE situs_id = $1 AND status_verifikasi = 'verified'",
            [situs_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error saat ambil objek verified', error);
        res.status(500).json({message: 'Error di Server'});
    }
});

// POST OBJECT TO PENDING

router.post('/', authenticateToken, validate({ body: createObjekSchema }), async (req, res) => {
    try {

        const {
            nama_objek, jenis_objek, bahan, panjang, tinggi, lebar,
            teks_transliterasi, aksara, bahasa, situs_id
        } = req.body;

        const penggunaPelaporID = req.user.id;

        const insertQuery = `
            INSERT INTO objek_temuan (
                nama_objek, jenis_objek, bahan, panjang, tinggi, lebar, 
                teks_transliterasi, aksara, bahasa, situs_id,
                status_verifikasi, pengguna_pelapor_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11)
            RETURNING *
        `;

        const params = [
            nama_objek, jenis_objek, bahan, panjang, tinggi, lebar,
            teks_transliterasi, aksara, bahasa, situs_id,
            penggunaPelaporID
        ];

        const objekBaru = await pool.query(insertQuery, params);

        res.status(201).json({
            message: 'Objek baru berhasil ditambahkan dan menunggu verifikasi.',
            data: objekBaru.rows[0]
        });

    } catch (error) {
        console.error('Error tambah objek temuan', error);
        res.status(500).json({message: 'Error di Server'});
    }

});

// GET PENDING OBJECT

router.get('/pending', authenticateToken, isVerifier, async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT * FROM objek_temuan
            WHERE status_verifikasi = 'pending'
            ORDER BY objek_id Asc
            `
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error ambil objek pending', error);
        res.status(500).json({message: 'Error server.'});
    }
});


// APPROVED OBJECT

router.put('/approve/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `
            UPDATE objek_temuan
            SET status_verifikasi = 'verified'
            WHERE objek_id = $1 RETURNING *
            `,
            [id]
        );
        
        if (result.rows.length === 0){
            return res.status(404).json({message: 'Objek tidak ditemukan!'});
        }

        res.json({message: 'Objek berhasil diverifikasi', data: result.rows[0]});
    } catch (error) {
        console.error('Error verifikasi objek', error);
        res.status(500).json({message: 'Error di server'});
    }
});

// REJECT OBJECT
router.put('/reject/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `
            UPDATE objek_temuan
            SET status_verifikasi = 'rejected'
            WHERE objek_id = $1 RETURNING *
            `,
            [id]
        );
        
        if (result.rows.length === 0){
            return res.status(404).json({message: 'Objek tidak ditemukan!'});
        }

        res.json({message: 'Objek berhasil direject', data: result.rows[0]});
    } catch (error) {
        console.error('Error reject objek', error);
        res.status(500).json({message: 'Error di server'});
    }
});

router.delete('/:id', authenticateToken, isAdmin, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const {id} = req.params;
        const result = await pool.query(
            "DELETE FROM objek_temuan WHERE objek_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Objek tidak ditemukan'});
        }

        res.json({
            message: 'Objek berhasil dihapus',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error saat hapus Objek Temuan', error);

        if(error.code == '23503') {
            return res.status(400).json({
                message: 'Objek ini masih punya tabel yang terhubung'
            });
        }

        res.status(500).json({message: 'Error di server.'});
    }
});

module.exports = router;