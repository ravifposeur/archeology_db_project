const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

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

const isAdmin = (req, res, next) => {

    if (req.user.role !== 'administrator') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya untuk Administrator.' });
    }

   next();
}

module.exports = {
    authenticateToken,
    isVerifier,
    isAdmin
};