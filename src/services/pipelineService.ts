import { api } from './api';

export interface PipelineStage {
    id?: string;
    name: string;
    color?: string;
    order?: number;
}

export interface Pipeline {
    id: string;
    name: string;
    description?: string;
    stages: PipelineStage[];
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    _count?: {
        leads: number;
        opportunities: number;
    };
}

export interface CreatePipelinePayload {
    name: string;
    description?: string;
    stages: PipelineStage[];
    isDefault?: boolean;
}

export const getPipelines = async (): Promise<Pipeline[]> => {
    const { data } = await api.get('/pipelines');
    return data;
};

export const createPipeline = async (payload: CreatePipelinePayload): Promise<Pipeline> => {
    const { data } = await api.post('/pipelines', payload);
    return data;
};

export const updatePipeline = async (id: string, payload: Partial<CreatePipelinePayload>): Promise<Pipeline> => {
    const { data } = await api.put(`/pipelines/${id}`, payload);
    return data;
};

export const deletePipeline = async (id: string): Promise<void> => {
    await api.delete(`/pipelines/${id}`);
};
