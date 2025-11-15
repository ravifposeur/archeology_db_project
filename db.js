const { Pool } = require('pg');

const pool = new Pool({
    user: 'arkeologi_app',
    host: 'localhost',
    database: 'arkeologidb',
    password: 'rehankijing',
    port: 5432,
});

module.exports = pool;