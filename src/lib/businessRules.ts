import { Leave } from "@/lib/types";

export interface VacationValidationResult {
    valid: boolean;
    message?: string;
}

export const validateVacationRule = (
    leaves: Leave[],
    employeeId: string,
    daysOff: number,
    acquisitiveStart: string
): VacationValidationResult => {
    // Find other vacations in the same acquisitive period
    const employeeVacations = leaves.filter(l =>
        l.employeeId === employeeId &&
        l.type === 'FERIAS' &&
        l.acquisitivePeriodStart === acquisitiveStart
    );

    const totalDaysTaken = employeeVacations.reduce((sum, l) => sum + l.daysOff, 0);
    const newTotal = totalDaysTaken + daysOff;

    if (newTotal > 30) {
        return { valid: false, message: `Limite de 30 dias excedido. Saldo atual: ${Math.max(0, 30 - totalDaysTaken)} dias.` };
    }

    if (daysOff < 5) {
        return { valid: false, message: 'Nenhum período de férias pode ser inferior a 5 dias corridos (CLT).' };
    }

    // Check the 14-day rule
    const allPeriods = [...employeeVacations.map(l => l.daysOff), daysOff];
    const hasFourteenDays = allPeriods.some(d => d >= 14);

    // If we are reaching the 30 days limit (or close to it, implying this is the set of vacations for the year),
    // we must ensure one of them is >= 14 days.
    // However, the rule typically applies to the *total* set of vacations.
    // If the user hasn't finished taking all vacations, they might take the 14-day one later.
    // But if they are *completing* the 30 days, they MUST have one >= 14.
    if (newTotal >= 30 && !hasFourteenDays) {
        return { valid: false, message: 'Pelo menos um dos períodos de férias deve ter 14 dias ou mais (CLT).' };
    }

    return { valid: true };
};
