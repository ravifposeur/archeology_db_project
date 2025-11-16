const Joi = require('joi');
const { paramsIdSchema } = require('./shared.validator');

const createObjekSchema = Joi.object({
    nama_objek: Joi.string().min(3).required().messages({
        'string.min': 'Nama Objek minimal 3 karakter',
        'any.required': 'Nama Objek wajib diisi'
    }),
    jenis_objek: Joi.string().required().messages({
        'any.required': 'Jenis Objek wajib diisi'
    }),
    bahan: Joi.string().required().messages({
        'any.required': 'Bahan wajib diisi'
    }),
    panjang: Joi.number().positive().required().messages({
        'number.base': 'Panjang harus angka',
        'number.positive': 'Panjang harus angka positif',
        'any.required': 'Panjang wajib diisi'
    }),
    tinggi: Joi.number().positive().required().messages({
        'number.base': 'Tinggi harus angka',
        'number.positive': 'Tinggi harus angka positif',
        'any.required': 'Tinggi wajib diisi'
    }),
    lebar: Joi.number().positive().required().messages({
        'number.base': 'Lebar harus angka',
        'number.positive': 'Lebar harus angka positif',
        'any.required': 'Lebar wajib diisi'
    }),
    teks_transliterasi: Joi.string().allow(null, ''),
    aksara: Joi.string().allow(null, ''),
    bahasa: Joi.string().allow(null, ''),
    
    situs_id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID Situs harus angka',
        'any.required': 'ID Situs wajib diisi'
    })
});

const updateObjekSchema = Joi.object({
    nama_objek: Joi.string().min(3),
    jenis_objek: Joi.string(),
    bahan: Joi.string(),
    panjang: Joi.number().positive(),
    tinggi: Joi.number().positive(),
    lebar: Joi.number().positive(),
    teks_transliterasi: Joi.string().allow(null, ''),
    aksara: Joi.string().allow(null, ''),
    bahasa: Joi.string().allow(null, ''),
    situs_id: Joi.number().integer().positive()
}).min(1).messages({
    'object.min': 'Setidaknya satu field harus diisi untuk update'
});

const paramsSitusIdSchema = Joi.object({
    situs_id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID Situs di parameter harus angka',
        'any.required': 'ID Situs di parameter wajib diisi'
    })
});

module.exports = {
    createObjekSchema,
    updateObjekSchema,
    paramsIdSchema, 
    paramsSitusIdSchema 
};
