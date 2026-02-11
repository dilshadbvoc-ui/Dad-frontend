import dotenv from 'dotenv';
import path from 'path';
import prisma from '../config/prisma';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const updateMetaToken = async () => {
    const token = 'EAAMfcaNNQFYBQlsBB6vvZAE3ZCrhxdCODpyZBZBKqaAMaNcqZC7CEZCwqWSAoavxqg2RXODX3wtOqYKn4LotsF2Stgtee4BHvEZBnajzP7dmcOZCV8oEXx0c8h496IkgBWCKEUa2MRLZA6JX6MXNPFy0JKZCxWXDmkFuUa7GzVvO87Cg0uMd418LsjLW9c0SIGm9o9ZCrq7D9L25PZB3P9OKtMaURaVFxGQyDlNPaGlIVUqHi98kNOBcAxlAliOsDUnRmgTHRAekVFa4AvOyTxmhcbXbkHJa';
    const email = 'superadmin@crm.com';

    try {
        console.log('Validating token with Meta Graph API...');
        const response = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${token}&fields=id,name`);

        const { id: metaUserId, name } = response.data;
        console.log(`Token valid for Meta User: ${name} (ID: ${metaUserId})`);

        console.log('Connecting to database...');
        await prisma.$connect();

        const user = await prisma.user.update({
            where: { email },
            data: {
                metaAccessToken: token,
                metaUserId: metaUserId
            }
        });

        console.log(`\nSUCCESS! Updated user ${user.email}`);
        console.log(`Meta User ID: ${user.metaUserId}`);
        console.log(`Token set: Yes`);

    } catch (error: any) {
        console.error('Error updating token:', error.response?.data || error.message);
    } finally {
        await prisma.$disconnect();
    }
};

updateMetaToken();
