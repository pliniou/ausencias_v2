import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { PermissionGate } from '@/components/PermissionGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { useData } from '@/context/DataContext';
import { CompanyEvent } from '@/lib/types';
import { formatDateBR } from '@/lib/dateUtils';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const eventSchema = z.object({
    date: z.string().min(1, "Data é obrigatória"),
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    type: z.string().min(1, "Tipo é obrigatório"),
    participants: z.array(z.string()).optional(),
});

export function EventsTab() {
    const { companyEvents, addCompanyEvent, updateCompanyEvent, deleteCompanyEvent, employees } = useData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSearch, setEditingSearch] = useState<string | null>(null); // ID
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof eventSchema>>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            date: '',
            name: '',
            type: 'REUNIAO',
            participants: []
        }
    });

    const openEdit = (event: CompanyEvent) => {
        setEditingSearch(event.id);
        reset({
            date: event.date,
            name: event.name,
            type: event.type,
            participants: event.participants || []
        });
        setIsDialogOpen(true);
    };

    const handleOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            reset({
                date: '',
                name: '',
                type: 'REUNIAO',
                participants: []
            });
            setEditingSearch(null);
        }
    };

    const onSubmit = (data: z.infer<typeof eventSchema>) => {
        if (editingSearch) {
            updateCompanyEvent(editingSearch, data);
            toast({ title: 'Sucesso!', description: 'Evento atualizado.' });
        } else {
            addCompanyEvent(data);
            toast({ title: 'Sucesso!', description: 'Evento cadastrado.' });
        }
        handleOpenChange(false);
    };

    const handleDelete = () => {
        if (deleteId) {
            deleteCompanyEvent(deleteId);
            toast({ title: 'Evento removido.' });
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">{companyEvents.length} registros</p>
                <PermissionGate roles={['admin', 'superadmin']}>
                    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 h-8 text-xs">
                                <Plus className="h-3 w-3" /> Novo Evento
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="font-display">
                                    {editingSearch ? 'Editar Evento' : 'Novo Evento'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Data *</Label>
                                    <Input
                                        type="date"
                                        className={cn("h-8 text-sm", errors.date && "border-destructive")}
                                        {...register('date')}
                                    />
                                    {errors.date && <p className="text-[10px] text-destructive">{errors.date.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Nome *</Label>
                                    <Input
                                        className={cn("h-8 text-sm", errors.name && "border-destructive")}
                                        {...register('name')}
                                    />
                                    {errors.name && <p className="text-[10px] text-destructive">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Tipo</Label>
                                    <Select onValueChange={(v) => setValue('type', v)} defaultValue={editingSearch ? undefined : "REUNIAO"}>
                                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="REUNIAO">Reunião</SelectItem>
                                            <SelectItem value="TREINAMENTO">Treinamento</SelectItem>
                                            <SelectItem value="EVENTO">Evento</SelectItem>
                                            <SelectItem value="OUTRO">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Participantes</Label>
                                    <select
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        multiple
                                        style={{ height: '80px' }}
                                        {...register('participants')}
                                    >
                                        {employees.filter(e => e.status === 'ATIVO').map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-muted-foreground">Segure Ctrl (ou Cmd) para selecionar múltiplos.</p>
                                </div>
                                <Button type="submit" className="w-full h-8 text-xs" disabled={isSubmitting}>
                                    {isSubmitting ? 'Salvando...' : (editingSearch ? 'Salvar' : 'Cadastrar')}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </PermissionGate>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="h-9">
                            <TableHead className="h-9 text-xs font-semibold py-1">Data</TableHead>
                            <TableHead className="h-9 text-xs font-semibold py-1">Nome</TableHead>
                            <TableHead className="h-9 text-xs font-semibold py-1">Tipo</TableHead>
                            <TableHead className="h-9 w-20 py-1"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companyEvents.sort((a, b) => a.date.localeCompare(b.date)).map((event) => (
                            <TableRow key={event.id} className="h-9 hover:bg-muted/50">
                                <TableCell className="py-1 text-xs">{formatDateBR(event.date)}</TableCell>
                                <TableCell className="py-1 text-xs font-medium">
                                    {event.name}
                                    {(event.participants?.length || 0) > 0 && <span className="ml-1 text-[10px] text-muted-foreground">({event.participants?.length})</span>}
                                </TableCell>
                                <TableCell className="py-1">
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-500/10 text-sky-600">{event.type}</span>
                                </TableCell>
                                <TableCell className="py-1">
                                    <PermissionGate roles={['admin', 'superadmin']}>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10" onClick={() => openEdit(event)}>
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(event.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </PermissionGate>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={handleDelete}
                title="Excluir Evento"
                description="Confirmar exclusão?"
            />
        </div>
    );
}
