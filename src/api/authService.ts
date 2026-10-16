import api from '../services/api';
import { saveSession } from './session';

type LoginRequest = {
    email: string;
    password: string;
};

type LoginResponse = {
    success?: boolean;
    data?: {
        token?: string;
        user?: { email?: string };
    };
};

export const loginAdmin = async (payload: LoginRequest): Promise<string> => {
    const response = await api.post<LoginResponse>('/auth/login', payload, {
        headers: {
            'Content-Type': 'application/json',
        },
    });

    const token = response.data?.data?.token;
    if (!token) {
        throw new Error('No token received from server');
    }

    saveSession(token, response.data?.data?.user?.email);
    return token;
};
