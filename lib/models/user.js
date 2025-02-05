'use strict';

const Encrypt = require('@randombullshitgo/iut_encrypt');
const Joi = require('joi');
const { Model } = require('@hapipal/schwifty');

module.exports = class User extends Model {

    static get tableName() {

        return 'user';
    }

    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            firstName: Joi.string().min(3).example('John').description('Firstname of the user'),
            lastName: Joi.string().min(3).example('Doe').description('Lastname of the user'),
            password: Joi.string().min(8).example('Password').default('Password'),
            mail: Joi.string().min(8).example('john.doe@gmail.com'),
            scope: Joi.string().example('user').default('user'),
            createdAt: Joi.date(),
            updatedAt: Joi.date()
        });
    }

    $beforeInsert(queryContext) {

        this.scope = 'user';
        this.updatedAt = new Date();
        this.createdAt = this.updatedAt;
        if (this.password) {
            this.password = Encrypt.sha1(this.password);
        }
    }

    $beforeUpdate(opt, queryContext) {
        if (this.password) {
            this.password = Encrypt.sha1(this.password);
        }

        this.updatedAt = new Date();
    }

};