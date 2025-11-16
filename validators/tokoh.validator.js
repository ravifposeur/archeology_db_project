const Joi = require('joi');
const { paramsIdSchema } = require('./shared.validator');

const tokohSchema = Joi.object({
    nama_tokoh: Joi.string().min(3).required().messages({
        'string.min': 'Nama Tokoh minimal 3 karakter',
        'any.required': 'Nama Tokoh wajib diisi'
    }),
    
    tahun_lahir: Joi.number().integer().allow(null),
    
    tahun_wafat: Joi.number().integer().allow(null),

    biografi_singkat: Joi.string().required().messages({
        'any.required': 'Biografi Singkat wajib diisi'
    }),

    kerajaan_id: Joi.number().integer().positive().allow(null).messages({
        'number.base': 'ID Kerajaan harus berupa angka'
    })
});

module.exports = {
    tokohSchema,
    paramsIdSchema
};