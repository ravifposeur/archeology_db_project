const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isVerifier, isAdmin } = require('../middleware/auth');

router.get('/verified', async (req,res) =>{
    try {

        const verifiedQuery = `
            SELECT 
                s.situs_id, 
                s.nama_situs, 
                s.latitude, 
                s.longitude, 
                s.jenis_situs,
                s.jalan_dusun,
                k.nama_kerajaan,
                d.nama_desa_kelurahan,
                kec.nama_kecamatan,
                kot.nama_kota_kabupaten
            FROM 
                situs_arkeologi s
            LEFT JOIN 
                kerajaan k ON s.kerajaan_id = k.kerajaan_id
            LEFT JOIN 
                desa_kelurahan d ON s.desa_kelurahan_id = d.desa_kelurahan_id
            LEFT JOIN 
                kecamatan kec ON d.kecamatan_id = kec.kecamatan_id
            LEFT JOIN 
                kota_kabupaten kot ON kec.kota_kabupaten_id = kot.kota_kabupaten_id
            WHERE 
                s.status_verifikasi = 'verified'
        `;

        const situsVerified = await pool.query(verifiedQuery);
        res.json(situsVerified.rows);
    
    } catch (error) {
        console.error('Error saat ambil situs terverifikasi', error);
        res.status(500).json({message: 'Error di server'});
    }
});

router.post('/', authenticateToken, async (req, res) =>{
    try {
        const {
            nama_situs, jalan_dusun, desa_kelurahan_id,
            latitude, longitude, periode_sejarah,
            jenis_situs, kerajaan_id
        } = req.body;

        const penggunaPelaporID = req.user.id;

        if (!nama_situs || !jalan_dusun || !latitude || !longitude || !desa_kelurahan_id) {
            return res.status(400).json({ message: 'Nama, Jalan, Desa, Latitude, dan Longitude wajib diisi.' });
        }

        const insertQuery = `
            INSERT INTO situs_arkeologi 
                (nama_situs, jalan_dusun, desa_kelurahan_id, 
                latitude, longitude, periode_sejarah, jenis_situs, kerajaan_id, 
                status_verifikasi, pengguna_pelapor_id) 
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9) 
            RETURNING *
        `;

        const params = [
            nama_situs, jalan_dusun, desa_kelurahan_id,
            latitude, longitude, periode_sejarah, jenis_situs, kerajaan_id,
            penggunaPelaporID
        ];

        const situsBaru = await pool.query(insertQuery, params);

        res.status(201).json({
            message: 'Situs baru berhasil ditambahkan dan butuh verifikasi',
            data: situsBaru.rows[0]
        });

    } catch (error) {
        console.error('Error saat menambah situs baru', error);
        res.status(500).json({message: 'Error di server'});
    }
});

router.get('/pending', authenticateToken, isVerifier, async (req, res, next) => {
    try {
        const pendingQuery = `
            SELECT 
                s.situs_id, 
                s.nama_situs, 
                s.latitude, 
                s.longitude, 
                s.jenis_situs,
                s.jalan_dusun,
                k.nama_kerajaan,
                d.nama_desa_kelurahan,
                kec.nama_kecamatan,
                kot.nama_kota_kabupaten,
                s.status_verifikasi,
                s.pengguna_pelapor_id
            FROM 
                situs_arkeologi s
            LEFT JOIN 
                kerajaan k ON s.kerajaan_id = k.kerajaan_id
            LEFT JOIN 
                desa_kelurahan d ON s.desa_kelurahan_id = d.desa_kelurahan_id
            LEFT JOIN 
                kecamatan kec ON d.kecamatan_id = kec.kecamatan_id
            LEFT JOIN 
                kota_kabupaten kot ON kec.kota_kabupaten_id = kot.kota_kabupaten_id
            WHERE 
                s.status_verifikasi = 'pending'
            ORDER BY 
                s.situs_id ASC
        `;

        const situsPending = await pool.query(pendingQuery);
        res.json(situsPending.rows);

    } catch (error) {
        console.error('Error saat ambil situs pending', error);
        res.status(500).json({message : 'Terjadi error di server.'});
    }
});

router.put('/approve/:id', authenticateToken, isVerifier, async (req, res, next) => {
    try {
        
        const {id} = req.params;
        const updateSitus = await pool.query(
            `UPDATE situs_arkeologi SET status_verifikasi = 'verified' WHERE situs_id = $1 RETURNING *`,
            [id]
        );

        if (updateSitus.rows.length === 0){
            return res.status(404).json({ message : 'SItus tak ditemukan'});
        }

        res.json({
            message: 'Situs berhasil diverifikasi!',
            data: updateSitus.rows[0]
        });

    } catch (error) {
        console.error('Error saat verifikasi situs:', error);
        res.status(500).json({message: 'Terjadi error di server!'});
    }
});

router.put('/approve/:id', authenticateToken, isVerifier, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `
            UPDATE objek_temuan
            SET status_verifikasi = 'rejected'
            WHERE objek_id = $1 RETURNING *
            `
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

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {id} = req.params;
        const result = await pool.query(
            "DELETE FROM situs_arkeologi WHERE situs_id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({message: 'Situs tidak ditemukan'});
        }

        res.json({
            message: 'Situs berhasil dihapus',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error saat hapus situs', error);

        if(error.code == '23503') {
            return res.status(400).json({
                message: 'Situs ini masih punya Objek Temuan yang terhubung'
            });
        }

        res.status(500).json({message: 'Error di server.'});
    }
});

module.exports = router;