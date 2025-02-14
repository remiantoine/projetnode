'use strict';

const Joi = require('joi').extend(require('@joi/date'));
const { Model } = require('@hapipal/schwifty');

module.exports = class Favoris extends Model {
    static get tableName() {

        return 'favoris';
    }
    static get joiSchema() {
        return Joi.object({
            userId: Joi.number().integer(),
            filmId: Joi.number().integer()
        });
    }
};
