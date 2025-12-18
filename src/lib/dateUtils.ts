import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isSameDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDateBR = (date: Date | string) => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd/MM/yyyy', { locale: ptBR });
};

export const formatDateLong = (date: Date | string) => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

export const formatMonthYear = (date: Date) => {
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
};

export const getMonthDays = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
};

export const getCalendarDays = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDayOfWeek = getDay(monthStart);
    const prefixDays = Array(startDayOfWeek).fill(null);

    return [...prefixDays, ...days];
};

export const isWeekend = (date: Date) => {
    const day = getDay(date);
    return day === 0 || day === 6;
};

export const isDateInRange = (date: Date, start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    return isWithinInterval(date, { start: startDate, end: endDate });
};

export const getLeaveStatus = (startDate: string, endDate: string) => {
    const today = startOfDay(new Date());
    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));

    if (isAfter(start, today)) {
        return 'PLANEJADO';
    }
    if (isBefore(end, today)) {
        return 'ENCERRADO';
    }
    return 'ATIVO';
};

export const nextMonth = (date: Date) => addMonths(date, 1);
export const prevMonth = (date: Date) => subMonths(date, 1);

export { isToday, isSameDay, parseISO, format };
