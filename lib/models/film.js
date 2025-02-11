'use strict';

const Joi = require('joi').extend(require('@joi/date'));
const { Model } = require('@hapipal/schwifty');

module.exports = class Film extends Model {
    static get tableName() {

        return 'film';
    }

    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            title: Joi.string().min(3).required(),
            description: Joi.string().min(3),
            releasedate: Joi.date().format('DD/MM/YYYY') // Format européen
                .max('now') // Date de sortie du film ne peut pas être dans le futur
                .required()
                .messages({
                    'date.format': 'La date doit être au format JJ/MM/AAAA.',
                    'date.max': 'La date ne peut pas être ultérieure à aujourd\'hui.',
                }),
            producer: Joi.string().min(3).required(),
            createdAt: Joi.date(),
            updatedAt: Joi.date()
        });
    }
    $beforeInsert(queryContext) {

        this.updatedAt = new Date();
        this.createdAt = this.updatedAt;
    }

    $beforeUpdate(opt, queryContext) {
        this.updatedAt = new Date();
    }
};
