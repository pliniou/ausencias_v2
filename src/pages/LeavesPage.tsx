// Update import to include trash icon if needed
import { useState } from 'react';
import { Plus, List, Grid, Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { PermissionGate } from '@/components/PermissionGate';
import { Leave } from '@/lib/types';
import { LeaveForm } from '@/components/leaves/LeaveForm';
import { LeaveCard } from '@/components/leaves/LeaveCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/context/DataContext';
import { PERMISSIONS } from '@/auth/permissions';
import { LeaveFilters } from '@/components/leaves/LeaveFilters';
import { initialFilters } from '@/components/leaves/LeaveFilters.utils';
import { handleExportCSV, handleExportTXT, exportToXLSX } from '@/lib/exportUtils';
import { toast } from 'sonner';

export default function LeavesPage() {
    const { leaves, getActiveLeaves, getPlannedLeaves, deleteLeave } = useData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [filters, setFilters] = useState(initialFilters);

    const activeLeavesRaw = getActiveLeaves();
    const plannedLeavesRaw = getPlannedLeaves();
    const endedLeavesRaw = leaves.filter((l) => l.status === 'ENCERRADO');

    const basicFilter = (l: Leave) => {
        const matchesSearch = !filters.search || l.employeeName.toLowerCase().includes(filters.search.toLowerCase());
        const matchesType = filters.type === 'all' || l.type === filters.type;
        const matchesStatus = filters.status === 'all' || l.status === filters.status;

        let matchesDate = true;
        if (filters.dateRange?.from) {
            const leaveStart = new Date(l.startDate);
            const leaveEnd = new Date(l.endDate);
            const rangeStart = filters.dateRange.from;
            const rangeEnd = filters.dateRange.to || filters.dateRange.from;

            // Ensure valid dates before comparison
            if (!isNaN(leaveStart.getTime()) && !isNaN(leaveEnd.getTime())) {
                matchesDate = leaveStart <= rangeEnd && leaveEnd >= rangeStart;
            }
        }

        return matchesSearch && matchesType && matchesStatus && matchesDate;
    };

    const activeLeaves = activeLeavesRaw.filter(basicFilter);
    const plannedLeaves = plannedLeavesRaw.filter(basicFilter);
    const endedLeaves = endedLeavesRaw.filter(basicFilter);
    const allLeaves = leaves.filter(basicFilter);

    const onExportCSV = () => {
        handleExportCSV(allLeaves);
        toast.success('Arquivo CSV exportado!', { description: 'Compatível com Excel pt-BR (UTF-8 com BOM)' });
    };

    const onExportXLSX = async () => {
        await exportToXLSX(allLeaves);
        toast.success('Arquivo Excel exportado!', { description: 'Planilha XLSX gerada com sucesso' });
    };

    const onExportTXT = () => {
        handleExportTXT(allLeaves);
        toast.success('Arquivo TXT exportado!', { description: 'Relatório em texto simples' });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ... header ... */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-foreground">
                        Afastamentos
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie todos os afastamentos dos colaboradores
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                Exportar
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Formato de Exportação</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onExportCSV} className="gap-2 cursor-pointer">
                                <FileText className="h-4 w-4 text-green-600" />
                                <div className="flex flex-col">
                                    <span>Exportar CSV</span>
                                    <span className="text-xs text-muted-foreground">Excel pt-BR compatível</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onExportXLSX} className="gap-2 cursor-pointer">
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                <div className="flex flex-col">
                                    <span>Exportar XLSX</span>
                                    <span className="text-xs text-muted-foreground">Planilha Excel nativa</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onExportTXT} className="gap-2 cursor-pointer">
                                <File className="h-4 w-4 text-blue-600" />
                                <div className="flex flex-col">
                                    <span>Exportar TXT</span>
                                    <span className="text-xs text-muted-foreground">Relatório em texto</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center border border-border rounded-lg p-1">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    <PermissionGate permission={PERMISSIONS.LEAVE_CREATE}>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Novo Afastamento
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="font-display">Registrar Novo Afastamento</DialogTitle>
                                </DialogHeader>
                                <LeaveForm onSuccess={() => setIsDialogOpen(false)} />
                            </DialogContent>
                        </Dialog>
                    </PermissionGate>
                </div>
            </div>

            <LeaveFilters filters={filters} onChange={setFilters} />

            <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active">
                        Ativos ({activeLeaves.length})
                    </TabsTrigger>
                    <TabsTrigger value="planned">
                        Planejados ({plannedLeaves.length})
                    </TabsTrigger>
                    <TabsTrigger value="ended">
                        Encerrados ({endedLeaves.length})
                    </TabsTrigger>
                    <TabsTrigger value="all">
                        Todos ({allLeaves.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    {activeLeaves.length === 0 ? (
                        <EmptyState message={filters.search || filters.type !== 'all' || filters.status !== 'all' || filters.dateRange ? "Nenhum resultado para os filtros." : "Nenhum afastamento ativo no momento."} />
                    ) : (
                        <LeaveGrid leaves={activeLeaves} viewMode={viewMode} onDelete={deleteLeave} />
                    )}
                </TabsContent>

                <TabsContent value="planned" className="space-y-4">
                    {plannedLeaves.length === 0 ? (
                        <EmptyState message={filters.search || filters.type !== 'all' || filters.status !== 'all' || filters.dateRange ? "Nenhum resultado para os filtros." : "Nenhum afastamento planejado."} />
                    ) : (
                        <LeaveGrid leaves={plannedLeaves} viewMode={viewMode} onDelete={deleteLeave} />
                    )}
                </TabsContent>

                <TabsContent value="ended" className="space-y-4">
                    {endedLeaves.length === 0 ? (
                        <EmptyState message={filters.search || filters.type !== 'all' || filters.status !== 'all' || filters.dateRange ? "Nenhum resultado para os filtros." : "Nenhum afastamento encerrado."} />
                    ) : (
                        <LeaveGrid leaves={endedLeaves} viewMode={viewMode} onDelete={deleteLeave} />
                    )}
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                    {allLeaves.length === 0 ? (
                        <EmptyState message={filters.search || filters.type !== 'all' || filters.status !== 'all' || filters.dateRange ? "Nenhum resultado para os filtros." : "Nenhum afastamento registrado."} />
                    ) : (
                        <LeaveGrid leaves={allLeaves} viewMode={viewMode} onDelete={deleteLeave} />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function LeaveGrid({ leaves, viewMode, onDelete }: { leaves: Leave[], viewMode: string, onDelete: (id: string) => Promise<void> }) {
    return (
        <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
        }>
            {leaves.map((leave) => (
                <LeaveCard key={leave.id} leave={leave} onDelete={onDelete} />
            ))}
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}
