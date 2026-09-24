import { api } from './api';

export type EnquiryStatus = 'pending' | 'converted' | 'rejected';

export interface Enquiry {
    id: string;
    companyName: string;
    firstName: string;
    lastName: string | null;
    email: string;
    phone: string | null;
    message: string | null;
    status: EnquiryStatus;
    convertedOrganisationId: string | null;
    convertedOrganisation?: { id: string; name: string } | null;
    reviewedById: string | null;
    reviewedBy?: { firstName: string; lastName: string | null } | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ConvertEnquiryPayload {
    password: string;
    companyName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
}

export const getAllEnquiries = async (): Promise<Enquiry[]> => {
    const res = await api.get('/super-admin/enquiries');
    return res.data.enquiries;
};

export const convertEnquiry = async (id: string, payload: ConvertEnquiryPayload) => {
    const res = await api.post(`/super-admin/enquiries/${id}/convert`, payload);
    return res.data as { organisationId: string; userId: string };
};

export const rejectEnquiry = async (id: string) => {
    const res = await api.post(`/super-admin/enquiries/${id}/reject`);
    return res.data;
};

export const deleteEnquiry = async (id: string) => {
    const res = await api.delete(`/super-admin/enquiries/${id}`);
    return res.data;
};
