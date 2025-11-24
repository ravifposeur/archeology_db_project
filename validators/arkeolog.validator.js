const Joi = require('joi');
const { paramsIdSchema } = require('./shared.validator');

const arkeologSchema = Joi.object({
    nama_lengkap: Joi.string().min(3).required().messages({
        'string.min': 'Nama Lengkap minimal 3 karakter',
        'any.required': 'Nama Lengkap wajib diisi'
    }),
    
    afiliasi_institusi: Joi.string().required().messages({
        'any.required': 'Afiliasi Institusi wajib diisi'
    }),

    spesialisasi: Joi.string().required().messages({
        'any.required': 'Spesialisasi wajib diisi'
    }),

    email: Joi.string().email().messages({
        'string.email': 'Format email tidak valid',
    }),

    nomor_telepon: Joi.string().min(10).max(15).messages({
        'string.min': 'Nomor Telepon terlalu pendek (minimal 10)',
        'string.max': 'Nomor Telepon terlalu panjang (maksimal 15)',
    })
});

module.exports = {
    arkeologSchema,
    paramsIdSchema
};