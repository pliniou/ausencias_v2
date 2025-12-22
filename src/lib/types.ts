export const leaveTypeLabels: Record<string, string> = {
    FERIAS: 'Férias',
    LICENCA_MEDICA: 'Licença Médica',
    LICENCA_MATERNIDADE: 'Licença Maternidade',
    LICENCA_PATERNIDADE: 'Licença Paternidade',
    CASAMENTO: 'Casamento',
    FALECIMENTO: 'Falecimento',
    ESTUDO: 'Estudo',
    DOACAO_SANGUE: 'Doação de Sangue',
    COMPARECIMENTO_JUIZO: 'Comparecimento em Juízo',
    ALISTAMENTO_ELEITORAL: 'Alistamento Eleitoral',
    ABONO: 'Abono',
    ACIDENTE_TRABALHO: 'Acidente de Trabalho',
    DISPENSA: 'Dispensa',
    FOLGA: 'Folga',
    OUTRO: 'Outro',
};

export const leaveTypeDescriptions = {
    FERIAS: 'Até 30 dias após cada período de 12 meses de vigência do contrato.',
    LICENCA_MEDICA: 'Afastamento por motivo de doença ou acidente (até 15 dias pagos pela empresa).',
    LICENCA_MATERNIDADE: '120 dias, podendo ser prorrogada.',
    LICENCA_PATERNIDADE: '5 dias consecutivos.',
    CASAMENTO: 'Até 3 dias consecutivos (Gala).',
    FALECIMENTO: 'Até 2 dias consecutivos (Nojo).',
    ESTUDO: 'Ausência para cursos ou exames (ver CCT).',
    DOACAO_SANGUE: '1 dia a cada 12 meses de trabalho.',
    COMPARECIMENTO_JUIZO: 'Pelo tempo que se fizer necessário.',
    ALISTAMENTO_ELEITORAL: 'Até 2 dias consecutivos ou não.',
    ABONO: 'Abono pecuniário (venda de dias de férias).',
    ACIDENTE_TRABALHO: 'Afastamento decorrente de acidente em serviço.',
    DISPENSA: 'Dispensa autorizada pela gestão.',
    FOLGA: 'Dia de descanso remunerado adicional.',
    OUTRO: 'Outros motivos justificados.',
};

export const leaveTypeColors: Record<string, string> = {
    FERIAS: 'bg-leave-vacation text-leave-vacation-foreground',
    LICENCA_MEDICA: 'bg-leave-medical text-leave-medical-foreground',
    LICENCA_MATERNIDADE: 'bg-leave-maternity text-leave-maternity-foreground',
    LICENCA_PATERNIDADE: 'bg-leave-paternity text-leave-paternity-foreground',
    CASAMENTO: 'bg-leave-wedding text-leave-wedding-foreground',
    FALECIMENTO: 'bg-leave-death text-leave-death-foreground',
    ESTUDO: 'bg-leave-study text-leave-study-foreground',
    DOACAO_SANGUE: 'bg-leave-blood text-leave-blood-foreground',
    COMPARECIMENTO_JUIZO: 'bg-leave-court text-leave-court-foreground',
    ALISTAMENTO_ELEITORAL: 'bg-leave-electoral text-leave-electoral-foreground',
    ABONO: 'bg-leave-other text-leave-other-foreground',
    ACIDENTE_TRABALHO: 'bg-leave-medical text-leave-medical-foreground',
    DISPENSA: 'bg-leave-other text-leave-other-foreground',
    FOLGA: 'bg-leave-study text-leave-study-foreground',
    OUTRO: 'bg-leave-other text-leave-other-foreground',
};

// Approval status for leaves
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Leave {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeRole: string;
    startDate: string;
    endDate: string;
    type: string;
    acquisitivePeriodStart?: string;
    acquisitivePeriodEnd?: string;
    daysOff: number;
    efficiency?: number;
    status: string; // ATIVO | PLANEJADO | ENCERRADO (calendar status)
    notes?: string;
    workDaysOff?: number;
    // Approval workflow fields
    approvalStatus: ApprovalStatus;
    decidedBy?: string; // Username of admin who approved/rejected
    decidedAt?: string; // ISO date string of decision
    decisionNote?: string; // Optional note from admin
    createdBy?: string; // Username who created the leave
    createdAt?: string; // ISO date string of creation
}

export interface Employee {
    id: string;
    name: string;
    role: string;
    department: string;
    vacationBalance: number;
    color?: string;
    status: 'ATIVO' | 'INATIVO';
}

export interface Holiday {
    id: string;
    date: string;
    name: string;
    type: 'NACIONAL' | 'ESTADUAL' | 'MUNICIPAL' | 'FACULTATIVO' | 'PONTO_FACULTATIVO';
    recurring?: boolean;
}

export interface CompanyEvent {
    id: string;
    date: string;
    name: string;
    type: string;
    description?: string;
    participants?: string[];
}

// Admin-editable configuration types
export interface RoleItem {
    id: string;
    name: string;
}

export interface DepartmentItem {
    id: string;
    name: string;
}
