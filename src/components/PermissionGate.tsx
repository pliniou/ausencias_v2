import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/auth/permissions';

interface PermissionGateProps {
    children: React.ReactNode;
    permission?: string;
    roles?: string[];
    fallback?: React.ReactNode;
}

/**
 * Componente para controlar a visibilidade de elementos baseado nas permissões do usuário.
 */
export const PermissionGate = ({ children, permission, roles, fallback = null }: PermissionGateProps): React.ReactNode => {
    const { user } = useAuth();

    if (!user) return fallback;

    // Verificar se o usuário tem a permissão necessária
    if (permission && !hasPermission(user, permission)) {
        return fallback;
    }

    // Check roles if provided
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
        return fallback;
    }

    return children;
};
