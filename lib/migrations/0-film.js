'use strict';

module.exports = {

    async up(knex) {

        /*await knex.schema.createTable('film', (table) => {

            table.increments('id').primary();
            table.string('title').notNull();
            table.string('description');
            table.date('releasedate').notNull();
            table.string('producer').notNull();
            table.dateTime('createdAt').notNull().defaultTo(knex.fn.now());
            table.dateTime('updatedAt').notNull().defaultTo(knex.fn.now());
        });*/
        await knex.schema.createTable('favoris', (table) => {
            table.integer('userId').unsigned().notNull();
            table.integer('filmId').unsigned().notNull();

            // Définir les relations et contraintes
            table.foreign('userId').references('id').inTable('user').onDelete('CASCADE');
            table.foreign('filmId').references('id').inTable('film').onDelete('CASCADE');

            table.primary(['userId', 'filmId']); // Contrainte pour éviter les doublons
        });
    },

    async down(knex) {

        await knex.schema.dropTableIfExists('user_favorite_movies');
    }
};
