const Joi = require('joi');

const { paramsIdSchema } = require('./shared.validator');

const createSitusSchema = Joi.object({
    nama_situs: Joi.string().min(3).required().messages({
        'string.base': 'Nama situs harus berupa teks',
        'string.empty': 'Nama situs tidak boleh kosong',
        'string.min': 'Nama situs minimal 3 karakter',
        'any.required': 'Nama situs wajib diisi'
    }),
    
    jalan_dusun: Joi.string().required().messages({
        'string.empty': 'Jalan/Dusun tidak boleh kosong',
        'any.required': 'Jalan/Dusun wajib diisi'
    }),

    desa_kelurahan_id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID Desa/Kelurahan harus berupa angka',
        'number.positive': 'ID Desa/Kelurahan harus angka positif',
        'any.required': 'ID Desa/Kelurahan wajib diisi'
    }),

    latitude: Joi.number().min(-90).max(90).required().messages({
        'number.base': 'Latitude harus berupa angka',
        'number.min': 'Latitude minimal -90',
        'number.max': 'Latitude maksimal 90',
        'any.required': 'Latitude wajib diisi'
    }),

    longitude: Joi.number().min(-180).max(180).required().messages({
        'number.base': 'Longitude harus berupa angka',
        'number.min': 'Longitude minimal -180',
        'number.max': 'Longitude maksimal 180',
        'any.required': 'Longitude wajib diisi'
    }),

    periode_sejarah: Joi.string().allow(null, ''),
    
    jenis_situs: Joi.string().required().messages({
        'string.empty': 'Jenis situs tidak boleh kosong',
        'any.required': 'Jenis situs wajib diisi'
    }),

    kerajaan_id: Joi.number().integer().positive().allow(null).messages({
        'number.base': 'ID Kerajaan harus berupa angka',
        'number.positive': 'ID Kerajaan harus angka positif'
    })
});

const updateSitusSchema = Joi.object({
    nama_situs: Joi.string().min(3),
    jalan_dusun: Joi.string(),
    desa_kelurahan_id: Joi.number().integer().positive(),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    periode_sejarah: Joi.string().allow(null, ''),
    jenis_situs: Joi.string(),
    kerajaan_id: Joi.number().integer().positive().allow(null)
}).min(1).messages({
    'object.min': 'Setidaknya satu field harus diisi untuk update'
});

module.exports = {
    createSitusSchema,
    updateSitusSchema,
    paramsIdSchema 
};