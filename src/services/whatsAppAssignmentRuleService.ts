import { api } from './api';
import type { WhatsAppAssignmentRule } from './whatsAppAccountService';

export const whatsAppAssignmentRuleService = {
    getRules: async (): Promise<WhatsAppAssignmentRule[]> => {
        const response = await api.get('/whatsapp-assignment-rules');
        return response.data;
    },

    createRule: async (data: Partial<WhatsAppAssignmentRule>): Promise<WhatsAppAssignmentRule> => {
        const response = await api.post('/whatsapp-assignment-rules', data);
        return response.data;
    },

    updateRule: async (id: string, data: Partial<WhatsAppAssignmentRule>): Promise<WhatsAppAssignmentRule> => {
        const response = await api.put(`/whatsapp-assignment-rules/${id}`, data);
        return response.data;
    },

    deleteRule: async (id: string): Promise<void> => {
        await api.delete(`/whatsapp-assignment-rules/${id}`);
    }
};
