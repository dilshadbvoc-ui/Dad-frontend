import { api } from './api';

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userId?: string;
    position?: string;
    role?: { id: string; name: string };
    reportsTo?: { id: string; firstName: string; lastName: string };
    isActive: boolean;
    dailyLeadQuota?: number;
    createdAt: string;
}

export interface InviteUserData {
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
    organisationId?: string;
    reportsTo?: string;
    position?: string;
    password?: string;
}

export interface ProfileUpdateData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    profileImage?: string;
}

export interface CustomFieldData {
    name: string;
    label: string;
    type: string;
    entity: string;
    options?: string[];
}

export interface IntegrationSettings {
    connected: boolean;
    pageId?: string;
    accessToken?: string;
    adAccountId?: string;
    phoneNumberId?: string;
    wabaId?: string;
    channelId?: string;
    accountSid?: string;
    authToken?: string;
    phoneNumber?: string;
    forwardTo?: string;
}

export interface OrganisationUpdateData {
    name?: string;
    logo?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    integrations?: Record<string, IntegrationSettings>;
}

export const getUsers = async () => {
    const response = await api.get('/users');
    return response.data;
};

export const inviteUser = async (data: InviteUserData) => {
    const response = await api.post('/users/invite', data);
    return response.data;
};

export const updateUser = async (id: string, data: Partial<User>) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
};

export const deactivateUser = async (id: string) => {
    const response = await api.post(`/users/${id}/deactivate`);
    return response.data;
};

export const getProfile = async () => {
    const response = await api.get('/profile');
    return response.data;
};

export const updateProfile = async (data: ProfileUpdateData) => {
    const response = await api.put('/profile', data);
    return response.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.post('/profile/change-password', data);
    return response.data;
};

export const getRoles = async () => {
    const response = await api.get('/roles');
    return response.data;
};

export const getTerritories = async () => {
    const response = await api.get('/territories');
    return response.data;
};

export const getCustomFields = async (entity?: string) => {
    const response = await api.get('/custom-fields', { params: { entity } });
    return response.data;
};

export const createCustomField = async (data: CustomFieldData) => {
    const response = await api.post('/custom-fields', data);
    return response.data;
};

export const getOrganisation = async () => {
    const response = await api.get('/organisation');
    return response.data;
};

export const updateOrganisation = async (data: OrganisationUpdateData) => {
    const response = await api.put('/organisation', data);
    return response.data;
};

export const getHierarchy = async () => {
    const response = await api.get('/hierarchy');
    return response.data;
};

export const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};
