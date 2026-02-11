"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("../generated/client");
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'ethereal_user',
        pass: process.env.SMTP_PASS || 'ethereal_pass'
    }
});
exports.EmailService = {
    /**
     * Send an email
     */
    sendEmail(to, subject, html, organisationId, createdById, context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[EmailService] Sending email to ${to} | Subject: ${subject}`);
                const info = yield transporter.sendMail({
                    from: '"MERN CRM" <no-reply@merncrm.com>',
                    to,
                    subject,
                    html
                });
                console.log('[EmailService] Message sent:', info.messageId);
                // Save to Interactions
                if (organisationId) {
                    yield prisma_1.default.interaction.create({
                        data: {
                            type: client_1.InteractionType.email,
                            direction: client_1.InteractionDirection.outbound,
                            subject: subject,
                            description: `Email sent to ${to}. Content snippet: ${html.substring(0, 100)}...`,
                            organisationId,
                            createdById,
                            leadId: context === null || context === void 0 ? void 0 : context.leadId,
                            contactId: context === null || context === void 0 ? void 0 : context.contactId,
                            date: new Date()
                        }
                    }).catch(err => console.error('[EmailService] Failed to log interaction:', err));
                }
                return true;
            }
            catch (error) {
                console.error('[EmailService] Error sending email:', error);
                return false;
            }
        });
    },
    /**
     * Replace placeholders like {{firstName}} with actual values
     */
    personalize(text, data) {
        let personalized = text;
        for (const key in data) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            personalized = personalized.replace(regex, data[key] || '');
        }
        return personalized;
    }
};
