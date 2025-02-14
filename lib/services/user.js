'use strict';

const { Service } = require('@hapipal/schmervice');
const nodemailer = require('nodemailer');


module.exports = class UserService extends Service {

    async create(user) {

        const { User } = this.server.models();
        if (user.firstName && user.lastName && !user.mail) {
            user.mail = `${user.firstName.trim().toLowerCase()}.${user.lastName.trim().toLowerCase()}@gmail.com`;
        }

        try {
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


            const info = await transporter.sendMail({
                from: user.mail,
                to: user.mail,
                subject: "Merci d'avoir crée votre compte",
                text: `Bienvenue ${user.firstName} ${user.lastName}. Merci d'avoir créé votre compte.`,
                html: "<p>Bienvenue user.firstName user.lastName. Merci d'avoir crée votre compte.</p>"
            });
            console.log(nodemailer.getTestMessageUrl(info));
            return User.query().insertAndFetch(user);
        } catch (err) {
            throw err;
        }

    }
    // Nouvelle méthode pour récupérer tous les utilisateurs
    async getAllUsers() {
        const { User } = this.server.models();
        return User.query();
    }
    // Nouvelle méthode pour supprimer un utilisateur par son ID
    async deleteUserById(id) {
        const { User } = this.server.models();

        // Suppression de l'utilisateur par son identifiant
        await User.query().deleteById(id);
    }
    async updateUserById(id, updates) {
        const { User } = this.server.models();

        // Vérifie si l'utilisateur existe
        const user = await User.query().findById(id);
        if (!user) {
            throw new Error(`Utilisateur avec l'ID ${id} non trouvé`);
        }

        // Met à jour l'utilisateur et retourne les nouvelles données
        return User.query().patchAndFetchById(id, updates);
    }
    async authenticateUser(mail, password) {
        const { User } = this.server.models();
        const Encrypt = require('@randombullshitgo/iut_encrypt');

        const user = await User.query().findOne({ mail });
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        const hashedPassword = Encrypt.sha1(password);
        if (user.password !== hashedPassword) {
            throw new Error('Mot de passe incorrect');
        }

        return true;
    }

    async authenticateAndFetchUser(mail, password) {
        const { User } = this.server.models();
        const Encrypt = require('@randombullshitgo/iut_encrypt');

        const user = await User.query().findOne({ mail });
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        const hashedPassword = Encrypt.sha1(password);
        if (user.password !== hashedPassword) {
            throw new Error('Mot de passe incorrect');
        }

        return user;
    }
    async promoteUserToAdmin(id) {
        const { User } = this.server.models();

        const user = await User.query().findById(id);
        if (!user) {
            throw new Error(`Utilisateur avec l'ID ${id} introuvable`);
        }

        return User.query().patchAndFetchById(id, { scope: 'admin' });
    }
    async addFavoriteMovie(userId, filmId) {
        const { User, Film, Favoris } = this.server.models(); // Vérifie le nom du modèle

        // Vérifie si l'utilisateur existe
        const user = await User.query().findById(userId);
        if (!user) {
            throw new Error(`Utilisateur avec l'ID ${userId} non trouvé`);
        }

        // Vérifie si le film existe
        const film = await Film.query().findById(filmId);
        if (!film) {
            throw new Error(`Film avec l'ID ${filmId} non trouvé`);
        }

        // Vérifie si l'association existe déjà
        const existingFavorite = await Favoris.query()
            .where({ userId, filmId })
            .first();

        if (existingFavorite) {
            const error = new Error('Ce film est déjà dans les favoris de cet utilisateur.');
            error.statusCode = 209;
            throw error;
        }

        // Ajout du film aux favoris de l'utilisateur
        try {
            await Favoris.query().insertAndFetch({ userId, filmId });
        } catch (error) {
            throw new Error(error.message);
        }

        return { message: 'Film ajouté aux favoris avec succès.' };
    }
    async deleteFavoriteMovieById(userId, filmId) {
        const { UserFavoriteMovies } = this.server.models();

        try {
            // Vérifie si le film est dans les favoris de l'utilisateur
            const favorite = await UserFavoriteMovies.query()
                .findOne({ userId, filmId });

            if (!favorite) {
                throw new Error('Ce film n’est pas dans les favoris de cet utilisateur.');
            }

            // Suppression du favori
            await UserFavoriteMovies.query()
                .delete()
                .where({ userId, filmId });

            return { message: 'Film supprimé des favoris avec succès.' };
        } catch (err) {
            throw new Error(`Erreur lors de la suppression du favori : ${err.message}`);
        }
    }


};
