const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const pool = require('../db'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 10;
const JWT_SECRET = 'rehankijing';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Terlalu banyak percobaan login, coba lagi setelah 15 menit',
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', async (req, res) => {
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

router.post('/login', async (req, res) =>{
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

module.exports = router;