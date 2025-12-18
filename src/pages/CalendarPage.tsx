import { useState } from 'react';
import { Filter } from 'lucide-react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { LeaveCard } from '@/components/leaves/LeaveCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/context/DataContext';
import { leaveTypeLabels } from '@/lib/types';
import { leaveTypes } from '@/lib/mockData';

export default function CalendarPage() {
    const { employees, leaves } = useData();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [selectedLeaveType, setSelectedLeaveType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    const filteredLeaves = leaves.filter(leave => {
        if (selectedEmployeeId && leave.employeeId !== selectedEmployeeId) return false;
        if (selectedLeaveType && leave.type !== selectedLeaveType) return false;
        if (selectedStatus && leave.status !== selectedStatus) return false;
        return true;
    });

    const clearFilters = () => {
        setSelectedEmployeeId('');
        setSelectedLeaveType('');
        setSelectedStatus('');
    };

    const hasFilters = selectedEmployeeId || selectedLeaveType || selectedStatus;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-foreground">
                        Calendário de Afastamentos
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Visualize todos os afastamentos em um calendário interativo
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Filtros</span>
                    {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs">
                            Limpar filtros
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select value={selectedEmployeeId || "all"} onValueChange={(v) => setSelectedEmployeeId(v === "all" ? "" : v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todos os colaboradores" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os colaboradores</SelectItem>
                            {employees.map((employee) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                    {employee.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedLeaveType || "all"} onValueChange={(v) => setSelectedLeaveType(v === "all" ? "" : v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os tipos</SelectItem>
                            {leaveTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {leaveTypeLabels[type]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedStatus || "all"} onValueChange={(v) => setSelectedStatus(v === "all" ? "" : v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os status</SelectItem>
                            <SelectItem value="ATIVO">Ativo</SelectItem>
                            <SelectItem value="PLANEJADO">Planejado</SelectItem>
                            <SelectItem value="ENCERRADO">Encerrado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="xl:col-span-2">
                    <CalendarView
                        selectedEmployeeId={selectedEmployeeId || undefined}
                        selectedLeaveType={selectedLeaveType || undefined}
                    />
                </div>

                {/* Leave List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-display font-semibold text-foreground">
                            Afastamentos ({filteredLeaves.length})
                        </h2>
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {filteredLeaves.length === 0 ? (
                            <div className="bg-card rounded-xl border border-border p-6 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Nenhum afastamento encontrado com os filtros aplicados.
                                </p>
                            </div>
                        ) : (
                            filteredLeaves.map((leave) => (
                                <LeaveCard key={leave.id} leave={leave} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
