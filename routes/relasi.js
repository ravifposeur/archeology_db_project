const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isVerifier, isAdmin } = require('../middleware/auth');

const validate = require('../middleware/validation');
const {
    paramsIdSchema,
    penelitianSchema,
    atribusiSchema,
    gelarSchema
} = require('../validators/relasi.validator');

router.get('/penelitian/by-situs/:id', authenticateToken, validate({ params: paramsIdSchema }), async (req, res) => {
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

router.post('/penelitian', authenticateToken, isVerifier, validate({ body: penelitianSchema }), async (req, res) => {
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

router.delete('/penelitian', authenticateToken, isVerifier, validate({ body: penelitianSchema }), async (req, res) => {
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

router.get('/atribusi/by-objek/:id', authenticateToken, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const getAtribusiQuery = `
            SELECT t.tokoh_id, t.nama_tokoh 
            FROM tokoh t
            JOIN atribusi_artefak aa ON t.tokoh_id = aa.tokoh_id
            WHERE aa.objek_id = $1
        `;
        const result = await pool.query(getAtribusiQuery, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error GET atribusi by-objek:', error);
        res.status(500).json({ message: 'Error server.' });   
    }
});

router.post('/atribusi', authenticateToken, isVerifier, validate({ body: atribusiSchema }), async (req, res) => {
    try {
        const { objek_id, tokoh_id } = req.body;
        const result = await pool.query(
            "INSERT INTO atribusi_artefak (objek_id, tokoh_id) VALUES ($1, $2) RETURNING *",
            [objek_id, tokoh_id]
        );
        res.status(201).json({ message: 'Atribusi artefak berhasil dibuat', data: result.rows[0] });
    } catch (error) {
        if(error.code === '23505'){
            return res.status(409).json({message: 'Relasi ini sudah ada'});
        }
        console.error('Error POST atribusi', error);
        res.status(500).json({message: 'Error di server'});
    }
});

router.delete('/atribusi', authenticateToken, isVerifier, validate({ body: atribusiSchema }), async (req, res) => {
    try {
        const { objek_id, tokoh_id } = req.body;
        const result = await pool.query(
            "DELETE FROM atribusi_artefak WHERE objek_id = $1 AND tokoh_id = $2",
            [objek_id, tokoh_id]
        );
        res.json({ message: 'Atribusi artefak berhasil dihapus', data: result.rows[0]});
    } catch (error) {
        console.error('Error DELETE atribusi:', error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.get('/gelar/by-tokoh/:id', authenticateToken, validate({ params: paramsIdSchema }), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT gelar_tokoh FROM tokoh_gelar_tokoh WHERE tokoh_id = $1",
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error GET gelar by-tokoh:', error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.post('/gelar', authenticateToken, isVerifier, validate({ body: gelarSchema }), async (req, res) => {
    try {
        const { tokoh_id, gelar_tokoh } = req.body;
        const result = await pool.query(
            "INSERT INTO tokoh_gelar_tokoh (tokoh_id, gelar_tokoh) VALUES ($1, $2) RETURNING *",
            [tokoh_id, gelar_tokoh]
        );
        res.status(201).json({ message: 'Gelar tokoh berhasil ditambahkan', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ message: 'Gelar ini sudah dimiliki tokoh tersebut.' });
        console.error('Error POST gelar:', error);
        res.status(500).json({ message: 'Error server.' });
    }
});

router.delete('/gelar', authenticateToken, isVerifier, validate({ body: gelarSchema }), async (req, res) => {
    try {
        const { tokoh_id, gelar_tokoh } = req.body; // Hapus berdasarkan body
        const result = await pool.query(
            "DELETE FROM tokoh_gelar_tokoh WHERE tokoh_id = $1 AND gelar_tokoh = $2",
            [tokoh_id, gelar_tokoh]
        );
        res.json({ message: 'Gelar tokoh berhasil dihapus', data: result.rows[0]});
    } catch (error) {
        console.error('Error DELETE gelar:', error);
        res.status(500).json({ message: 'Error server.' });
    }
});

module.exports = router;