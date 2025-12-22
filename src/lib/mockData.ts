import { Employee, Leave, Holiday, CompanyEvent } from './types';

// Função auxiliar para gerar datas dinâmicas e evitar dados "velhos"
const today = new Date();
const currentYear = today.getFullYear();

export const employees: Employee[] = [
    {
        id: '1',
        name: 'João Silva',
        role: 'ANALISTA',
        department: 'Departamento A',
        status: 'ATIVO',
        vacationBalance: 30,
    },
    {
        id: '2',
        name: 'Maria Costa',
        role: 'GERENTE',
        department: 'Departamento A',
        status: 'ATIVO',
        vacationBalance: 20,
    },
    {
        id: '3',
        name: 'Pedro Santos',
        role: 'ASSESSOR SENIOR',
        department: 'Departamento B',
        status: 'ATIVO',
        vacationBalance: 15,
    },
    {
        id: '4',
        name: 'Ana Oliveira',
        role: 'ASSESSOR PLENO',
        department: 'Departamento A',
        status: 'ATIVO',
        vacationBalance: 30,
    },
    {
        id: '5',
        name: 'Carlos Ferreira',
        role: 'ASSESSOR SENIOR',
        department: 'Departamento B',
        status: 'ATIVO',
        vacationBalance: 10,
    },
    {
        id: '6',
        name: 'Juliana Mendes',
        role: 'ASSESSOR PLENO',
        department: 'Departamento A',
        status: 'ATIVO',
        vacationBalance: 30,
    },
    {
        id: '7',
        name: 'Roberto Lima',
        role: 'PRESTADOR DE SERVICO',
        department: 'Departamento C',
        status: 'ATIVO',
        vacationBalance: 0,
    },
    {
        id: '8',
        name: 'Fernanda Rocha',
        role: 'ANALISTA',
        department: 'Departamento B',
        status: 'ATIVO',
        vacationBalance: 30,
    },
];

export const leaves: Leave[] = [
    {
        id: '1',
        employeeId: '1',
        employeeName: 'João Silva',
        employeeRole: 'ANALISTA',
        type: 'FERIAS',
        startDate: `${currentYear + 1}-01-15`,
        endDate: `${currentYear + 1}-01-29`,
        daysOff: 15,
        workDaysOff: 11,
        efficiency: 100,
        status: 'PLANEJADO',
        approvalStatus: 'APPROVED', // Existing data is pre-approved
    }
];

export const holidays: Holiday[] = [
    { id: '1', date: `${currentYear + 1}-01-01`, name: 'Ano Novo', type: 'NACIONAL' },
    { id: '2', date: `${currentYear + 1}-02-16`, name: 'Carnaval', type: 'NACIONAL' },
    { id: '3', date: `${currentYear + 1}-02-17`, name: 'Carnaval', type: 'NACIONAL' },
    { id: '4', date: `${currentYear + 1}-02-18`, name: 'Quarta-feira de Cinzas', type: 'PONTO_FACULTATIVO' },
    { id: '5', date: `${currentYear + 1}-04-03`, name: 'Sexta-feira Santa', type: 'NACIONAL' },
    { id: '6', date: `${currentYear + 1}-04-21`, name: 'Tiradentes', type: 'NACIONAL' },
    { id: '7', date: `${currentYear + 1}-05-01`, name: 'Dia do Trabalho', type: 'NACIONAL' },
    { id: '8', date: `${currentYear + 1}-06-04`, name: 'Corpus Christi', type: 'NACIONAL' },
    { id: '9', date: `${currentYear + 1}-09-07`, name: 'Independência do Brasil', type: 'NACIONAL' },
    { id: '10', date: `${currentYear + 1}-10-12`, name: 'Nossa Senhora Aparecida', type: 'NACIONAL' },
    { id: '11', date: `${currentYear + 1}-11-02`, name: 'Finados', type: 'NACIONAL' },
    { id: '12', date: `${currentYear + 1}-11-15`, name: 'Proclamação da República', type: 'NACIONAL' },
    { id: '13', date: `${currentYear + 1}-11-20`, name: 'Consciência Negra', type: 'NACIONAL' },
    { id: '14', date: `${currentYear + 1}-12-25`, name: 'Natal', type: 'NACIONAL' },
];

export const companyEvents: CompanyEvent[] = [
    { id: '1', date: '2026-01-15', name: 'Reunião de Planejamento Anual', type: 'REUNIAO' },
    { id: '2', date: '2026-02-10', name: 'Treinamento de Segurança', type: 'TREINAMENTO' },
    { id: '3', date: '2026-03-20', name: 'Evento Corporativo', type: 'EVENTO' },
];

export const departments = [
    'Departamento A',
    'Departamento B',
    'Departamento C',
];

export const roles = [
    'GERENTE',
    'ASSESSOR SENIOR',
    'ASSESSOR PLENO',
    'ANALISTA',
    'PRESTADOR DE SERVICO',
];

export const leaveTypes = [
    'FERIAS',
    'LICENCA_MEDICA',
    'LICENCA_MATERNIDADE',
    'LICENCA_PATERNIDADE',
    'CASAMENTO',
    'FALECIMENTO',
    'ESTUDO',
    'DOACAO_SANGUE',
    'COMPARECIMENTO_JUIZO',
    'ALISTAMENTO_ELEITORAL',
    'ABONO',
    'ACIDENTE_TRABALHO',
    'DISPENSA',
    'FOLGA',
    'OUTRO',
];
