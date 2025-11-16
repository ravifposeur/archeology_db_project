const Joi = require('joi');

/**
 * Middleware factory yang membuat middleware validasi
 * berdasarkan skema Joi yang diberikan.
 * @param {Joi.Schema} schema - Skema Joi untuk memvalidasi req.body
 * @returns {function(req, res, next)} - Middleware Express
 */
const validate = (schema) => (req, res, next) => {
    
    // Opsi 'abortEarly: false' berarti Joi akan mengumpulkan SEMUA
    // error, tidak hanya berhenti di error pertama.
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        // Jika ada error validasi, format ulang agar lebih mudah dibaca
        const errors = error.details.map(detail => ({
            // .replace(/["']/g, '') membersihkan tanda kutip dari pesan error Joi
            message: detail.message.replace(/["']/g, ''), 
            field: detail.context.key
        }));

        // Kirim balasan 400 (Bad Request)
        return res.status(400).json({ 
            message: "Data yang dikirim tidak valid.",
            errors 
        });
    }

    // PENTING: Jika validasi sukses, ganti req.body dengan data yang sudah bersih
    // (Joi bisa melakukan konversi tipe data, misal "1" -> 1, dan menghapus field ekstra)
    req.body = value;
    
    // Lanjutkan ke route handler berikutnya
    next();
};

// Ekspor fungsi factory 'validate'
module.exports = validate;