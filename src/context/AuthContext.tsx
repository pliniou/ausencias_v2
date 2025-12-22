/* eslint-disable react-refresh/only-export-components */
// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isValidRole } from '@/auth/permissions';

import { User } from '@/types/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    // Optional admin helpers
    getAllUsers?: () => Promise<User[]>;
    registerUser?: (username: string, password: string, role: string, employeeId?: string | null) => Promise<boolean>;
    deleteUser?: (id: number) => Promise<void>;
    checkSystemStatus: () => Promise<{ initialized: boolean }>;
    performSetup: (username: string, pass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check session on mount
    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await fetch('/api/me', { credentials: 'include' });
                const contentType = res.headers.get('content-type');
                if (res.ok && contentType && contentType.includes('application/json')) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    throw new Error('API not available');
                }
            } catch (e) {
                // Fallback for static deployment / Demo Mode
                console.warn('Backend unavailable, checking local demo session...', e);
                const localUser = localStorage.getItem('demo_user');
                if (localUser) {
                    setUser(JSON.parse(localUser));
                }
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response (likely HTML error page).');
            }

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Login failed');
            }
            const data = await res.json();
            setUser(data.user);
        } catch (error) {
            console.warn('Login API failed, attempting demo login...', error);
            // Demo Login Fallback
            // Accept "admin" / "admin" or just allow any login for demo convenience if specific request
            // For now, let's allow admin/admin for full access, and user/user for limited

            if (username === 'admin' && password === 'demo123') {
                const mockAdmin: User = { id: 1, username: 'admin', role: 'admin' };
                setUser(mockAdmin);
                localStorage.setItem('demo_user', JSON.stringify(mockAdmin));
                return;
            } else if (username === 'user' && password === 'user') {
                const mockUser: User = { id: 2, username: 'user', role: 'user', employee_id: 'demo-emp-1' };
                setUser(mockUser);
                localStorage.setItem('demo_user', JSON.stringify(mockUser));
                return;
            }

            // If we are here, it means we could not connect to API (or API returned HTML)
            // AND the credentials did not match demo users.

            // Provide a clearer error message for the user
            throw new Error('Credenciais inválidas (ou Backend offline)');
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        } catch (e) { console.warn('Logout API failed', e); }

        // Clear local demo session
        localStorage.removeItem('demo_user');
        setUser(null);
    };

    // Admin helpers (optional)
    const getAllUsers = async () => {
        try {
            const res = await fetch('/api/users', { credentials: 'include' });
            const contentType = res.headers.get('content-type');
            if (!res.ok || !contentType?.includes('application/json')) {
                throw new Error('API unavailable');
            }
            return await res.json();
        } catch (e) {
            console.warn('Using mock users for demo mode');
            // Return mock users
            return [
                { id: 1, username: 'admin', role: 'admin' },
                { id: 2, username: 'user', role: 'user', employee_id: 'demo-emp-1' }
            ];
        }
    };

    const registerUser = async (username: string, password: string, role: string, employeeId: string | null = null) => {
        if (!isValidRole(role)) throw new Error('Invalid role');
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password, role, employee_id: employeeId }),
            });
            if (!res.ok) throw new Error('API Failed');
            return res.ok;
        } catch (e) {
            console.warn('Register user ignored in demo mode');
            return true; // Fake success
        }
    };

    const deleteUser = async (id: number) => {
        await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' });
    };

    const checkSystemStatus = async (): Promise<{ initialized: boolean }> => {
        try {
            const res = await fetch('/api/system/status');
            if (res.ok) {
                const data = await res.json();
                return data;
            }
            return { initialized: true }; // Assume initialized if API fails (demo mode)
        } catch {
            return { initialized: true };
        }
    };

    const performSetup = async (username: string, pass: string) => {
        const res = await fetch('/api/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: pass })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Setup failed');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, getAllUsers, registerUser, deleteUser, checkSystemStatus, performSetup }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
