import { api } from './api';

export type IssueType = 'bug' | 'feature_request' | 'question' | 'other';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface IssueAttachment {
    documentId?: string;
    url?: string;
    name: string;
    type?: 'voice';
    duration?: number;
    removed?: boolean;
}

export interface IssueAuthor {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string | null;
    role?: string;
}

export interface IssueReply {
    id: string;
    message: string;
    attachments?: IssueAttachment[] | null;
    isFromAdmin: boolean;
    createdAt: string;
    author: IssueAuthor;
}

export interface Issue {
    id: string;
    title: string;
    description: string;
    issueType: IssueType;
    priority: IssuePriority;
    status: IssueStatus;
    attachments?: IssueAttachment[] | null;
    closedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    reportedBy: IssueAuthor;
    organisation?: { id: string; name: string };
    replies?: IssueReply[];
    _count?: { replies: number };
}

export interface CreateIssueData {
    title: string;
    description: string;
    issueType: IssueType;
    priority?: IssuePriority;
    attachments?: IssueAttachment[];
}

export const uploadIssueAttachment = async (file: File): Promise<IssueAttachment> => {
    const maxSize = 5 * 1024 * 1024; // 5MB, matches the backend's /upload/document limit
    if (file.size > maxSize) {
        throw new Error(`File size exceeds the 5MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('category', 'issue_attachment');

    const response = await api.post('/upload/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

    return { documentId: response.data.documentId, url: response.data.url, name: file.name };
};

export const uploadIssueVoiceNote = async (blob: Blob, mimeType: string, durationSeconds: number): Promise<IssueAttachment> => {
    const maxSize = 15 * 1024 * 1024; // 15MB, matches the backend's /upload/voice-note limit
    if (blob.size > maxSize) {
        throw new Error(`Voice note exceeds the 15MB limit. Yours is ${(blob.size / (1024 * 1024)).toFixed(2)}MB.`);
    }

    const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const formData = new FormData();
    formData.append('voice', blob, `voice-message.${extension}`);

    const response = await api.post('/upload/voice-note', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

    return {
        documentId: response.data.documentId,
        url: response.data.url,
        name: 'Voice message',
        type: 'voice',
        duration: durationSeconds
    };
};

export const createIssue = async (data: CreateIssueData) => {
    const response = await api.post<Issue>('/issues', data);
    return response.data;
};

export const getMyIssues = async () => {
    const response = await api.get<Issue[]>('/issues/mine');
    return response.data;
};

export const getAllIssuesForAdmin = async (status?: IssueStatus) => {
    const response = await api.get<Issue[]>('/issues/admin/all', { params: status ? { status } : undefined });
    return response.data;
};

export const getIssueById = async (id: string) => {
    const response = await api.get<Issue>(`/issues/${id}`);
    return response.data;
};

export const addIssueReply = async (id: string, message: string, attachments?: IssueAttachment[]) => {
    const response = await api.post<IssueReply>(`/issues/${id}/replies`, { message, attachments });
    return response.data;
};

export const updateIssueStatus = async (id: string, status: IssueStatus) => {
    const response = await api.put<Issue>(`/issues/${id}/status`, { status });
    return response.data;
};
