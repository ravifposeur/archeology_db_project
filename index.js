const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(express.json());

const pool = new Pool({
    user: 'arkeologi_app',
    host: 'localhost',
    database: 'arkeologidb',
    password: 'rehankijing',
    port: 5432,
});

app.get('/', (req, res) => {
    res.send('PostgreSQL is working!');
});

app.get('/test-db', async(req, res) => {
    try {
        const results = await pool.query('SELECT 1 + 1 AS solution');
        res.json(results.rows[0]);
    } catch (error){
        console.error('Error koneksi DB:', error);
        res.status(500).json({message: 'Gagal terhubung ke postgreSQL'});
    } 
});

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10;
const JWT_SECRET = 'rehankijing'

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null){
        return res.status(401).json({message: 'Akses ditolak. Token tidak ada.'})
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({message: 'Token tidak valid.'});
        }

        req.user = user;
        next();
    });
}

const isVerifier = (req, res, next) => {
    
    if (req.user.role !== 'verifikator' && req.user.role !== 'administrator'){
        return res.status(403).json({message: 'Akses ditolak. Hanya untuk Verifikator'});
    }

    next();
}

app.post('/api/auth/register', async (req, res) => {
    try {
        const {nama_pengguna, email, password} = req.body;

        if(!nama_pengguna || !email || !password){
            return res.status(400).json({message: 'Semua field wajib diisi!'});
        }

        const passwordHash = await bcrypt.hashSync(password, saltRounds);

        const newUser = await pool.query(
            "INSERT INTO pengguna (nama_pengguna, email, password_hash, role) VALUES ($1, $2, $3, 'kontributor') RETURNING pengguna_id, nama_pengguna, email, role",
            [nama_pengguna, email, passwordHash]
        );

        res.status(201).json({
            message: 'User dibuat!',
            user: newUser.rows[0]
        });
    
    } catch (error) {
        console.error('Error saat regist:', error);
        if(error.code === '23505'){
            return res.status(409).json({message: 'uname or email terdaftar'});
        }
        res.status(500).json({message: 'Error di server!'});
    }
});

app.post('/api/auth/login', async (req, res) =>{
    try {
        const {email, password} = req.body;
        const userResult = await pool.query("SELECT * FROM pengguna WHERE email = $1", [email]);
        
        if (userResult.rows.length === 0){
            return res.status(401).json({message: 'Email/Password Salah.'});
        }
        
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({message: 'Email/Password Salah.'});
        }

        const payload = {
            id: user.pengguna_id,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            JWT_SECRET,
            {expiresIn: '1h'}
        );

        res.json({
            message: 'Login Berhasil!',
            token: token
        });
    } catch (error) {
        console.error('Error saat login:', error);

        res.status(500).json({message: "Terjadi error di server."});
    }
});

app.get('/api/situs/verified', async (req,res) =>{
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

app.post('/api/situs', authenticateToken, async (req, res) =>{
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

app.get('/api/situs/pending', authenticateToken, isVerifier, async (req, res, next) => {
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

app.put('/api/situs/approve/:id', authenticateToken, isVerifier, async (req, res, next) => {
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

app.listen(port, () => {
    console.log(`Server jalan di http://localhost:${port}`)
});