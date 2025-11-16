const Joi = require('joi');

const registerSchema = Joi.object({
    nama_pengguna: Joi.string().min(3).required().messages({
        'string.base': 'Nama pengguna harus berupa teks',
        'string.empty': 'Nama pengguna tidak boleh kosong',
        'string.min': 'Nama pengguna minimal 3 karakter',
        'any.required': 'Nama pengguna wajib diisi'
    }),

    email: Joi.string().email().required().messages({
        'string.base': 'Email harus berupa teks',
        'string.empty': 'Email tidak boleh kosong',
        'string.email': 'Format email tidak valid',
        'any.required': 'Email wajib diisi'
    }),

    password: Joi.string().min(8).required().messages({
        'string.base': 'Password harus berupa teks',
        'string.empty': 'Password tidak boleh kosong',
        'string.min': 'Password minimal 8 karakter',
        'any.required': 'Password wajib diisi'
    })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().message({
        'string.email': 'Format email tidak valid',
        'any.required': 'Email wajib diisi'
    }),

    password: Joi.string().required().messages({
        'any.required': 'Password wajib diisi'
    })
});

module.exports = {
    registerSchema,
    loginSchema
};