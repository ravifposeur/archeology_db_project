const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isVerifier, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validation'); 
const { 
    createSitusSchema, 
    // updateSitusSchema,
    paramsIdSchema       
} = require('../validators/situs.validator');
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

router.post('/', authenticateToken, validate({body: createSitusSchema}), async (req, res) => {
    try {
        const {
            nama_situs, jalan_dusun, desa_kelurahan_id,
            latitude, longitude, periode_sejarah,
            jenis_situs, kerajaan_id
        } = req.body;

        const initialStatus = (isVerifier || authenticateToken) 
            ? 'verified' 
            : 'pending';
        
        const penggunaPelaporID = req.user.id;
        

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

router.put('/approve/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema }), async (req, res) => {
    const client = await pool.connect(); // Kita butuh Client untuk Transaksi
    try {
        await client.query('BEGIN'); // Mulai Transaksi

        const { id } = req.params;

        // 1. Approve Situsnya Dulu
        const updateSitus = await client.query(
            `UPDATE situs_arkeologi SET status_verifikasi = 'verified' WHERE situs_id = $1 RETURNING *`,
            [id]
        );

        if (updateSitus.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message : 'Situs tak ditemukan'});
        }

        const situsData = updateSitus.rows[0];

        // 2. AUTO-ACC KERAJAAN (Jika situs ini merujuk ke kerajaan pending)
        if (situsData.kerajaan_id) {
            await client.query(
                `UPDATE kerajaan SET status_validasi = 'verified' 
                 WHERE kerajaan_id = $1 AND status_validasi = 'pending'`,
                [situsData.kerajaan_id]
            );
        }

        // 3. AUTO-ACC ARKEOLOG (Cari arkeolog yang terhubung ke situs ini)
        // Kita cari di tabel 'penelitian_situs', lalu update tabel 'arkeolog'
        await client.query(
            `UPDATE arkeolog 
             SET status_validasi = 'verified'
             WHERE arkeolog_id IN (
                 SELECT arkeolog_id FROM penelitian_situs WHERE situs_id = $1
             ) AND status_validasi = 'pending'`,
            [id]
        );

        await client.query('COMMIT'); // Simpan Perubahan Permanen

        res.json({
            message: 'Situs (dan data terkait) berhasil diverifikasi!',
            data: situsData
        });

    } catch (error) {
        await client.query('ROLLBACK'); // Batalkan semua jika error
        console.error('Error saat verifikasi situs:', error);
        res.status(500).json({message: 'Terjadi error di server!'});
    } finally {
        client.release();
    }
});

router.put('/reject/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema }), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params; // ID Situs yang ditolak

        // 1. Reject Situsnya
        const updateSitus = await client.query(
            "UPDATE situs_arkeologi SET status_verifikasi = 'rejected' WHERE situs_id = $1 RETURNING *",
            [id]
        );
        
        if (updateSitus.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Situs tidak ditemukan.' });
        }

        const situsData = updateSitus.rows[0];

        // 2. SMART REJECT KERAJAAN
        // Hanya reject jika:
        // a. Status masih 'pending'
        // b. DAN tidak ada situs LAIN (selain situs ini) yang menggunakan kerajaan ini
        if (situsData.kerajaan_id) {
            await client.query(
                `UPDATE kerajaan 
                 SET status_validasi = 'rejected' 
                 WHERE kerajaan_id = $1 
                   AND status_validasi = 'pending'
                   AND NOT EXISTS (
                       SELECT 1 FROM situs_arkeologi 
                       WHERE kerajaan_id = $1 AND situs_id != $2
                   )`,
                [situsData.kerajaan_id, id]
            );
        }

        // 3. SMART REJECT ARKEOLOG
        // Ambil daftar arkeolog yang terhubung ke situs ini dulu
        const relasiPenelitian = await client.query(
            "SELECT arkeolog_id FROM penelitian_situs WHERE situs_id = $1",
            [id]
        );

        for (let row of relasiPenelitian.rows) {
            // Hanya reject arkeolog jika:
            // a. Status masih 'pending'
            // b. DAN tidak ada situs LAIN (di tabel penelitian_situs) yang terhubung ke arkeolog ini
            await client.query(
                `UPDATE arkeolog
                 SET status_validasi = 'rejected'
                 WHERE arkeolog_id = $1
                   AND status_validasi = 'pending'
                   AND NOT EXISTS (
                       SELECT 1 FROM penelitian_situs 
                       WHERE arkeolog_id = $1 AND situs_id != $2
                   )`,
                [row.arkeolog_id, id]
            );
        }

        await client.query('COMMIT');

        res.json({
            message: 'Situs berhasil ditolak. Data terkait dibersihkan jika tidak digunakan situs lain.',
            data: situsData
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saat menolak situs:', error);
        res.status(500).json({ message: 'Error server' });
    } finally {
        client.release();
    }
});

router.delete('/:id', authenticateToken, isAdmin, validate({params: paramsIdSchema}), async (req, res) => {
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