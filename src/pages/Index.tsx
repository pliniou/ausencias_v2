import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Clock, Plus, CalendarDays, Settings, ArrowRight, User } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { LeaveBadge } from '@/components/ui/LeaveBadge';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/DataContext';
import { Leave, leaveTypeColors, leaveTypeLabels, Holiday, Employee } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function BrasiliaClock() {
    const [time, setTime] = useState<Date>(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = time.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDate = time.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="flex flex-col items-center bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur rounded-xl p-5 border border-border shadow-sm">
            <span className="text-3xl font-bold text-foreground font-mono tracking-wider">{formattedTime}</span>
            <span className="text-sm text-muted-foreground capitalize mt-1">{formattedDate}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Horário de Brasília</span>
        </div>
    );
}

interface MiniCalendarProps {
    holidays: Holiday[];
    leaves: Leave[];
}

function MiniCalendar({ holidays, leaves }: MiniCalendarProps) {
    const today = new Date();
    const [currentMonth] = useState(today);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const lastDay = new Date(year, month + 1, 0);
        return lastDay.getDate();
    };

    const getFirstDayOfMonth = (date: Date): number => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        return firstDay.getDay();
    };

    const daysInMonth = getDaysInMonth(currentMonth);
    const startDay = getFirstDayOfMonth(currentMonth);

    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const getDateString = (day: number): string => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return date.toISOString().split('T')[0];
    };

    const isHoliday = (day: number | null): Holiday | null => {
        if (!day) return null;
        const dateStr = getDateString(day);
        return holidays.find(h => h.date === dateStr) || null;
    };

    const getLeavesForDay = (day: number | null): Leave[] => {
        if (!day) return [];
        const dateStr = getDateString(day);
        return leaves.filter(leave => {
            return leave.startDate <= dateStr && leave.endDate >= dateStr;
        });
    };

    const isWeekend = (dayIndex: number): boolean => {
        const day = days[dayIndex];
        if (!day) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return date.getDay() === 0 || date.getDay() === 6;
    };

    const isToday = (day: number | null) => {
        if (!day) return false;
        return day === today.getDate() &&
            currentMonth.getMonth() === today.getMonth() &&
            currentMonth.getFullYear() === today.getFullYear();
    };

    const monthName = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <Card className="border">
            <CardHeader className="pb-3">
                <CardTitle className="text-base capitalize">{monthName}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid grid-cols-7 gap-1">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                        <div key={`${day}-${i}`} className={`text-center text-xs font-bold py-1.5 ${i === 0 || i === 6 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {day}
                        </div>
                    ))}
                    {days.map((day, index) => {
                        const holiday = isHoliday(day);
                        const dayLeaves = getLeavesForDay(day);
                        const hasLeaves = dayLeaves.length > 0;
                        const primaryLeave = dayLeaves[0];

                        return (
                            <TooltipProvider key={index}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={cn(
                                                'aspect-square flex flex-col items-center justify-center text-xs rounded-md transition-colors relative cursor-default',
                                                day ? '' : 'pointer-events-none',
                                                isToday(day) && 'bg-primary text-primary-foreground font-bold ring-2 ring-primary/50',
                                                !isToday(day) && holiday && 'bg-destructive/20 text-destructive font-semibold',
                                                !isToday(day) && !holiday && hasLeaves && primaryLeave && 'ring-2 ring-offset-1',
                                                !isToday(day) && !holiday && hasLeaves && primaryLeave?.type === 'FERIAS' && 'bg-leave-vacation/20 text-leave-vacation ring-leave-vacation/50',
                                                !isToday(day) && !holiday && hasLeaves && primaryLeave?.type === 'LICENCA_MEDICA' && 'bg-leave-medical/20 text-leave-medical ring-leave-medical/50',
                                                !isToday(day) && !holiday && hasLeaves && primaryLeave?.type === 'LICENCA_MATERNIDADE' && 'bg-leave-maternity/20 text-leave-maternity ring-leave-maternity/50',
                                                !isToday(day) && !holiday && hasLeaves && primaryLeave?.type === 'LICENCA_PATERNIDADE' && 'bg-leave-paternity/20 text-leave-paternity ring-leave-paternity/50',
                                                !isToday(day) && !holiday && hasLeaves && !['FERIAS', 'LICENCA_MEDICA', 'LICENCA_MATERNIDADE', 'LICENCA_PATERNIDADE'].includes(primaryLeave?.type || '') && 'bg-leave-other/20 text-leave-other ring-leave-other/50',
                                                !isToday(day) && !holiday && !hasLeaves && isWeekend(index) && 'bg-muted/50 text-muted-foreground',
                                                !isToday(day) && !holiday && !hasLeaves && !isWeekend(index) && day && 'text-foreground hover:bg-muted',
                                                !day && 'text-transparent'
                                            )}
                                        >
                                            {day || ''}
                                            {hasLeaves && dayLeaves.length > 1 && (
                                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 text-[8px] bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                                                    {dayLeaves.length}
                                                </span>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    {(holiday || hasLeaves) && (
                                        <TooltipContent className="max-w-[200px]">
                                            {holiday && <p className="font-semibold text-destructive">🎉 {holiday.name}</p>}
                                            {hasLeaves && dayLeaves.map((leave, i) => (
                                                <p key={i} className="text-xs">
                                                    <span className="font-medium">{leave.employeeName.split(' ')[0]}</span>: {leaveTypeLabels[leave.type] || leave.type}
                                                </p>
                                            ))}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-primary" />
                        <span className="text-muted-foreground">Hoje</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-leave-vacation" />
                        <span className="text-muted-foreground">Férias</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-leave-medical" />
                        <span className="text-muted-foreground">Médica</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-destructive/50" />
                        <span className="text-muted-foreground">Feriado</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function VacationProgressCard({ employee }: { employee: Employee }) {
    const balance = employee.vacationBalance || 0;
    const name = employee.name;
    const role = employee.role;
    const usedDays = 30 - balance;
    const percentage = (usedDays / 30) * 100;

    return (
        <div className="p-3 bg-card rounded-lg border border-border hover:shadow-sm hover:border-primary/20 transition-all duration-200">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-foreground leading-tight">{name}</h4>
                        <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                </div>
                <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                    {balance}d
                </span>
            </div>
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Usados: {usedDays}d</span>
                    <span className="text-foreground font-medium">{percentage.toFixed(0)}%</span>
                </div>
                <Progress value={percentage} className="h-1.5" />
            </div>
        </div>
    );
}

export default function Index() {
    const { employees, leaves, holidays, getTodayLeaves } = useData();

    const todayLeaves = getTodayLeaves();
    const activeEmployees = employees.filter((e) => e.status === 'ATIVO');
    const plannedLeaves = leaves.filter((l) => l.status === 'PLANEJADO');

    const employeesAwayToday = useMemo(() => {
        return todayLeaves.map(leave => {
            const employee = employees.find((e) => e.id === leave.employeeId);
            return { ...leave, employee };
        }).filter((item): item is Leave & { employee: Employee } => !!item.employee);
    }, [todayLeaves, employees]);

    return (
        <div className="space-y-5 animate-fade-in pb-6">
            {/* Header with Clock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Visão geral do sistema de gestão de ausências
                        </p>
                    </div>
                </div>
                <div>
                    <BrasiliaClock />
                </div>
            </div>

            {/* Stats Grid - 3 cards only */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    title="Total de Colaboradores"
                    value={activeEmployees.length}
                    subtitle="ativos no sistema"
                    icon={<Users className="h-5 w-5" />}
                    variant="default"
                />
                <StatCard
                    title="Ausentes Hoje"
                    value={todayLeaves.length}
                    subtitle="em afastamento"
                    icon={<Clock className="h-5 w-5" />}
                    variant="warning"
                />
                <StatCard
                    title="Afastamentos Futuros"
                    value={plannedLeaves.length}
                    subtitle="planejados"
                    icon={<Calendar className="h-5 w-5" />}
                    variant="primary"
                />
            </div>

            {/* Main 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Column 1: Vacation Progress + Quick Actions */}
                <div className="space-y-5">
                    <Card className="border">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between text-base">
                                <span>Saldo de Férias</span>
                                <Link to="/cadastros" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                                    Ver todos <ArrowRight className="h-3 w-3" />
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto pt-0">
                            {activeEmployees.slice(0, 5).map((employee) => (
                                <VacationProgressCard key={employee.id} employee={employee} />
                            ))}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border bg-gradient-to-br from-primary/5 to-secondary/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Ações Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                            <Link to="/afastamentos" className="block">
                                <Button className="w-full justify-start gap-3 h-10">
                                    <Plus className="h-4 w-4" />
                                    Novo Afastamento
                                </Button>
                            </Link>
                            <Link to="/calendario" className="block">
                                <Button variant="outline" className="w-full justify-start gap-3 h-10">
                                    <CalendarDays className="h-4 w-4" />
                                    Ver Calendário
                                </Button>
                            </Link>
                            <Link to="/cadastros" className="block">
                                <Button variant="outline" className="w-full justify-start gap-3 h-10">
                                    <Settings className="h-4 w-4" />
                                    Gerenciar Cadastros
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Column 2: Employees Away Today */}
                <div>
                    <Card className="border h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center justify-between text-base">
                                <span>Afastados Hoje</span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    {employeesAwayToday.length} {employeesAwayToday.length === 1 ? 'pessoa' : 'pessoas'}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-[550px] overflow-y-auto pt-0">
                            {employeesAwayToday.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-success/10 flex items-center justify-center">
                                        <Users className="h-7 w-7 text-success" />
                                    </div>
                                    <h3 className="font-bold text-foreground mb-1">
                                        Equipe Completa!
                                    </h3>
                                    <p className="text-muted-foreground text-sm">
                                        Nenhum colaborador está ausente hoje.
                                    </p>
                                </div>
                            ) : (
                                employeesAwayToday.map((item) => {
                                    const employeeName = item.employee.name;
                                    const employeeRole = item.employee.role;
                                    const leaveColor = leaveTypeColors[item.type] || 'bg-muted text-muted-foreground';

                                    return (
                                        <div key={item.id} className={cn(
                                            "p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
                                            leaveColor.includes('vacation') && 'bg-leave-vacation/5 border-leave-vacation/20 hover:border-leave-vacation/40',
                                            leaveColor.includes('medical') && 'bg-leave-medical/5 border-leave-medical/20 hover:border-leave-medical/40',
                                            leaveColor.includes('maternity') && 'bg-leave-maternity/5 border-leave-maternity/20 hover:border-leave-maternity/40',
                                            !leaveColor.includes('vacation') && !leaveColor.includes('medical') && !leaveColor.includes('maternity') && 'bg-muted/30 border-border hover:border-primary/30'
                                        )}>
                                            <div className="flex items-start gap-2.5 mb-2">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                                    leaveColor.includes('vacation') && 'bg-leave-vacation/20',
                                                    leaveColor.includes('medical') && 'bg-leave-medical/20',
                                                    leaveColor.includes('maternity') && 'bg-leave-maternity/20',
                                                    !leaveColor.includes('vacation') && !leaveColor.includes('medical') && !leaveColor.includes('maternity') && 'bg-warning/10'
                                                )}>
                                                    <User className={cn(
                                                        "h-4 w-4",
                                                        leaveColor.includes('vacation') && 'text-leave-vacation',
                                                        leaveColor.includes('medical') && 'text-leave-medical',
                                                        leaveColor.includes('maternity') && 'text-leave-maternity',
                                                        !leaveColor.includes('vacation') && !leaveColor.includes('medical') && !leaveColor.includes('maternity') && 'text-warning'
                                                    )} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm text-foreground truncate">
                                                        {employeeName}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {employeeRole}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <LeaveBadge type={item.type} />
                                                <div className="text-xs grid grid-cols-2 gap-1">
                                                    <div>
                                                        <span className="text-muted-foreground">Início: </span>
                                                        <span className="font-medium text-foreground">
                                                            {new Date(item.startDate).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Término: </span>
                                                        <span className="font-medium text-foreground">
                                                            {new Date(item.endDate).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Column 3: Mini Calendar */}
                <div>
                    <MiniCalendar holidays={holidays} leaves={leaves} />
                </div>
            </div>
        </div>
    );
}
