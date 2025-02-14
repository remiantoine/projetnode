'use strict';

const { Service } = require('@hapipal/schmervice');
const nodemailer = require('nodemailer');

module.exports = class FilmService extends Service {
    async create(film) {
        const { Film, User } = this.server.models();
        try {
            // Ajout du film dans la base de données
            const newFilm = await Film.query().insertAndFetch(film);

            // Récupération de tous les emails des utilisateurs
            const users = await User.query().select('mail');

            if (users.length === 0) {
                console.log("Aucun utilisateur trouvé, aucun email envoyé.");
                return newFilm;
            }

            // Configuration de Nodemailer
            const testAccount = await nodemailer.createTestAccount();
            const transporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });

            // Création du contenu de l'email
            const mailOptions = {
                from: '"CinéClub" <no-reply@cineclub.com>',
                to: users.map(user => user.mail).join(','),
                subject: "Nouveau film ajouté !",
                text: `Un nouveau film "${newFilm.title}" a été ajouté à notre collection. Venez le découvrir !`,
                html: `<p>Un nouveau film <strong>${newFilm.title}</strong> a été ajouté à notre collection. Venez le découvrir !</p>`
            };

            // Envoi de l'email
            const info = await transporter.sendMail(mailOptions);
            console.log("Email envoyé : ", nodemailer.getTestMessageUrl(info));

            return newFilm;
        } catch (err) {
            throw new Error(`Erreur lors de l'ajout du film : ${err.message}`);
        }
    }
    async deleteFilmById(id) {
        const { Film } = this.server.models();

        // Suppression de le film par son identifiant
        await Film.query().deleteById(id);
    }
    async updateFilmById(id, updates) {
        const { Film, Favoris, User } = this.server.models();

        try {
            // Vérifie si le film existe
            const film = await Film.query().findById(id);
            if (!film) {
                throw new Error(`Film avec l'ID ${id} non trouvé`);
            }

            // Mise à jour du film
            const updatedFilm = await Film.query().patchAndFetchById(id, updates);

            // Récupération des utilisateurs ayant mis ce film en favori
            const favoriteUsers = await Favoris.query()
                .where({ filmId: id })
                .join('user', 'user.id', 'favoris.userId')
                .select('user.mail');

            if (favoriteUsers.length === 0) {
                console.log("Aucun utilisateur n'a ce film en favori, aucun email envoyé.");
                return updatedFilm;
            }

            // Configuration de Nodemailer
            const testAccount = await nodemailer.createTestAccount();
            const transporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });

            // Création du contenu de l'email
            const mailOptions = {
                from: '"CinéClub" <no-reply@cineclub.com>',
                to: favoriteUsers.map(user => user.mail).join(','), // Liste des destinataires
                subject: `Mise à jour du film "${updatedFilm.title}"`,
                text: `Le film "${updatedFilm.title}" que vous avez en favori a été mis à jour. Venez découvrir les nouveautés !`,
                html: `<p>Le film <strong>${updatedFilm.title}</strong> que vous avez en favori a été mis à jour. Venez découvrir les nouveautés !</p>`
            };

            // Envoi de l'email
            const info = await transporter.sendMail(mailOptions);
            console.log("Email envoyé : ", nodemailer.getTestMessageUrl(info));

            return updatedFilm;
        } catch (err) {
            throw new Error(`Erreur lors de la mise à jour du film : ${err.message}`);
        }
    }
};
