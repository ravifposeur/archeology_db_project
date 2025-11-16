const Joi = require('joi');

/**
 * Middleware validasi yang lebih pintar.
 * Sekarang bisa memvalidasi req.body, req.params, dan req.query.
 * * @param {object} schemas - Objek berisi skema Joi
 * @param {Joi.Schema} [schemas.body] - Skema untuk req.body
 * @param {Joi.Schema} [schemas.params] - Skema untuk req.params
 * @param {Joi.Schema} [schemas.query] - Skema untuk req.query
 */
const validate = (schemas) => (req, res, next) => {
    
    // Opsi validasi: 'abortEarly: false' berarti kumpulkan semua error
    const options = { abortEarly: false };
    
    // Array untuk menampung semua error
    let allErrors = [];

    // 1. Validasi req.params (jika ada skemanya)
    // Ini untuk mengecek hal seperti /approve/:id
    if (schemas.params) {
        const { error, value } = schemas.params.validate(req.params, options);
        if (error) {
            allErrors.push(...error.details);
        } else {
            // Ganti req.params dengan data bersih (sudah dikonversi tipe, misal "1" -> 1)
            req.params = value; 
        }
    }

    // 2. Validasi req.body (jika ada skemanya)
    // Ini untuk mengecek data form (JSON)
    if (schemas.body) {
        const { error, value } = schemas.body.validate(req.body, options);
        if (error) {
            allErrors.push(...error.details);
        } else {
            // Ganti req.body dengan data bersih
            req.body = value; 
        }
    }

    // 3. Validasi req.query (jika ada skemanya)
    // Ini untuk mengecek hal seperti /search?nama=...
    if (schemas.query) {
        const { error, value } = schemas.query.validate(req.query, options);
        if (error) {
            allErrors.push(...error.details);
        } else {
            // Ganti req.query dengan data bersih
            req.query = value; 
        }
    }

    // 4. Cek apakah ada error dari SEMUA validasi
    if (allErrors.length > 0) {
        // Format ulang error agar rapi
        const errors = allErrors.map(detail => ({
            message: detail.message.replace(/["']/g, ''),
            field: detail.context.key,
            location: detail.path[0] // Menunjukkan lokasi error (body, params, query)
        }));
        
        return res.status(400).json({ 
            message: "Data yang dikirim tidak valid.",
            errors 
        });
    }

    // Jika semuanya aman, lanjutkan ke handler rute
    next();
};

module.exports = validate;