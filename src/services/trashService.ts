import axios from 'axios';

const API_URL = '/api/trash';

export const getTrashItems = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const restoreItem = async (type: string, id: string) => {
    const response = await axios.post(`${API_URL}/restore`, { type, id });
    return response.data;
};

export const permanentDelete = async (type: string, id: string) => {
    const response = await axios.delete(`${API_URL}/permanent`, { data: { type, id } });
    return response.data;
};
