const Joi = require('joi');
const {paramsIdSchema} = require('./shared.validator');

const kerajaanSchema = Joi.object({
    nama_kerajaan: Joi.string().min(3).required().messages({
        'string.min': 'Nama Kerajaan minimal 3 karakter',
        'any.required': 'Nama Kerajaan wajib diisi'
    }),

    tahun_berdiri: Joi.number().integer().allow(null),
    
    tahun_runtuh: Joi.number().integer().allow(null),

    pusat_pemerintahan: Joi.string().allow(null, ''),

    deskripsi_singkat: Joi.string().required().messages({
        'any.required': 'Deskripsi Singkat wajib diisi'
    })
});

module.exports = {
    kerajaanSchema,
    paramsIdSchema
};