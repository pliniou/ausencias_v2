/* eslint-disable react-refresh/only-export-components */
/**
 * ConfigContext - Gerenciamento de configurações editáveis pelo admin
 * Inclui: Cargos (roles) e Departamentos (departments)
 */
import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { dataStore, STORES } from '@/repositories/DataStore';
import { roles as defaultRoles, departments as defaultDepartments } from '@/lib/mockData';
import { type RoleItem, type DepartmentItem } from '@/lib/types';

interface ConfigContextType {
    roles: RoleItem[];
    departments: DepartmentItem[];
    sectorName: string; // Customizable sector name for navbar
    addRole: (name: string) => Promise<void>;
    updateRole: (id: string, name: string) => Promise<void>;
    deleteRole: (id: string) => Promise<void>;
    addDepartment: (name: string) => Promise<void>;
    updateDepartment: (id: string, name: string) => Promise<void>;
    deleteDepartment: (id: string) => Promise<void>;
    setSectorName: (name: string) => Promise<void>;
    getRoleNames: () => string[];
    getDepartmentNames: () => string[];
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
    children: ReactNode;
}

// Convert string array to RoleItem/DepartmentItem array
const toItems = (names: string[]): { id: string; name: string }[] =>
    names.map((name, index) => ({ id: `default-${index}`, name }));

const DEFAULT_SECTOR_NAME = 'RH';

export function ConfigProvider({ children }: ConfigProviderProps) {
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [departments, setDepartments] = useState<DepartmentItem[]>([]);
    const [sectorName, setSectorNameState] = useState<string>(DEFAULT_SECTOR_NAME);
    const [loading, setLoading] = useState(true);

    // Initialize data
    useEffect(() => {
        const initConfig = async () => {
            try {
                await dataStore.init();

                // Load roles
                const rolesData = await dataStore.getAll(STORES.ROLES) as RoleItem[];
                if (rolesData && rolesData.length > 0) {
                    setRoles(rolesData);
                } else {
                    // Migrate from default
                    const defaultRoleItems = toItems(defaultRoles);
                    setRoles(defaultRoleItems);
                    await dataStore.setAll(STORES.ROLES, defaultRoleItems);
                }

                // Load departments
                const depsData = await dataStore.getAll(STORES.DEPARTMENTS) as DepartmentItem[];
                if (depsData && depsData.length > 0) {
                    setDepartments(depsData);
                } else {
                    // Migrate from default
                    const defaultDepItems = toItems(defaultDepartments);
                    setDepartments(defaultDepItems);
                    await dataStore.setAll(STORES.DEPARTMENTS, defaultDepItems);
                }

                // Load sector name from settings
                const settings = await dataStore.getAll(STORES.SETTINGS) as Array<{ id: string; value: string }>;
                const sectorSetting = settings?.find(s => s.id === 'sectorName');
                if (sectorSetting) {
                    setSectorNameState(sectorSetting.value);
                }

                setLoading(false);
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
                // Use defaults
                setRoles(toItems(defaultRoles));
                setDepartments(toItems(defaultDepartments));
                setLoading(false);
            }
        };

        initConfig();
    }, []);

    const generateId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Role CRUD
    const addRole = async (name: string) => {
        const newRole: RoleItem = { id: generateId(), name: name.trim().toUpperCase() };
        setRoles(prev => [...prev, newRole]);
        await dataStore.set(STORES.ROLES, newRole);
    };

    const updateRole = async (id: string, name: string) => {
        const updated: RoleItem = { id, name: name.trim().toUpperCase() };
        setRoles(prev => prev.map(r => r.id === id ? updated : r));
        await dataStore.set(STORES.ROLES, updated);
    };

    const deleteRole = async (id: string) => {
        setRoles(prev => prev.filter(r => r.id !== id));
        await dataStore.delete(STORES.ROLES, id);
    };

    // Department CRUD
    const addDepartment = async (name: string) => {
        const newDep: DepartmentItem = { id: generateId(), name: name.trim() };
        setDepartments(prev => [...prev, newDep]);
        await dataStore.set(STORES.DEPARTMENTS, newDep);
    };

    const updateDepartment = async (id: string, name: string) => {
        const updated: DepartmentItem = { id, name: name.trim() };
        setDepartments(prev => prev.map(d => d.id === id ? updated : d));
        await dataStore.set(STORES.DEPARTMENTS, updated);
    };

    const deleteDepartment = async (id: string) => {
        setDepartments(prev => prev.filter(d => d.id !== id));
        await dataStore.delete(STORES.DEPARTMENTS, id);
    };

    // Sector name setting
    const setSectorName = async (name: string) => {
        const trimmedName = name.trim() || DEFAULT_SECTOR_NAME;
        setSectorNameState(trimmedName);
        await dataStore.set(STORES.SETTINGS, { id: 'sectorName', value: trimmedName });
    };

    // Helpers for dropdowns
    const getRoleNames = () => roles.map(r => r.name);
    const getDepartmentNames = () => departments.map(d => d.name);

    if (loading) {
        return null; // DataProvider handles overall loading
    }

    return (
        <ConfigContext.Provider value={{
            roles,
            departments,
            sectorName,
            addRole,
            updateRole,
            deleteRole,
            addDepartment,
            updateDepartment,
            deleteDepartment,
            setSectorName,
            getRoleNames,
            getDepartmentNames,
        }}>
            {children}
        </ConfigContext.Provider>
    );
}

export function useConfig() {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
}
