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
import { useConfig } from '@/context/ConfigContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getSuggestedColor, getUsedColors } from '@/lib/colorPalette';

const employeeSchema = z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    role: z.string().min(1, "Selecione o cargo"),
    department: z.string().min(1, "Selecione o departamento"),
    vacationBalance: z.coerce.number().min(0, "Saldo de férias não pode ser negativo"),
    color: z.string().optional(),
});

export function EmployeesTab() {
    const { employees, addEmployee, updateEmployee, deleteEmployee } = useData();
    const { getRoleNames, getDepartmentNames } = useConfig();
    const roles = getRoleNames();
    const departments = getDepartmentNames();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSearch, setEditingSearch] = useState<string | null>(null); // ID if editing
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<z.infer<typeof employeeSchema>>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            name: '',
            role: '',
            department: '',
            vacationBalance: 30,
            color: getSuggestedColor(getUsedColors(employees)),
        }
    });

    const openEdit = (employee: import("@/lib/types").Employee) => {
        setEditingSearch(employee.id);
        reset({
            name: employee.name,
            role: employee.role,
            department: employee.department,
            vacationBalance: employee.vacationBalance,
            color: employee.color || '#003399',
        });
        setIsDialogOpen(true);
    };

    const handleOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            reset({
                name: '',
                role: '',
                department: '',
                vacationBalance: 30,
                color: getSuggestedColor(getUsedColors(employees)),
            });
            setEditingSearch(null);
        }
    };

    const onSubmit = (data: z.infer<typeof employeeSchema>) => {
        if (editingSearch) {
            updateEmployee(editingSearch, data);
            toast({ title: 'Atualizado!', description: 'Dados do colaborador atualizados.' });
        } else {
            addEmployee({
                ...data,
                status: 'ATIVO',
            });
            toast({ title: 'Sucesso!', description: 'Colaborador cadastrado.' });
        }
        handleOpenChange(false);
    };

    const handleDelete = () => {
        if (deleteId) {
            deleteEmployee(deleteId);
            toast({ title: 'Colaborador removido.' });
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                    {employees.length} cadastrados
                </p>
                <PermissionGate roles={['admin', 'superadmin']}>
                    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 h-8 text-xs">
                                <Plus className="h-3 w-3" />
                                Novo Colaborador
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="font-display">
                                    {editingSearch ? 'Editar Colaborador' : 'Cadastrar Colaborador'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Nome Completo *</Label>
                                    <Input
                                        placeholder="Digite o nome"
                                        className={cn("h-8 text-sm", errors.name && "border-destructive")}
                                        {...register('name')}
                                    />
                                    {errors.name && <p className="text-[10px] text-destructive">{errors.name.message}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Cargo *</Label>
                                        <Select onValueChange={(v) => setValue('role', v)} defaultValue={editingSearch ? undefined : ""}>
                                            <SelectTrigger className={cn("h-8 text-sm", errors.role && "border-destructive")}>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.role && <p className="text-[10px] text-destructive">{errors.role.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Departamento *</Label>
                                        <Select onValueChange={(v) => setValue('department', v)} defaultValue={editingSearch ? undefined : ""}>
                                            <SelectTrigger className={cn("h-8 text-sm", errors.department && "border-destructive")}>
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map((dept) => (
                                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.department && <p className="text-[10px] text-destructive">{errors.department.message}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Saldo Férias</Label>
                                        <Input
                                            type="number"
                                            className={cn("h-8 text-sm", errors.vacationBalance && "border-destructive")}
                                            {...register('vacationBalance')}
                                        />
                                        {errors.vacationBalance && <p className="text-[10px] text-destructive">{errors.vacationBalance.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Cor Personalizada</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="color"
                                                className="h-8 w-12 p-1"
                                                {...register('color')}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-8 text-xs" disabled={isSubmitting}>
                                    {isSubmitting ? 'Salvando...' : (editingSearch ? 'Salvar Alterações' : 'Cadastrar')}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </PermissionGate>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="h-9 hover:bg-transparent">
                            <TableHead className="h-9 text-xs font-semibold py-1">Nome</TableHead>
                            <TableHead className="h-9 text-xs font-semibold py-1">Cargo</TableHead>
                            <TableHead className="h-9 text-xs font-semibold py-1">Dep.</TableHead>
                            <TableHead className="h-9 text-xs font-semibold py-1">Saldo</TableHead>
                            <TableHead className="h-9 text-xs font-semibold py-1">Cor</TableHead>
                            <TableHead className="h-9 text-xs font-semibold py-1">Status</TableHead>
                            <TableHead className="h-9 w-20 py-1"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow key={employee.id} className="h-9 hover:bg-muted/50">
                                <TableCell className="py-1 text-xs font-medium">{employee.name}</TableCell>
                                <TableCell className="py-1 text-xs text-muted-foreground">{employee.role}</TableCell>
                                <TableCell className="py-1 text-xs text-muted-foreground">{employee.department}</TableCell>
                                <TableCell className="py-1 text-xs">{employee.vacationBalance}d</TableCell>
                                <TableCell className="py-1">
                                    <div className="h-3 w-3 rounded-full ring-1 ring-border" style={{ backgroundColor: employee.color || '#003399' }} />
                                </TableCell>
                                <TableCell className="py-1">
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${employee.status === 'ATIVO'
                                        ? 'bg-emerald-500/10 text-emerald-600'
                                        : 'bg-slate-500/10 text-slate-500'
                                        }`}>
                                        {employee.status}
                                    </span>
                                </TableCell>
                                <TableCell className="py-1">
                                    <PermissionGate roles={['admin', 'superadmin']}>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
                                                onClick={() => openEdit(employee)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setDeleteId(employee.id)}
                                            >
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
                title="Excluir Colaborador"
                description="Tem certeza? Dados históricos podem ser afetados."
            />
        </div>
    );
}
