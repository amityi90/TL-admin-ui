// The admin session lives in localStorage: the JWT from /auth/login plus the
// signed-in email for the header. Kept in one place so login, logout, the
// route guard and the 401 handler cannot disagree about the keys.

const TOKEN_KEY = 'token';
const EMAIL_KEY = 'adminEmail';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const getAdminEmail = (): string | null => localStorage.getItem(EMAIL_KEY);

export const saveSession = (token: string, email?: string | null): void => {
    localStorage.setItem(TOKEN_KEY, token);
    if (email) localStorage.setItem(EMAIL_KEY, email);
};

export const clearSession = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
};

// Reads `exp` from the JWT payload. This is a UX check only - it saves a round
// trip to a 401 - while the API still verifies every token's signature.
export const isTokenValid = (token: string | null = getToken()): boolean => {
    if (!token) return false;
    try {
        const payload = token.split('.')[1];
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const { exp } = JSON.parse(json) as { exp?: number };
        return typeof exp !== 'number' || exp * 1000 > Date.now();
    } catch {
        return false;
    }
};
