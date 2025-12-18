import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/context/DataContext';
import { getCalendarDays, nextMonth, prevMonth, isToday, isWeekend, isDateInRange, isHoliday, countBusinessDays } from '@/lib/dateUtils';
import { leaveTypeLabels } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Define leave color classes with better visibility (kept same as before)
const leaveColorClasses: Record<string, { bg: string; text: string; ring: string }> = {
    FERIAS: { bg: 'bg-leave-vacation', text: 'text-leave-vacation-foreground', ring: 'ring-leave-vacation/50' },
    LICENCA_MEDICA: { bg: 'bg-leave-medical', text: 'text-leave-medical-foreground', ring: 'ring-leave-medical/50' },
    LICENCA_MATERNIDADE: { bg: 'bg-leave-maternity', text: 'text-leave-maternity-foreground', ring: 'ring-leave-maternity/50' },
    LICENCA_PATERNIDADE: { bg: 'bg-leave-paternity', text: 'text-leave-paternity-foreground', ring: 'ring-leave-paternity/50' },
    CASAMENTO: { bg: 'bg-leave-wedding', text: 'text-leave-wedding-foreground', ring: 'ring-leave-wedding/50' },
    FALECIMENTO: { bg: 'bg-leave-death', text: 'text-leave-death-foreground', ring: 'ring-leave-death/50' },
    ESTUDO: { bg: 'bg-leave-study', text: 'text-leave-study-foreground', ring: 'ring-leave-study/50' },
    DOACAO_SANGUE: { bg: 'bg-leave-blood', text: 'text-leave-blood-foreground', ring: 'ring-leave-blood/50' },
    COMPARECIMENTO_JUIZO: { bg: 'bg-leave-court', text: 'text-leave-court-foreground', ring: 'ring-leave-court/50' },
    ALISTAMENTO_ELEITORAL: { bg: 'bg-leave-electoral', text: 'text-leave-electoral-foreground', ring: 'ring-leave-electoral/50' },
    DEFAULT: { bg: 'bg-leave-other', text: 'text-leave-other-foreground', ring: 'ring-leave-other/50' },
};

interface CalendarViewProps {
    onSelectDate?: (date: Date) => void;
    selectedEmployeeId?: string;
    selectedLeaveType?: string;
}

export function CalendarView({ onSelectDate, selectedEmployeeId, selectedLeaveType }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { leaves, holidays, companyEvents } = useData();

    const calendarDays = useMemo(() => getCalendarDays(currentDate), [currentDate]);

    const businessDaysMap = useMemo(() => countBusinessDays(currentDate, holidays), [currentDate, holidays]);

    const filteredLeaves = useMemo(() => {
        return leaves.filter(leave => {
            if (selectedEmployeeId && leave.employeeId !== selectedEmployeeId) return false;
            if (selectedLeaveType && leave.type !== selectedLeaveType) return false;
            return true;
        });
    }, [leaves, selectedEmployeeId, selectedLeaveType]);

    const getLeavesForDay = (date: Date) => {
        return filteredLeaves.filter(leave =>
            isDateInRange(date, leave.startDate, leave.endDate)
        );
    };

    const getHolidayForDay = (date: Date) => {
        return isHoliday(date, holidays);
    };

    const getEventsForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return companyEvents.filter(e => e.date === dateStr);
    };

    const handleMonthChange = (monthStr: string) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(parseInt(monthStr));
        setCurrentDate(newDate);
    };

    const handleYearChange = (yearStr: string) => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(parseInt(yearStr));
        setCurrentDate(newDate);
    };

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const months = [
        { value: '0', label: 'JANEIRO' }, { value: '1', label: 'FEV' }, { value: '2', label: 'MAR' },
        { value: '3', label: 'ABR' }, { value: '4', label: 'MAI' }, { value: '5', label: 'JUN' },
        { value: '6', label: 'JUL' }, { value: '7', label: 'AGO' }, { value: '8', label: 'SET' },
        { value: '9', label: 'OUT' }, { value: '10', label: 'NOV' }, { value: '11', label: 'DEZ' }
    ];

    const years = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());

    return (
        <div className="bg-card rounded-2xl border border-border/60 shadow-md animate-fade-in overflow-hidden flex flex-col h-full">
            {/* Header Enhanced */}
            <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-muted/20 border-b border-border/50 gap-4">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center bg-background rounded-lg border border-input p-1 shadow-sm">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(prevMonth(currentDate))} className="h-8 w-8 rounded-md">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1 mx-2">
                            <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                                <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 w-[110px] uppercase font-bold text-sm">
                                    <SelectValue>{months[currentMonth].label}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-muted-foreground">/</span>
                            <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                                <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 w-[80px] font-bold text-sm">
                                    <SelectValue>{currentYear}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(nextMonth(currentDate))} className="h-8 w-8 rounded-md">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full border border-primary/10">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-sm font-semibold">{businessDaysMap} Dias Úteis</span>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Week days header */}
                <div className="grid grid-cols-7 mb-4">
                    {weekDays.map((day, index) => (
                        <div
                            key={day}
                            className={cn(
                                'text-center text-xs font-bold py-2 uppercase tracking-wide',
                                index === 0 || index === 6 ? 'text-destructive' : 'text-muted-foreground'
                            )}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                        if (!day) {
                            return <div key={`empty-${index}`} className="aspect-square" />;
                        }

                        const dayLeaves = getLeavesForDay(day);
                        const holiday = getHolidayForDay(day);
                        const dayEvents = getEventsForDay(day);
                        const isCurrentDay = isToday(day);
                        const isWeekendDay = isWeekend(day);
                        const primaryLeave = dayLeaves[0];
                        const leaveColors = primaryLeave ? (leaveColorClasses[primaryLeave.type] || leaveColorClasses.DEFAULT) : null;

                        return (
                            <TooltipProvider key={day.toISOString()}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            onClick={() => onSelectDate?.(day)}
                                            className={cn(
                                                'group relative aspect-square flex flex-col p-2 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden',
                                                isCurrentDay && 'bg-primary border-primary shadow-lg scale-105 z-10',
                                                !isCurrentDay && holiday && 'bg-destructive/5 border-destructive/20 hover:border-destructive/40',
                                                !isCurrentDay && !holiday && dayLeaves.length > 0 && leaveColors && `${leaveColors.bg}/10 border-${leaveColors.ring.split(' ')[0]}`,
                                                !isCurrentDay && !holiday && dayLeaves.length === 0 && isWeekendDay && 'bg-muted/30 border-transparent',
                                                !isCurrentDay && !holiday && dayLeaves.length === 0 && !isWeekendDay && 'bg-card border-border/50 hover:border-primary/50 hover:bg-muted/20',
                                                'hover:shadow-md'
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={cn(
                                                    'text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg',
                                                    isCurrentDay && 'bg-primary-foreground text-primary',
                                                    !isCurrentDay && holiday && 'text-destructive',
                                                    !isCurrentDay && !holiday && dayLeaves.length > 0 && leaveColors && leaveColors.text,
                                                    !isCurrentDay && !holiday && dayLeaves.length === 0 && isWeekendDay && 'text-muted-foreground/50',
                                                    !isCurrentDay && !holiday && dayLeaves.length === 0 && !isWeekendDay && 'text-foreground'
                                                )}>
                                                    {day.getDate()}
                                                </span>
                                                {(dayEvents.length > 0 || holiday) && (
                                                    <div className="flex gap-1 animate-pulse">
                                                        {holiday && (
                                                            <span className="w-2 h-2 rounded-full bg-destructive" />
                                                        )}
                                                        {dayEvents.map((_, i) => (
                                                            <span key={i} className="w-2 h-2 rounded-full bg-info" />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-1 w-full mt-auto">
                                                {dayLeaves.slice(0, 2).map((leave) => {
                                                    const colors = leaveColorClasses[leave.type] || leaveColorClasses.DEFAULT;
                                                    return (
                                                        <div
                                                            key={leave.id}
                                                            className={cn(
                                                                'text-[10px] leading-tight px-1.5 py-0.5 rounded-md truncate font-medium',
                                                                colors.bg, colors.text
                                                            )}
                                                        >
                                                            {leave.employeeName.split(' ')[0]}
                                                        </div>
                                                    );
                                                })}
                                                {dayLeaves.length > 2 && (
                                                    <span className="text-[9px] text-muted-foreground font-medium pl-1">
                                                        +{dayLeaves.length - 2} outros
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    {(holiday || dayLeaves.length > 0 || dayEvents.length > 0) && (
                                        <TooltipContent className="max-w-[200px] p-3 shadow-xl border-border/50">
                                            <p className="font-bold text-sm mb-2 border-b border-border pb-1">
                                                {day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </p>
                                            {holiday && (
                                                <p className="text-destructive text-sm font-bold flex items-center gap-2 mb-1">
                                                    🎉 {holiday.name}
                                                </p>
                                            )}
                                            {dayEvents.map((ev, i) => (
                                                <p key={i} className="text-info text-xs mb-1 font-medium">
                                                    📅 {ev.name}
                                                </p>
                                            ))}
                                            {dayLeaves.length > 0 && (
                                                <div className="space-y-1 mt-2">
                                                    {dayLeaves.map((leave) => (
                                                        <div key={leave.id} className="text-xs p-1 rounded bg-muted/50">
                                                            <span className="font-semibold block">{leave.employeeName}</span>
                                                            <span className="text-muted-foreground">{leaveTypeLabels[leave.type] || leave.type}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
            </div>

            {/* Legend Refined */}
            <div className="p-4 bg-muted/20 border-t border-border/50 mt-auto">
                <div className="flex flex-wrap gap-4 items-center justify-center">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        <span className="text-xs font-medium text-muted-foreground">Hoje</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-leave-vacation" />
                        <span className="text-xs font-medium text-muted-foreground">Férias</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-leave-medical" />
                        <span className="text-xs font-medium text-muted-foreground">Médico</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                        <span className="text-xs font-medium text-muted-foreground">Feriado</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
