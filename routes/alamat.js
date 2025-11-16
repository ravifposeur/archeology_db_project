const express = require('express');
const router = express.Router();
const pool = require('../db');

const { authenticateToken, isVerifier, isAdmin } = require('../middleware/auth');

const validate = require('../middleware/validation');
const {
    paramsIdSchema,
    kotaSchema,
    kecamatanSchema,
    paramsKotaIdSchema,
    desaSchema,
    paramsKecamatanIdSchema
} = require('../validators/alamat.validator');

router.get('/kota', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM kota_kabupaten ORDER BY nama_kota_kabupaten ASC");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.post('/kota', authenticateToken, isVerifier, validate({ body: kotaSchema }), async (req, res) => {
    const { nama_kota_kabupaten } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO kota_kabupaten (nama_kota_kabupaten) VALUES ($1) RETURNING *",
            [nama_kota_kabupaten]
        );
        res.status(201).json({ message: "Kota/Kabupaten berhasil dibuat", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.put('/kota/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema, body: kotaSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_kota_kabupaten } = req.body;

        const result = await pool.query(
            "UPDATE kota_kabupaten SET nama_kota_kabupaten = $1 WHERE kota_kabupaten_id = $2 RETURNING *",
            [nama_kota_kabupaten, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Kota/Kabupaten tidak ditemukan' });
        }
        res.json({ message: 'Kota/Kabupaten berhasil diupdate', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.delete('/kota/:id', authenticateToken, isAdmin, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM kota_kabupaten WHERE kota_kabupaten_id = $1", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Kota/Kabupaten tidak ditemukan' });
        }

        res.json({ message: "Kota/Kabupaten berhasil dihapus" });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Gagal hapus: Data ini masih dipakai oleh Kecamatan.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.get('/kecamatan/by-kota/:kota_id', authenticateToken, validate({ params: paramsKotaIdSchema }), async (req, res) => {
    try {
        const { kota_id } = req.params;
        const result = await pool.query(
            "SELECT * FROM kecamatan WHERE kota_kabupaten_id = $1 ORDER BY nama_kecamatan ASC",
            [kota_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.post('/kecamatan', authenticateToken, isVerifier, validate({ body: kecamatanSchema }), async (req, res) => {
    const { nama_kecamatan, kota_kabupaten_id } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO kecamatan (nama_kecamatan, kota_kabupaten_id) VALUES ($1, $2) RETURNING *",
            [nama_kecamatan, kota_kabupaten_id]
        );
        res.status(201).json({ message: "Kecamatan berhasil dibuat", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.put('/kecamatan/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema, body: kecamatanSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_kecamatan, kota_kabupaten_id } = req.body;

        const result = await pool.query(
            "UPDATE kecamatan SET nama_kecamatan = $1, kota_kabupaten_id = $2 WHERE kecamatan_id = $3 RETURNING *",
            [nama_kecamatan, kota_kabupaten_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Kecamatan tidak ditemukan' });
        }
        res.json({ message: 'Kecamatan berhasil diupdate', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.delete('/kecamatan/:id', authenticateToken, isAdmin, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM kecamatan WHERE kecamatan_id = $1", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Kecamatan tidak ditemukan' });
        }

        res.json({ message: "Kecamatan berhasil dihapus" });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Gagal hapus: Data ini masih dipakai oleh Desa/Kelurahan.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.get('/desa/by-kecamatan/:kecamatan_id', authenticateToken, validate({ params: paramsKecamatanIdSchema }), async (req, res) => {
    try {
        const { kecamatan_id } = req.params;
        const result = await pool.query(
            "SELECT * FROM desa_kelurahan WHERE kecamatan_id = $1 ORDER BY nama_desa_kelurahan ASC",
            [kecamatan_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.post('/desa', authenticateToken, isVerifier, validate({ body: desaSchema }), async (req, res) => {
    const { nama_desa_kelurahan, kecamatan_id } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO desa_kelurahan (nama_desa_kelurahan, kecamatan_id) VALUES ($1, $2) RETURNING *",
            [nama_desa_kelurahan, kecamatan_id]
        );
        res.status(201).json({ message: "Desa/Kelurahan berhasil dibuat", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.put('/desa/:id', authenticateToken, isVerifier, validate({ params: paramsIdSchema, body: desaSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_desa_kelurahan, kecamatan_id } = req.body;

        const result = await pool.query(
            "UPDATE desa_kelurahan SET nama_desa_kelurahan = $1, kecamatan_id = $2 WHERE desa_kelurahan_id = $3 RETURNING *",
            [nama_desa_kelurahan, kecamatan_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Desa/Kelurahan tidak ditemukan' });
        }
        res.json({ message: 'Desa/Kelurahan berhasil diupdate', data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.delete('/desa/:id', authenticateToken, isAdmin, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM desa_kelurahan WHERE desa_kelurahan_id = $1", [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Desa/Kelurahan tidak ditemukan' });
        }

        res.json({ message: "Desa/Kelurahan berhasil dihapus" });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Gagal hapus: Data ini masih dipakai oleh Situs Arkeologi.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Error server.' });
    }
});

module.exports = router;