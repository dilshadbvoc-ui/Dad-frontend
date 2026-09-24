import { api } from './api';
import type { Node, Edge } from '@xyflow/react';

export interface WhatsAppFlow {
    id: string;
    organisationId: string;
    whatsappAccountId?: string | null;
    name: string;
    description?: string | null;
    isActive: boolean;
    triggerType: 'keyword' | 'any_message' | 'manual';
    triggerKeywords: string[];
    nodes: Node[];
    edges: Edge[];
    createdAt: string;
    updatedAt: string;
    whatsappAccount?: { id: string; phoneNumber: string; displayName?: string | null } | null;
    createdBy?: { id: string; firstName: string; lastName: string } | null;
    _count?: { sessions: number };
}

export interface CreateFlowData {
    name: string;
    description?: string;
    whatsappAccountId?: string | null;
    triggerType?: string;
    triggerKeywords?: string[];
    nodes?: Node[];
    edges?: Edge[];
    isActive?: boolean;
}

export interface WhatsAppFlowSession {
    id: string;
    flowId: string;
    phoneNumber: string;
    currentNodeId?: string | null;
    status: 'active' | 'completed' | 'handed_off' | 'expired';
    startedAt: string;
    lastInteractionAt: string;
}

export const whatsAppFlowService = {
    getFlows: async (): Promise<WhatsAppFlow[]> => {
        const response = await api.get('/whatsapp-flows');
        return response.data;
    },

    getFlowById: async (id: string): Promise<WhatsAppFlow> => {
        const response = await api.get(`/whatsapp-flows/${id}`);
        return response.data;
    },

    createFlow: async (data: CreateFlowData): Promise<WhatsAppFlow> => {
        const response = await api.post('/whatsapp-flows', data);
        return response.data;
    },

    updateFlow: async (id: string, data: Partial<CreateFlowData>): Promise<WhatsAppFlow> => {
        const response = await api.put(`/whatsapp-flows/${id}`, data);
        return response.data;
    },

    deleteFlow: async (id: string): Promise<void> => {
        await api.delete(`/whatsapp-flows/${id}`);
    },

    getFlowSessions: async (id: string): Promise<{ summary: Record<string, number>; sessions: WhatsAppFlowSession[] }> => {
        const response = await api.get(`/whatsapp-flows/${id}/sessions`);
        return response.data;
    },

    testFlow: async (id: string, phoneNumber: string): Promise<{ message: string; sessionId?: string }> => {
        const response = await api.post(`/whatsapp-flows/${id}/test`, { phoneNumber });
        return response.data;
    }
};
