const Joi = require('joi');
const { paramsIdSchema } = require('./shared.validator');

const penelitianSchema = Joi.object({
    arkeolog_id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID Arkeolog harus angka',
        'any.required': 'ID Arkeolog wajib diisi'
    }),
    situs_id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID Situs harus angka',
        'any.required': 'ID Situs wajib diisi'
    })
});

const atribusiSchema = Joi.object({
    objek_id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID Objek harus angka',
        'any.required': 'ID Objek wajib diisi'
    }),
    tokoh_id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID Tokoh harus angka',
        'any.required': 'ID Tokoh wajib diisi'
    })
});

const gelarSchema = Joi.object({
    tokoh_id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID Tokoh harus angka',
        'any.required': 'ID Tokoh wajib diisi'
    }),
    gelar_tokoh: Joi.string().min(2).required().messages({
        'string.min': 'Gelar Tokoh minimal 2 karakter',
        'any.required': 'Gelar Tokoh wajib diisi'
    })
});

module.exports = {
    paramsIdSchema, 
    penelitianSchema,
    atribusiSchema,
    gelarSchema
};