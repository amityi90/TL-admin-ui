import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginAdmin } from '../api/authService';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!email.trim() || !password.trim()) {
            toast.error('Please enter your email and password');
            return;
        }

        setLoading(true);
        try {
            await loginAdmin({
                email: email.trim(),
                password,
            });
            toast.success('Logged in successfully');
            navigate('/inventory', { replace: true });
        } catch (error: any) {
            const message = error?.response?.data?.message ?? error?.message ?? 'Invalid credentials';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="w-full max-w-md border border-gray-200 p-8 shadow-sm">
                <h1 className="text-3xl font-serif text-deep-black">Admin Login</h1>
                <p className="text-gray-500 mt-2 text-sm">Sign in with your admin credentials.</p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-champagne-gold"
                            placeholder="admin@tehilalevi.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-champagne-gold"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-deep-black text-white py-2.5 text-sm tracking-wide hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'SIGNING IN...' : 'SIGN IN'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
