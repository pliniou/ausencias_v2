import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useData } from '@/context/DataContext';

export function DashboardCalendar() {
    const { getApprovedLeaves, holidays } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());

    const leaves = getApprovedLeaves();

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Calculate empty days for start of month alignment
    const startDay = monthStart.getDay(); // 0 (Sun) - 6 (Sat)
    const emptyDays = Array(startDay).fill(null);

    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const getDayContent = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');

        // Find leaves for this day
        const dayLeaves = leaves.filter(l => l.startDate <= dateStr && l.endDate >= dateStr);
        // Find holidays
        const dayHoliday = holidays.find(h => {
            // Handle recurring holidays
            if (h.recurring) {
                return h.date.slice(5) === dateStr.slice(5);
            }
            return h.date === dateStr;
        });

        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const hasLeaves = dayLeaves.length > 0;
        const isHoliday = !!dayHoliday;

        return { dayLeaves, dayHoliday, isWeekend, hasLeaves, isHoliday };
    };

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-lg capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4 flex-1">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1 auto-rows-fr">
                    {/* Empty cells for previous month */}
                    {emptyDays.map((_, i) => (
                        <div key={`empty-${i}`} className="p-2 min-h-[40px]" />
                    ))}

                    {days.map((day) => {
                        const { dayLeaves, dayHoliday, isWeekend, hasLeaves, isHoliday } = getDayContent(day);
                        const isCurrentDay = isToday(day);

                        return (
                            <TooltipProvider key={day.toISOString()}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={cn(
                                                "relative p-1 min-h-[4rem] border rounded-lg transition-all hover:border-primary/50 cursor-default flex flex-col items-start justify-between group",
                                                isCurrentDay ? "bg-primary/5 border-primary" : "border-transparent bg-muted/5",
                                                isWeekend && !hasLeaves && !isHoliday && "bg-muted/30 opacity-60",
                                                isHoliday && "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50",
                                                hasLeaves && !isHoliday && "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground",
                                                    isCurrentDay && "bg-primary text-primary-foreground font-bold",
                                                    isHoliday && "text-rose-600 dark:text-rose-400",
                                                    !isCurrentDay && !isHoliday && isWeekend && "text-muted-foreground/50"
                                                )}
                                            >
                                                {format(day, 'd')}
                                            </span>

                                            <div className="w-full flex flex-col gap-1 mt-1">
                                                {isHoliday && (
                                                    <div className="text-[10px] leading-tight truncate px-1 text-rose-600 dark:text-rose-400 font-medium bg-rose-100/50 dark:bg-rose-900/20 rounded-sm">
                                                        {dayHoliday?.name}
                                                    </div>
                                                )}
                                                {hasLeaves && (
                                                    <div className="flex flex-wrap gap-0.5 px-1">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                        {dayLeaves.length > 1 && (
                                                            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-medium">+{dayLeaves.length}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="text-xs space-y-1">
                                            <p className="font-semibold text-foreground border-b pb-1 mb-1">
                                                {format(day, "d 'de' MMMM", { locale: ptBR })}
                                            </p>
                                            {isHoliday && (
                                                <p className="text-rose-500 font-medium flex items-center gap-1">
                                                    🎉 {dayHoliday?.name}
                                                </p>
                                            )}
                                            {dayLeaves.length > 0 ? (
                                                <div className="space-y-1">
                                                    {dayLeaves.map(l => (
                                                        <div key={l.id} className="flex flex-col">
                                                            <span className="font-medium text-indigo-600 dark:text-indigo-300">{l.employeeName}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase">{l.type}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                !isHoliday && <p className="text-muted-foreground italic">Sem ausências</p>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
