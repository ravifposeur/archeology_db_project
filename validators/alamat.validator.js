const Joi = require('joi');
const { paramsIdSchema } = require('./shared.validator');

const kotaSchema = Joi.object({
    nama_kota_kabupaten: Joi.string().min(3).required().messages({
        'string.min': 'Nama Kota/Kabupaten minimal 3 karakter',
        'any.required': 'Nama Kota/Kabupaten wajib diisi'
    })
});

const kecamatanSchema = Joi.object({
    nama_kecamatan: Joi.string().min(3).required().messages({
        'string.min': 'Nama Kecamatan minimal 3 karakter',
        'any.required': 'Nama Kecamatan wajib diisi'
    }),
    kota_kabupaten_id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID Kota/Kabupaten harus angka',
        'any.required': 'ID Kota/Kabupaten wajib diisi'
    })
});

const paramsKotaIdSchema = Joi.object({
    kota_id: Joi.number().integer().positive().required().messages({
        'any.required': 'Parameter ID Kota wajib diisi'
    })
});

const desaSchema = Joi.object({
    nama_desa_kelurahan: Joi.string().min(3).required().messages({
        'string.min': 'Nama Desa/Kelurahan minimal 3 karakter',
        'any.required': 'Nama Desa/Kelurahan wajib diisi'
    }),
    kecamatan_id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID Kecamatan harus angka',
        'any.required': 'ID Kecamatan wajib diisi'
    })
});

const paramsKecamatanIdSchema = Joi.object({
    kecamatan_id: Joi.number().integer().positive().required().messages({
        'any.required': 'Parameter ID Kecamatan wajib diisi'
    })
});

module.exports = {
    paramsIdSchema, 
    kotaSchema,
    kecamatanSchema,
    paramsKotaIdSchema,
    desaSchema,
    paramsKecamatanIdSchema
};