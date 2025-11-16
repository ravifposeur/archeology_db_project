const Joi = require('joi');

const paramsIdSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID parameter harus berupa angka',
        'number.positive': 'ID parameter harus angka positif',
        'any.required': 'ID parameter wajib diisi'
    })
});

module.exports = {
    paramsIdSchema
};