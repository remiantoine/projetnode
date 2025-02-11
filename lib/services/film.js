'use strict';

const { Service } = require('@hapipal/schmervice');

module.exports = class FilmService extends Service {
    create(film) {
        const { Film } = this.server.models();
        return Film.query().insertAndFetch(film);
    }
    async deleteFilmById(id) {
        const { Film } = this.server.models();

        // Suppression de le film par son identifiant
        await Film.query().deleteById(id);
    }
    async updateFilmById(id, updates) {
        const { Film } = this.server.models();

        // Vérifie si le film existe
        const film = await Film.query().findById(id);
        if (!film) {
            throw new Error(`Film avec l'ID ${id} non trouvé`);
        }

        // Met à jour le film et retourne les nouvelles données
        return Film.query().patchAndFetchById(id, updates);
    }
};
