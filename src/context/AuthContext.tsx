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
                }
            } catch (e) {
                // Silent fail for static deployment
                console.warn('Session check failed (expected on static host)', e);
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, []);

    const login = async (username: string, password: string) => {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        });

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response. Check API URL.');
        }

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Login failed');
        }
        const data = await res.json();
        setUser(data.user);
    };

    const logout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        } catch (e) { console.warn('Logout failed', e); }
        setUser(null);
    };

    // Admin helpers (optional)
    const getAllUsers = async () => {
        const res = await fetch('/api/users', { credentials: 'include' });
        const contentType = res.headers.get('content-type');
        if (!res.ok || !contentType?.includes('application/json')) {
            throw new Error('Failed to fetch users or invalid response');
        }
        return await res.json();
    };

    const registerUser = async (username: string, password: string, role: string, employeeId: string | null = null) => {
        if (!isValidRole(role)) throw new Error('Invalid role');
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password, role, employee_id: employeeId }),
        });
        return res.ok;
    };

    const deleteUser = async (id: number) => {
        await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' });
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, getAllUsers, registerUser, deleteUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
