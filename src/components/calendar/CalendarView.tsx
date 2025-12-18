import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/DataContext';
import { getCalendarDays, formatMonthYear, nextMonth, prevMonth, isToday, isWeekend, isDateInRange } from '@/lib/dateUtils';
import { leaveTypeLabels } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Define leave color classes with better visibility
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
        const dateStr = date.toISOString().split('T')[0];
        return holidays.find(h => h.date === dateStr);
    };

    const getEventsForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return companyEvents.filter(e => e.date === dateStr);
    };

    return (
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground capitalize">
                    {formatMonthYear(currentDate)}
                </h2>
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentDate(prevMonth(currentDate))}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="px-3 h-8 text-sm font-medium"
                        onClick={() => setCurrentDate(new Date())}
                    >
                        Hoje
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentDate(nextMonth(currentDate))}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
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
            <div className="grid grid-cols-7 gap-1 bg-muted/30 p-2 rounded-lg">
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
                                            'group relative aspect-square flex flex-col p-1.5 rounded-lg transition-all duration-200 cursor-pointer overflow-hidden',
                                            isCurrentDay && 'bg-primary ring-2 ring-primary shadow-md',
                                            !isCurrentDay && holiday && 'bg-destructive/15 ring-1 ring-destructive/30',
                                            !isCurrentDay && !holiday && dayLeaves.length > 0 && leaveColors && `${leaveColors.bg}/20 ring-1 ${leaveColors.ring}`,
                                            !isCurrentDay && !holiday && dayLeaves.length === 0 && isWeekendDay && 'bg-muted/50',
                                            !isCurrentDay && !holiday && dayLeaves.length === 0 && !isWeekendDay && 'bg-card hover:bg-muted/50',
                                            'hover:scale-[1.02] hover:shadow-sm hover:z-10'
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={cn(
                                                'text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full',
                                                isCurrentDay && 'bg-primary-foreground text-primary',
                                                !isCurrentDay && holiday && 'text-destructive font-bold',
                                                !isCurrentDay && !holiday && dayLeaves.length > 0 && leaveColors && leaveColors.text.replace('text-', 'text-') + ' font-bold',
                                                !isCurrentDay && !holiday && dayLeaves.length === 0 && isWeekendDay && 'text-muted-foreground',
                                                !isCurrentDay && !holiday && dayLeaves.length === 0 && !isWeekendDay && 'text-foreground'
                                            )}>
                                                {day.getDate()}
                                            </span>
                                            {(dayEvents.length > 0 || holiday) && (
                                                <div className="flex gap-0.5">
                                                    {holiday && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                                    )}
                                                    {dayEvents.map((_, i) => (
                                                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-info" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-0.5 w-full mt-auto overflow-hidden">
                                            {dayLeaves.slice(0, 3).map((leave) => {
                                                const colors = leaveColorClasses[leave.type] || leaveColorClasses.DEFAULT;
                                                return (
                                                    <div
                                                        key={leave.id}
                                                        className={cn(
                                                            'text-[7px] leading-tight px-1 py-0.5 rounded truncate font-semibold',
                                                            colors.bg, colors.text
                                                        )}
                                                    >
                                                        {leave.employeeName.split(' ')[0]}
                                                    </div>
                                                );
                                            })}
                                            {dayLeaves.length > 3 && (
                                                <span className="text-[8px] text-muted-foreground font-medium pl-1">
                                                    +{dayLeaves.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                {(holiday || dayLeaves.length > 0 || dayEvents.length > 0) && (
                                    <TooltipContent className="max-w-[220px] p-3">
                                        <p className="font-bold text-sm mb-1">
                                            {day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                        {holiday && (
                                            <p className="text-destructive text-xs font-semibold mb-1">
                                                🎉 {holiday.name}
                                            </p>
                                        )}
                                        {dayEvents.map((ev, i) => (
                                            <p key={i} className="text-info text-xs mb-1">
                                                📅 {ev.name}
                                            </p>
                                        ))}
                                        {dayLeaves.length > 0 && (
                                            <div className="space-y-1 mt-1 pt-1 border-t border-border">
                                                {dayLeaves.map((leave) => (
                                                    <p key={leave.id} className="text-xs">
                                                        <span className="font-medium">{leave.employeeName}</span>
                                                        <span className="text-muted-foreground"> - {leaveTypeLabels[leave.type] || leave.type}</span>
                                                    </p>
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

            {/* Legend */}
            <div className="mt-5 flex flex-wrap gap-3 items-center justify-center pt-4 border-t border-border">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">Hoje</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-leave-vacation" />
                    <span className="text-xs text-muted-foreground">Férias</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-leave-medical" />
                    <span className="text-xs text-muted-foreground">Licença Médica</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-leave-maternity" />
                    <span className="text-xs text-muted-foreground">Maternidade</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="text-xs text-muted-foreground">Feriado</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-info" />
                    <span className="text-xs text-muted-foreground">Evento</span>
                </div>
            </div>
        </div>
    );
}
