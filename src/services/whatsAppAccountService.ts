import { api } from './api';

export interface WhatsAppAccount {
    id: string;
    phoneNumber: string;
    displayName?: string;
    provider: string;
    phoneNumberId?: string;
    wabaId?: string;
    accessToken?: string;
    status: string;
    isDefault: boolean;
    _count?: {
        campaigns: number;
        messages: number;
    };
    assignmentRules?: WhatsAppAssignmentRule[];
}

export interface WhatsAppAssignmentRule {
    id: string;
    whatsappAccountId: string;
    distributionType: string;
    assignedUserIds: string[];
    targetTeamId?: string;
    isActive: boolean;
    assignedUsers?: any[];
    targetTeam?: any;
}

export interface WhatsAppIntegrationReport {
    summary: {
        totalNumbers: number;
        activeNumbers: number;
        inactiveNumbers: number;
        unassignedNumbers: number;
        totalCampaigns: number;
        totalMessages: number;
        totalDelivered: number;
        totalRead: number;
        totalFailed: number;
        deliveryRate: number;
    };
    perAccount: Array<{
        id: string;
        phoneNumber: string;
        displayName?: string;
        status: string;
        campaignCount: number;
        messageCount: number;
        deliveredCount: number;
        readCount: number;
        failedCount: number;
        deliveryRate: number;
        isAssigned: boolean;
    }>;
}

export const whatsAppAccountService = {
    getWhatsAppAccounts: async (): Promise<WhatsAppAccount[]> => {
        const response = await api.get('/whatsapp-accounts');
        return response.data;
    },

    createWhatsAppAccount: async (data: Partial<WhatsAppAccount>): Promise<WhatsAppAccount> => {
        const response = await api.post('/whatsapp-accounts', data);
        return response.data;
    },

    updateWhatsAppAccount: async (id: string, data: Partial<WhatsAppAccount>): Promise<WhatsAppAccount> => {
        const response = await api.put(`/whatsapp-accounts/${id}`, data);
        return response.data;
    },

    deleteWhatsAppAccount: async (id: string): Promise<void> => {
        await api.delete(`/whatsapp-accounts/${id}`);
    },

    getWhatsAppIntegrationReport: async (): Promise<WhatsAppIntegrationReport> => {
        const response = await api.get('/whatsapp-accounts/report/integration');
        return response.data;
    }
};
