import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'ethereal_user',
        pass: process.env.SMTP_PASS || 'ethereal_pass'
    }
});

export const EmailService = {
    /**
     * Send an email
     */
    async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        try {
            console.log(`[EmailService] Sending email to ${to} | Subject: ${subject}`);

            const info = await transporter.sendMail({
                from: '"MERN CRM" <no-reply@merncrm.com>',
                to,
                subject,
                html
            });

            console.log('[EmailService] Message sent:', info.messageId);
            // If using Ethereal: console.log('Preview URL: ' + nodemailer.getTestMessageUrl(info));

            return true;
        } catch (error) {
            console.error('[EmailService] Error sending email:', error);
            return false;
        }
    }
};
