import { api } from './api';

export interface PipelineStage {
    id: string;
    name: string;
    order: number;
    color?: string;
}

export interface Pipeline {
    id: string;
    name: string;
    stages: PipelineStage[];
    isDefault: boolean;
    createdAt: string;
}

export interface CreatePipelineData {
    name: string;
    stages: { name: string; order: number; color?: string }[];
    isDefault?: boolean;
}

export const getPipelines = async () => {
    const response = await api.get<Pipeline[]>('/pipelines');
    return response.data;
};

export const createPipeline = async (data: CreatePipelineData) => {
    const response = await api.post<Pipeline>('/pipelines', data);
    return response.data;
};

export const updatePipeline = async (id: string, data: Partial<CreatePipelineData>) => {
    const response = await api.put<Pipeline>(`/pipelines/${id}`, data);
    return response.data;
};

export const deletePipeline = async (id: string) => {
    await api.delete(`/pipelines/${id}`);
};
