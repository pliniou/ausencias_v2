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
import { Holiday } from '@/lib/types';
import { formatDateBR } from '@/lib/dateUtils';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const holidaySchema = z.object({
    date: z.string().min(1, "Data é obrigatória"),
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    type: z.string().min(1, "Tipo é obrigatório"),
});

export function HolidaysTab() {
    const { holidays, addHoliday, updateHoliday, deleteHoliday } = useData();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSearch, setEditingSearch] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { register, handleSubmit, setValue, reset, setError, formState: { errors, isSubmitting } } = useForm<z.infer<typeof holidaySchema>>({
        resolver: zodResolver(holidaySchema),
        defaultValues: {
            date: '',
            name: '',
            type: 'NACIONAL',
        }
    });

    const openEdit = (holiday: Holiday) => {
        setEditingSearch(holiday.id);
        reset({
            date: holiday.date,
            name: holiday.name,
            type: holiday.type,
        });
        setIsDialogOpen(true);
    };

    const handleOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            reset({
                date: '',
                name: '',
                type: 'NACIONAL',
            });
            setEditingSearch(null);
        }
    };

    const onSubmit = (data: z.infer<typeof holidaySchema>) => {
        // Check for duplicates
        const duplicate = holidays.find(h => h.date === data.date && h.id !== editingSearch);
        if (duplicate) {
            setError('date', { type: 'manual', message: 'Já existe um feriado nesta data.' });
            return;
        }

        if (editingSearch) {
            updateHoliday(editingSearch, { ...data, type: data.type as Holiday['type'] });
            toast({ title: 'Sucesso!', description: 'Feriado atualizado.' });
        } else {
            addHoliday({ ...data, type: data.type as Holiday['type'] });
            toast({ title: 'Sucesso!', description: 'Feriado cadastrado.' });
        }
        handleOpenChange(false);
    };

    const handleDelete = () => {
        if (deleteId) {
            deleteHoliday(deleteId);
            toast({ title: 'Feriado removido.' });
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">{holidays.length} registros</p>
                <PermissionGate roles={['admin', 'superadmin']}>
                    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 h-8 text-xs">
                                <Plus className="h-3 w-3" /> Novo Feriado
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="font-display">
                                    {editingSearch ? 'Editar Feriado' : 'Novo Feriado'}
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
                                    <Select onValueChange={(v) => setValue('type', v)} defaultValue={editingSearch ? undefined : "NACIONAL"}>
                                        <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NACIONAL">Nacional</SelectItem>
                                            <SelectItem value="ESTADUAL">Estadual</SelectItem>
                                            <SelectItem value="MUNICIPAL">Municipal</SelectItem>
                                            <SelectItem value="PONTO_FACULTATIVO">Ponto Facultativo</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                        {holidays.sort((a, b) => a.date.localeCompare(b.date)).map((holiday) => (
                            <TableRow key={holiday.id} className="h-9 hover:bg-muted/50">
                                <TableCell className="py-1 text-xs">{formatDateBR(holiday.date)}</TableCell>
                                <TableCell className="py-1 text-xs font-medium">{holiday.name}</TableCell>
                                <TableCell className="py-1">
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
                                        {holiday.type.replace('_', ' ')}
                                    </span>
                                </TableCell>
                                <TableCell className="py-1">
                                    <PermissionGate roles={['admin', 'superadmin']}>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:bg-primary/10" onClick={() => openEdit(holiday)}>
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(holiday.id)}>
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
                title="Excluir Feriado"
                description="Confirmar exclusão?"
            />
        </div>
    );
}
