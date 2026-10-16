import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { clearSession, isTokenValid } from '../api/session';

// Keeps the dashboard shell from rendering (and firing requests that will only
// 401) when there is no session or it has expired.
const RequireAuth = ({ children }: { children: ReactNode }) => {
    const location = useLocation();

    if (!isTokenValid()) {
        clearSession();
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return <>{children}</>;
};

export default RequireAuth;
