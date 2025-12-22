import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, Clock, Plus, CalendarDays, Settings, Plane, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { LeaveBadge } from '@/components/ui/LeaveBadge';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { DashboardCalendar } from '@/components/dashboard/DashboardCalendar';
import { VacationProgressList } from '@/components/dashboard/VacationProgressList';
import { format } from 'date-fns';

function BrasiliaClock() {
    const [time, setTime] = useState<Date>(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = time.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedDate = time.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="flex flex-col items-center justify-center bg-card rounded-xl p-4 border border-border shadow-sm h-full min-h-[100px]">
            <span className="text-3xl font-bold text-foreground font-mono tracking-wider tabular-nums">{formattedTime}</span>
            <span className="text-sm text-muted-foreground capitalize mt-1">{formattedDate}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 opacity-70">Horário de Brasília</span>
        </div>
    );
}

export default function Index() {
    const { employees, getTodayLeaves, getPendingLeaves, getPlannedLeaves } = useData();
    const { user } = useAuth();

    const todayLeaves = getTodayLeaves(); // Only APPROVED leaves
    const pendingLeaves = getPendingLeaves();
    const plannedLeaves = getPlannedLeaves(); // Only APPROVED planned leaves
    const activeEmployees = employees.filter((e) => e.status === 'ATIVO');

    const isAdmin = user?.role === 'admin';

    // Get top 5 upcoming leaves
    const upcomingLeaves = plannedLeaves
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 5);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between">
                <div className="flex-1 space-y-1 py-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Olá, {user?.username || 'Visitante'}
                    </h1>
                    <p className="text-muted-foreground">
                        Bem-vindo ao Sistema de Gestão de Ausências.
                    </p>
                </div>
                <div className="w-full md:w-80">
                    <BrasiliaClock />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Presentes Hoje"
                    value={activeEmployees.length - todayLeaves.length}
                    subtitle="colaboradores ativos"
                    icon={<Users className="h-5 w-5" />}
                    variant="success"
                />
                <StatCard
                    title="Ausentes Hoje"
                    value={todayLeaves.length}
                    subtitle="em afastamento aprovado"
                    icon={<Plane className="h-5 w-5" />}
                    variant="warning"
                />
                {isAdmin ? (
                    <StatCard
                        title="Aprovações Pendentes"
                        value={pendingLeaves.length}
                        subtitle="solicitações para análise"
                        icon={<AlertCircle className="h-5 w-5" />}
                        variant={pendingLeaves.length > 0 ? "danger" : "default"}
                    />
                ) : (
                    <StatCard
                        title="Meus Afastamentos"
                        value={0} // Placeholder - requires user specific query
                        subtitle="histórico pessoal"
                        icon={<Calendar className="h-5 w-5" />}
                        variant="default"
                    />
                )}
                <StatCard
                    title="Próximos 30 Dias"
                    value={plannedLeaves.length}
                    subtitle="afastamentos agendados"
                    icon={<CalendarDays className="h-5 w-5" />}
                    variant="primary"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Calendar (2/3 width on large screens) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Calendar Component */}
                    <div className="h-[500px]">
                        <DashboardCalendar />
                    </div>

                    {/* Monthly Summary Section (Optional placeholder for now) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo do Mês</CardTitle>
                            <CardDescription>Visão geral dos afastamentos deste mês</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {/* Simple summary pills */}
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium whitespace-nowrap">
                                    <Plane className="w-4 h-4" />
                                    {plannedLeaves.length} Planejados
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 text-warning-foreground rounded-full text-sm font-medium whitespace-nowrap">
                                    <Clock className="w-4 h-4" />
                                    {pendingLeaves.length} Pendentes
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Lists & Actions (1/3 width) */}
                <div className="space-y-6">

                    {/* Quick Actions */}
                    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Ações Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link to="/afastamentos" className="block">
                                <Button className="w-full justify-start gap-3 shadow-sm">
                                    <Plus className="h-4 w-4" />
                                    Solicitar Ausência
                                </Button>
                            </Link>
                            {isAdmin && (
                                <Link to="/admin" className="block">
                                    <Button variant="outline" className="w-full justify-start gap-3 bg-background/50">
                                        <Settings className="h-4 w-4" />
                                        Painel Admin
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    {/* Today's Absences */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex justify-between items-center">
                                <span>Ausentes Hoje</span>
                                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {todayLeaves.length}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0 max-h-[300px] overflow-y-auto">
                            {todayLeaves.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground text-sm">
                                    Ninguém ausente hoje.
                                </div>
                            ) : (
                                todayLeaves.map(leave => (
                                    <div key={leave.id} className="flex items-center justify-between p-2 rounded-lg border bg-card/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                {leave.employeeName.charAt(0)}
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-sm font-medium leading-none">{leave.employeeName}</div>
                                                <div className="text-xs text-muted-foreground">{leave.type}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Upcoming Absences */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex justify-between items-center">
                                <span>Próximos 14 Dias</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0 max-h-[300px] overflow-y-auto">
                            {upcomingLeaves.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground text-sm">
                                    Nada programado.
                                </div>
                            ) : (
                                upcomingLeaves.map(leave => (
                                    <div key={leave.id} className="flex flex-col p-2.5 rounded-lg border bg-card/50 gap-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-sm font-medium">{leave.employeeName}</span>
                                            <LeaveBadge type={leave.type} className="text-[10px] px-1.5 py-0" />
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                                            <Calendar className="w-3 h-3" />
                                            <span>
                                                {format(new Date(leave.startDate), 'dd/MM')} - {format(new Date(leave.endDate), 'dd/MM')}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Vacation Balances */}
                    <VacationProgressList employees={employees} />

                </div>
            </div>
        </div>
    );
}
