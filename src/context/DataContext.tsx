/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { employees as initialEmployees, leaves as initialLeaves, holidays as initialHolidays, companyEvents as initialEvents } from '@/lib/mockData';
import { getLeaveStatus } from '@/lib/dateUtils';
import { validateVacationRule } from '@/lib/businessRules';
import { dataStore, STORES } from '@/repositories/DataStore';

import { type Leave, type Employee, type Holiday, type CompanyEvent } from "@/lib/types";

interface VacationValidationResult {
    valid: boolean;
    message?: string;
}

interface DataContextType {
    employees: Employee[];
    leaves: Leave[];
    holidays: Holiday[];
    companyEvents: CompanyEvent[];
    addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
    updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;
    addLeave: (leave: Omit<Leave, 'id' | 'status'>) => Promise<void>;
    updateLeave: (id: string, updates: Partial<Leave>) => Promise<void>;
    deleteLeave: (id: string) => Promise<void>;
    addHoliday: (holiday: Omit<Holiday, 'id'>) => Promise<void>;
    updateHoliday: (id: string, updates: Partial<Holiday>) => Promise<void>;
    deleteHoliday: (id: string) => Promise<void>;
    addCompanyEvent: (event: Omit<CompanyEvent, 'id'>) => Promise<void>;
    updateCompanyEvent: (id: string, updates: Partial<CompanyEvent>) => Promise<void>;
    deleteCompanyEvent: (id: string) => Promise<void>;
    getEmployeeById: (id: string) => Employee | undefined;
    getActiveLeaves: () => Leave[];
    getPlannedLeaves: () => Leave[];
    getTodayLeaves: () => Leave[];
    validateVacationRule: (employeeId: string, startDate: string, daysOff: number, acquisitiveStart: string, acquisitiveEnd: string) => VacationValidationResult;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
    children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [companyEvents, setCompanyEvents] = useState<CompanyEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Initialize data from IndexedDB
    useEffect(() => {
        const initData = async () => {
            try {
                await dataStore.init();
                await dataStore.migrate(); // Migrar dados antigos do localStorage

                // Carregar dados do IndexedDB
                const [employeesData, leavesData, holidaysData, eventsData] = await Promise.all([
                    dataStore.getAll(STORES.EMPLOYEES),
                    dataStore.getAll(STORES.LEAVES),
                    dataStore.getAll(STORES.HOLIDAYS),
                    dataStore.getAll(STORES.EVENTS),
                ]);

                const validEmployees = (employeesData as Employee[]) || [];
                const validLeaves = (leavesData as Leave[]) || [];
                const validHolidays = (holidaysData as Holiday[]) || [];
                const validEvents = (eventsData as CompanyEvent[]) || [];

                // Se não houver dados, usar mockData inicial
                setEmployees(validEmployees.length > 0 ? validEmployees : initialEmployees);
                setLeaves(validLeaves.length > 0 ? validLeaves : initialLeaves);
                setHolidays(validHolidays.length > 0 ? validHolidays : initialHolidays);
                setCompanyEvents(validEvents.length > 0 ? validEvents : initialEvents);

                // Salvar mockData inicial se não houver dados
                if (validEmployees.length === 0) await dataStore.setAll(STORES.EMPLOYEES, initialEmployees);
                if (validLeaves.length === 0) await dataStore.setAll(STORES.LEAVES, initialLeaves);
                if (validHolidays.length === 0) await dataStore.setAll(STORES.HOLIDAYS, initialHolidays);
                if (validEvents.length === 0) await dataStore.setAll(STORES.EVENTS, initialEvents);

                setLoading(false);
            } catch (error) {
                console.error('Erro ao inicializar dados:', error);
                // Fallback para mockData
                setEmployees(initialEmployees);
                setLeaves(initialLeaves);
                setHolidays(initialHolidays);
                setCompanyEvents(initialEvents);
                setLoading(false);
            }
        };

        initData();
    }, []);

    // Substituir Math.random por crypto.randomUUID
    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback para navegadores antigos
        return `${Date.now()} -${Math.random().toString(36).substr(2, 9)} `;
    };

    const addEmployee = async (employee: Omit<Employee, 'id'>) => {
        const newEmployee = { ...employee, id: generateId() };
        setEmployees(prev => [...prev, newEmployee]);
        await dataStore.set(STORES.EMPLOYEES, newEmployee);
    };

    const updateEmployee = async (id: string, updates: Partial<Employee>) => {
        const updated = employees.find(emp => emp.id === id);
        if (updated) {
            const newData = { ...updated, ...updates };
            setEmployees(prev => prev.map(emp => emp.id === id ? newData : emp));
            await dataStore.set(STORES.EMPLOYEES, newData);
        }
    };

    const deleteEmployee = async (id: string) => {
        setEmployees(prev => prev.filter(emp => emp.id !== id));
        await dataStore.delete(STORES.EMPLOYEES, id);
    };

    const addLeave = async (leave: Omit<Leave, 'id' | 'status'>) => {
        const status = getLeaveStatus(leave.startDate, leave.endDate);
        const newLeave = { ...leave, id: generateId(), status } as Leave;
        setLeaves(prev => [...prev, newLeave]);
        await dataStore.set(STORES.LEAVES, newLeave);
    };

    const updateLeave = async (id: string, updates: Partial<Leave>) => {
        const leave = leaves.find(l => l.id === id);
        if (leave) {
            const updated = { ...leave, ...updates };
            if (updates.startDate || updates.endDate) {
                updated.status = getLeaveStatus(
                    updates.startDate || leave.startDate,
                    updates.endDate || leave.endDate
                );
            }
            setLeaves(prev => prev.map(l => l.id === id ? updated : l));
            await dataStore.set(STORES.LEAVES, updated);
        }
    };

    const validateVacationRuleImpl = (employeeId: string, _startDate: string, daysOff: number, acquisitiveStart: string, _acquisitiveEnd: string): VacationValidationResult => {
        return validateVacationRule(leaves, employeeId, daysOff, acquisitiveStart);
    };

    const deleteLeave = async (id: string) => {
        setLeaves(prev => prev.filter(leave => leave.id !== id));
        await dataStore.delete(STORES.LEAVES, id);
    };

    const addHoliday = async (holiday: Omit<Holiday, 'id'>) => {
        const newHoliday = { ...holiday, id: generateId() };
        setHolidays(prev => [...prev, newHoliday]);
        await dataStore.set(STORES.HOLIDAYS, newHoliday);
    };

    const updateHoliday = async (id: string, updates: Partial<Holiday>) => {
        const holiday = holidays.find(h => h.id === id);
        if (holiday) {
            const updated = { ...holiday, ...updates };
            setHolidays(prev => prev.map(h => h.id === id ? updated : h));
            await dataStore.set(STORES.HOLIDAYS, updated);
        }
    };

    const deleteHoliday = async (id: string) => {
        setHolidays(prev => prev.filter(h => h.id !== id));
        await dataStore.delete(STORES.HOLIDAYS, id);
    };

    const addCompanyEvent = async (event: Omit<CompanyEvent, 'id'>) => {
        const newEvent = { ...event, id: generateId() };
        setCompanyEvents(prev => [...prev, newEvent]);
        await dataStore.set(STORES.EVENTS, newEvent);
    };

    const updateCompanyEvent = async (id: string, updates: Partial<CompanyEvent>) => {
        const event = companyEvents.find(e => e.id === id);
        if (event) {
            const updated = { ...event, ...updates };
            setCompanyEvents(prev => prev.map(e => e.id === id ? updated : e));
            await dataStore.set(STORES.EVENTS, updated);
        }
    };

    const deleteCompanyEvent = async (id: string) => {
        setCompanyEvents(prev => prev.filter(e => e.id !== id));
        await dataStore.delete(STORES.EVENTS, id);
    };

    const getEmployeeById = (id: string) => employees.find(emp => emp.id === id);

    const getActiveLeaves = () => leaves.filter(leave => leave.status === 'ATIVO');

    const getPlannedLeaves = () => leaves.filter(leave => leave.status === 'PLANEJADO');

    const getTodayLeaves = () => {
        const today = new Date().toISOString().split('T')[0];
        return leaves.filter(leave => {
            return leave.startDate <= today && leave.endDate >= today;
        });
    };

    if (loading) {
        return <div>Carregando dados...</div>;
    }

    return (
        <DataContext.Provider value={{
            employees,
            leaves,
            holidays,
            companyEvents,
            addEmployee,
            updateEmployee,
            deleteEmployee,
            addLeave,
            updateLeave,
            deleteLeave,
            addHoliday,
            updateHoliday,
            deleteHoliday,
            addCompanyEvent,
            updateCompanyEvent,
            deleteCompanyEvent,
            getEmployeeById,
            getActiveLeaves,
            getPlannedLeaves,
            getTodayLeaves,
            validateVacationRule: validateVacationRuleImpl,
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
