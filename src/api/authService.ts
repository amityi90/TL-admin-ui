import api from '../services/api';

type LoginRequest = {
    email: string;
    password: string;
};

type LoginResponse = {
    success?: boolean;
    data?: {
        token?: string;
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

    localStorage.setItem('token', token);
    return token;
};
