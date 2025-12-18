/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { ROLES, isValidRole } from '@/auth/permissions';

export interface User {
    id?: number;
    username: string;
    role: string;
    employee_id?: string | null;
    password_hash?: string;
    [key: string]: unknown;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    registerUser: (username: string, password: string, role: string, employeeId?: string | null) => Promise<boolean>;
    changePassword: (userId: number, newPassword: string) => Promise<void>;
    getAllUsers: () => User[];
    deleteUser: (id: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constantes de sessão
const SESSION_KEY = 'ausencias_session';
const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 horas em ms

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            await db.init();

            // Check if users exist, if not create default users
            const usersCount = db.query("SELECT COUNT(*) as count FROM users");
            if (usersCount[0].count === 0) {
                console.log('🔐 Criando usuários iniciais...');

                // Senha padrão para demo: "demo123" (deve ser alterada)
                const defaultHash = bcrypt.hashSync('demo123', 10);

                const seedUsers = [
                    { username: 'admin', role: ROLES.ADMIN },
                    { username: 'usuario', role: ROLES.USER },
                    { username: 'visitante', role: ROLES.VIEWER },
                ];

                seedUsers.forEach(u => {
                    db.run(
                        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                        [u.username, defaultHash, u.role]
                    );
                });

                console.log('✅ Usuários criados com sucesso');
                console.log('⚠️ IMPORTANTE: Senha padrão é "demo123" - altere imediatamente!');
            }

            // Restore session from sessionStorage (não localStorage)
            restoreSession();
            setLoading(false);
        };
        initAuth();
    }, []);

    // Restaurar sessão do sessionStorage com validação de TTL
    const restoreSession = () => {
        try {
            const sessionData = sessionStorage.getItem(SESSION_KEY);
            if (sessionData) {
                const { user: savedUser, timestamp } = JSON.parse(sessionData);
                const now = Date.now();

                // Verificar se sessão não expirou
                if (now - timestamp < SESSION_TTL) {
                    setUser(savedUser);
                } else {
                    console.log('🕐 Sessão expirada');
                    sessionStorage.removeItem(SESSION_KEY);
                }
            }
        } catch (error) {
            console.error('Erro ao restaurar sessão:', error);
            sessionStorage.removeItem(SESSION_KEY);
        }
    };

    // Salvar sessão com timestamp
    const saveSession = (userData: User) => {
        const sessionData = {
            user: userData,
            timestamp: Date.now(),
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    };

    const login = async (username: string, password: string) => {
        const result = db.query("SELECT * FROM users WHERE username = ?", [username]);
        if (result.length === 0) {
            throw new Error("Usuário não encontrado");
        }
        const u = result[0];

        // Normalizar role para padrão
        if (!isValidRole(u.role)) {
            console.warn(`Role inválido encontrado: ${u.role}, ajustando para 'user'`);
            u.role = ROLES.USER;
        }

        const valid = await bcrypt.compare(password, u.password_hash);
        if (!valid) {
            throw new Error("Senha incorreta");
        }

        // Remove password hash from session object for security
        const { password_hash, ...safeUser } = u;
        setUser(safeUser);
        saveSession(safeUser);
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem(SESSION_KEY);
    };

    const registerUser = async (username: string, password: string, role: string, employeeId: string | null = null) => {
        // Validation
        if (!username || !password || !role) throw new Error("Dados inválidos");
        if (!isValidRole(role)) throw new Error(`Role inválido: ${role}`);

        const existing = db.query("SELECT id FROM users WHERE username = ?", [username]);
        if (existing.length > 0) throw new Error("Usuário já existe");

        const hash = await bcrypt.hash(password, 10);
        db.run(
            "INSERT INTO users (username, password_hash, role, employee_id) VALUES (?, ?, ?, ?)",
            [username, hash, role, employeeId]
        );
        return true;
    };

    const changePassword = async (userId: number, newPassword: string) => {
        const hash = await bcrypt.hash(newPassword, 10);
        db.run("UPDATE users SET password_hash = ? WHERE id = ?", [hash, userId]);
    };

    const getAllUsers = () => {
        return db.query("SELECT id, username, role, employee_id, created_at FROM users");
    }

    const deleteUser = (id: number) => {
        db.run("DELETE FROM users WHERE id = ?", [id]);
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            registerUser,
            changePassword,
            getAllUsers,
            deleteUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
