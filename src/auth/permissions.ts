/**
 * Sistema de Permissões - Matriz centralizada de controle de acesso
 * Define quais roles podem executar quais ações
 */

// Definição de Roles
export const ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    VIEWER: 'viewer',
};

// Definição de Permissões (Actions)
export const PERMISSIONS = {
    // Afastamentos
    LEAVE_CREATE: 'LEAVE_CREATE',
    LEAVE_EDIT: 'LEAVE_EDIT',
    LEAVE_DELETE: 'LEAVE_DELETE',
    LEAVE_VIEW: 'LEAVE_VIEW',

    // Colaboradores
    EMPLOYEE_CREATE: 'EMPLOYEE_CREATE',
    EMPLOYEE_EDIT: 'EMPLOYEE_EDIT',
    EMPLOYEE_DELETE: 'EMPLOYEE_DELETE',
    EMPLOYEE_VIEW: 'EMPLOYEE_VIEW',

    // Feriados
    HOLIDAY_CREATE: 'HOLIDAY_CREATE',
    HOLIDAY_EDIT: 'HOLIDAY_EDIT',
    HOLIDAY_DELETE: 'HOLIDAY_DELETE',
    HOLIDAY_VIEW: 'HOLIDAY_VIEW',

    // Eventos
    EVENT_CREATE: 'EVENT_CREATE',
    EVENT_EDIT: 'EVENT_EDIT',
    EVENT_DELETE: 'EVENT_DELETE',
    EVENT_VIEW: 'EVENT_VIEW',

    // Usuários
    USER_CREATE: 'USER_CREATE',
    USER_EDIT: 'USER_EDIT',
    USER_DELETE: 'USER_DELETE',
    USER_VIEW: 'USER_VIEW',

    // Sistêmicos
    EXPORT: 'EXPORT',
    VIEW_DASHBOARD: 'VIEW_DASHBOARD',
    VIEW_CALENDAR: 'VIEW_CALENDAR',
};

// Matriz de Permissões: mapeamento de permissão para roles permitidos
const PERMISSION_MATRIX = {
    // Afastamentos
    [PERMISSIONS.LEAVE_VIEW]: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    [PERMISSIONS.LEAVE_CREATE]: [ROLES.ADMIN, ROLES.USER],
    [PERMISSIONS.LEAVE_EDIT]: [ROLES.ADMIN, ROLES.USER],
    [PERMISSIONS.LEAVE_DELETE]: [ROLES.ADMIN], // Apenas admin pode deletar

    // Colaboradores
    [PERMISSIONS.EMPLOYEE_VIEW]: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    [PERMISSIONS.EMPLOYEE_CREATE]: [ROLES.ADMIN],
    [PERMISSIONS.EMPLOYEE_EDIT]: [ROLES.ADMIN],
    [PERMISSIONS.EMPLOYEE_DELETE]: [ROLES.ADMIN],

    // Feriados
    [PERMISSIONS.HOLIDAY_VIEW]: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    [PERMISSIONS.HOLIDAY_CREATE]: [ROLES.ADMIN],
    [PERMISSIONS.HOLIDAY_EDIT]: [ROLES.ADMIN],
    [PERMISSIONS.HOLIDAY_DELETE]: [ROLES.ADMIN],

    // Eventos
    [PERMISSIONS.EVENT_VIEW]: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    [PERMISSIONS.EVENT_CREATE]: [ROLES.ADMIN],
    [PERMISSIONS.EVENT_EDIT]: [ROLES.ADMIN],
    [PERMISSIONS.EVENT_DELETE]: [ROLES.ADMIN],

    // Usuários
    [PERMISSIONS.USER_VIEW]: [ROLES.ADMIN],
    [PERMISSIONS.USER_CREATE]: [ROLES.ADMIN],
    [PERMISSIONS.USER_EDIT]: [ROLES.ADMIN],
    [PERMISSIONS.USER_DELETE]: [ROLES.ADMIN],

    // Sistêmicos
    [PERMISSIONS.EXPORT]: [ROLES.ADMIN, ROLES.USER],
    [PERMISSIONS.VIEW_DASHBOARD]: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    [PERMISSIONS.VIEW_CALENDAR]: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
};

/**
 * Verifica se um role específico tem determinada permissão
 * @param {string} role - Role do usuário (admin, user, viewer)
 * @param {string} permission - Permissão a verificar
 * @returns {boolean}
 */
export function can(role, permission) {
    if (!role || !permission) {
        console.warn('can(): role ou permission indefinidos', { role, permission });
        return false;
    }

    const allowedRoles = PERMISSION_MATRIX[permission];
    if (!allowedRoles) {
        console.warn(`can(): Permissão desconhecida: ${permission}`);
        return false;
    }

    return allowedRoles.includes(role);
}

/**
 * Verifica se um objeto usuário tem determinada permissão
 * @param {Object} user - Objeto usuário com propriedade 'role'
 * @param {string} permission - Permissão a verificar
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
    if (!user || !user.role) {
        console.warn('hasPermission(): usuário inválido ou sem role', user);
        return false;
    }

    return can(user.role, permission);
}

/**
 * Valida se o usuário tem permissão e lança erro se não tiver
 * Use em operações que precisam de enforcement
 * @param {Object} user - Objeto usuário
 * @param {string} permission - Permissão necessária
 * @throws {Error} Se usuário não tiver permissão
 */
export function requirePermission(user, permission) {
    if (!hasPermission(user, permission)) {
        throw new Error(`Permissão negada: você não tem permissão para ${permission}`);
    }
}

/**
 * Retorna todas as permissões de um role
 * @param {string} role - Role do usuário
 * @returns {Array<string>} Lista de permissões
 */
export function getPermissionsForRole(role) {
    return Object.entries(PERMISSION_MATRIX)
        .filter(([_, allowedRoles]) => allowedRoles.includes(role))
        .map(([permission]) => permission);
}

/**
 * Verifica se um role é válido
 * @param {string} role - Role a validar
 * @returns {boolean}
 */
export function isValidRole(role) {
    return Object.values(ROLES).includes(role);
}
