'use strict';

const { Service } = require('@hapipal/schmervice');
const nodemailer = require('nodemailer');

module.exports = class MailService extends Service {

    async onPreStart() {
        // Utiliser createTestAccount pour tester avec un serveur SMTP temporaire
        try {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure, // Utilisation du serveur SMTP sécurisé
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });


        } catch (err) {

            throw err;
        }
    }

    /**
     * Fonction pour envoyer un e-mail.
     * @param {Object} mailOptions
     * @param {string} mailOptions.from - Adresse e-mail de l'expéditeur.
     * @param {string} mailOptions.to - Adresse(s) du destinataire.
     * @param {string} mailOptions.subject - Sujet de l'e-mail.
     * @param {string} mailOptions.text - Contenu texte de l'e-mail.
     * @param {string} [mailOptions.html] - Contenu HTML de l'e-mail.
     */
    async sendMail(mailOptions) {
        try {
            const info = await this.transporter.sendMail({
                from: mailOptions.from || 'no-reply@example.com',
                to: mailOptions.to,
                subject: mailOptions.subject,
                text: mailOptions.text,
                html: mailOptions.html
            });


            // Pour les tests, renvoyer l'URL du message envoyé dans la boîte de réception de test
            return { messageId: info.messageId, preview: nodemailer.getTestMessageUrl(info) };
        } catch (err) {

            throw err;
        }
    }
};
