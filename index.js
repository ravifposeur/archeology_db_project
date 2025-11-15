const express = require('express');
const pool = require('./db'); 

const app = express();
const port = 3000;

app.use(express.json());

const rutePengguna = require('./routes/pengguna');
const ruteSitus = require('./routes/situs');
const ruteKerajaan = require('./routes/kerajaan');
const ruteAlamat = require('./routes/alamat');

app.use('/api/auth', rutePengguna); 
app.use('/api/situs', ruteSitus);
app.use('/api/kerajaan', ruteKerajaan);
app.use('/api/alamat', ruteAlamat);

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

app.listen(port, () => {
    console.log(`Server jalan di http://localhost:${port}`)
});