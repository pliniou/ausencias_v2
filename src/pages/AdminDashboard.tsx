import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, User } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useConfig } from '@/context/ConfigContext';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Download, FolderOpen, Clock, Shield, AlertCircle, CheckCircle2, Upload, RefreshCw, Briefcase, Building2, Plus, Pencil, Trash2, RotateCcw } from "lucide-react";
import {
    downloadBackup,
    getBackupSettings,
    toggleDailyBackup,
    isFileSystemAccessSupported,
    chooseBackupDirectory,
    hasBackupDirectory,
    formatBackupDate,
    checkAndRunDailyBackup,
    importBackup,
    type RestoreResult,
} from "@/lib/backupUtils";

const AdminDashboard = () => {
    const { getAllUsers, registerUser, deleteUser, changePassword } = useAuth();
    const { employees } = useData();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('user');
    const [employeeId, setEmployeeId] = useState('none');

    const [error, setError] = useState('');

    // Backup state
    const [backupSettings, setBackupSettings] = useState(getBackupSettings());
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [hasDirectory, setHasDirectory] = useState(false);
    const fsSupported = isFileSystemAccessSupported();

    const loadUsers = useCallback(() => {
        const u = getAllUsers();
        setUsers(u);
    }, [getAllUsers]);

    useEffect(() => {
        loadUsers();

        // Check directory status
        hasBackupDirectory().then(setHasDirectory);

        // Check and run daily backup on mount
        checkAndRunDailyBackup().then(result => {
            if (result.ran && result.success) {
                toast({
                    title: "Backup automático realizado",
                    description: result.message,
                });
            }
        });
    }, [loadUsers, toast]);

    const resetForms = () => {
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setRole('user');
        setEmployeeId('none');
        setNewPassword('');
        setConfirmNewPassword('');
        setError('');
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            setIsSubmitting(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setIsSubmitting(false);
            return;
        }

        try {
            const empId = employeeId === 'none' ? null : employeeId;
            await registerUser(username, password, role, empId);
            setIsOpen(false);
            loadUsers();
            toast({
                title: "Usuário criado com sucesso!",
                description: `O usuário ${username} foi cadastrado.`,
            });
            resetForms();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro desconhecido";
            setError(message);
            toast({
                variant: "destructive",
                title: "Erro ao criar usuário",
                description: message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            try {
                deleteUser(id);
                loadUsers();
                toast({
                    title: "Usuário excluído",
                    description: "O usuário foi removido do sistema.",
                });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Erro desconhecido";
                toast({
                    variant: "destructive",
                    title: "Erro ao excluir usuário",
                    description: message,
                });
            }
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast({ variant: "destructive", title: "Erro", description: "A senha deve ter no mínimo 6 caracteres." });
            return;
        }

        if (newPassword !== confirmNewPassword) {
            toast({ variant: "destructive", title: "Erro", description: "As senhas não coincidem." });
            return;
        }

        if (selectedUserId === null) return;

        try {
            await changePassword(selectedUserId, newPassword);
            setPasswordDialogOpen(false);
            resetForms();
            toast({
                title: "Senha alterada com sucesso!",
                description: "A nova senha foi definida para o usuário.",
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro desconhecido";
            toast({
                variant: "destructive",
                title: "Erro ao alterar senha",
                description: message,
            });
        }
    };

    const openPasswordDialog = (userId: number) => {
        setSelectedUserId(userId);
        setPasswordDialogOpen(true);
    };

    const getEmployeeName = (empId: string | null): string => {
        const emp = employees.find((e) => e.id === empId);
        return emp && typeof emp.name === 'string' ? emp.name : '-';
    };

    // Backup handlers
    const handleManualBackup = async () => {
        setIsBackingUp(true);
        try {
            await downloadBackup();
            setBackupSettings(getBackupSettings());
            toast({
                title: "Backup realizado com sucesso!",
                description: "O arquivo ZIP foi baixado para sua pasta de downloads.",
            });
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Erro ao realizar backup",
                description: err instanceof Error ? err.message : "Erro desconhecido",
            });
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleToggleDailyBackup = (enabled: boolean) => {
        toggleDailyBackup(enabled);
        setBackupSettings(getBackupSettings());
        toast({
            title: enabled ? "Backup diário ativado" : "Backup diário desativado",
            description: enabled
                ? "O backup será realizado automaticamente a cada 24h quando você abrir o app."
                : "O backup automático foi desativado.",
        });
    };

    const handleChooseDirectory = async () => {
        const success = await chooseBackupDirectory();
        if (success) {
            setHasDirectory(true);
            toast({
                title: "Pasta selecionada!",
                description: "Os backups automáticos serão salvos na pasta escolhida.",
            });
        }
    };

    return (
        <div className="space-y-8">
            {/* User Management Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Usuários</h2>
                    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForms(); }}>
                        <DialogTrigger asChild>
                            <Button>Novo Usuário</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
                                <DialogDescription>
                                    Crie um acesso para um funcionário ou administrador.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Usuário</Label>
                                    <Input value={username} onChange={e => setUsername(e.target.value)} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Senha</Label>
                                        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Mín. 6 caracteres" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirmar Senha</Label>
                                        <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repita a senha" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Nível de Acesso</Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Super Admin</SelectItem>
                                            <SelectItem value="user">Usuário (Gestor)</SelectItem>
                                            <SelectItem value="viewer">Visualizador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Vincular a Funcionário</Label>
                                    <Select value={employeeId} onValueChange={setEmployeeId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {employees.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id}>{String(emp.name)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {error && <p className="text-destructive text-sm">{error}</p>}
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Password Change Dialog */}
                    <Dialog open={passwordDialogOpen} onOpenChange={(open) => { setPasswordDialogOpen(open); if (!open) resetForms(); }}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Alterar Senha do Usuário</DialogTitle>
                                <DialogDescription>
                                    Digite a nova senha para o usuário.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nova Senha</Label>
                                    <Input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        placeholder="Digite a nova senha (mín 6)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirmar Nova Senha</Label>
                                    <Input
                                        type="password"
                                        value={confirmNewPassword}
                                        onChange={e => setConfirmNewPassword(e.target.value)}
                                        required
                                        placeholder="Repita a nova senha"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)} className="flex-1">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="flex-1">Alterar Senha</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="glass-card rounded-lg p-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead>Função</TableHead>
                                <TableHead>Funcionário Vinculado</TableHead>
                                <TableHead>Criado Em</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(u => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">{u.username}</TableCell>
                                    <TableCell>{u.role}</TableCell>
                                    <TableCell>{getEmployeeName(u.employee_id || null)}</TableCell>
                                    <TableCell>{u.created_at ? format(new Date(u.created_at as string), 'dd/MM/yyyy') : '-'}</TableCell>
                                    <TableCell className="text-right gap-2 flex justify-end">
                                        <Button variant="outline" size="sm" onClick={() => openPasswordDialog(u.id!)}>Alterar Senha</Button>
                                        {u.username !== 'admin' && (
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(u.id!)}>Excluir</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Backup Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Backup de Dados
                    </CardTitle>
                    <CardDescription>
                        Exporte todos os dados do sistema para um arquivo ZIP seguro. Inclui dados de afastamentos, funcionários, feriados e usuários.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Manual Backup */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Download className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                                <h4 className="font-medium">Backup Manual</h4>
                                <p className="text-sm text-muted-foreground">
                                    Baixe um arquivo ZIP contendo todos os dados do sistema.
                                </p>
                                {backupSettings.lastBackup && (
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Último backup: {formatBackupDate(backupSettings.lastBackup)}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button onClick={handleManualBackup} disabled={isBackingUp} className="gap-2">
                            <Download className="h-4 w-4" />
                            {isBackingUp ? 'Gerando...' : 'Baixar Backup'}
                        </Button>
                    </div>

                    {/* Daily Auto-Backup */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-primary mt-0.5" />
                            <div>
                                <h4 className="font-medium">Backup Diário Automático</h4>
                                <p className="text-sm text-muted-foreground">
                                    Salva automaticamente a cada 24h quando você abre o app.
                                </p>
                                {!fsSupported && (
                                    <p className="text-xs text-warning mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Seu navegador não suporta salvamento automático em pasta. Use o backup manual.
                                    </p>
                                )}
                                {fsSupported && !hasDirectory && backupSettings.dailyBackupEnabled && (
                                    <p className="text-xs text-warning mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Selecione uma pasta para ativar o backup automático.
                                    </p>
                                )}
                                {fsSupported && hasDirectory && (
                                    <p className="text-xs text-success mt-1 flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Pasta configurada. O backup substituirá o arquivo anterior.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {fsSupported && (
                                <Button variant="outline" size="sm" onClick={handleChooseDirectory} className="gap-2">
                                    <FolderOpen className="h-4 w-4" />
                                    Escolher Pasta
                                </Button>
                            )}
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={backupSettings.dailyBackupEnabled}
                                    onCheckedChange={handleToggleDailyBackup}
                                    disabled={!fsSupported}
                                />
                                <span className="text-sm">{backupSettings.dailyBackupEnabled ? 'Ativado' : 'Desativado'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <h4 className="font-medium flex items-center gap-2 text-sm">
                            <Shield className="h-4 w-4 text-primary" />
                            O que está incluído no backup?
                        </h4>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-6 list-disc">
                            <li><strong>app-data.json:</strong> Funcionários, afastamentos, feriados e eventos</li>
                            <li><strong>users-db.json:</strong> Base de dados de usuários (credenciais criptografadas)</li>
                            <li><strong>meta.json:</strong> Versão do backup e data de criação</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Restore Section */}
            <Card className="border-warning/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Restaurar Backup
                    </CardTitle>
                    <CardDescription>
                        Importe dados de um arquivo de backup (.zip) gerado anteriormente. <strong className="text-warning">Atenção:</strong> isso substituirá todos os dados atuais.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <RestoreBackupSection />
                </CardContent>
            </Card>

            {/* Config Section - Cargos & Departamentos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Cargos e Departamentos
                    </CardTitle>
                    <CardDescription>
                        Gerencie os cargos e departamentos disponíveis para seleção ao cadastrar colaboradores.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ConfigSection />
                </CardContent>
            </Card>

            {/* System Reset */}
            <Card className="border-destructive/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <RotateCcw className="h-5 w-5" />
                        Redefinir Sistema
                    </CardTitle>
                    <CardDescription>
                        Restaura o sistema para as configurações iniciais. <strong className="text-destructive">Atenção:</strong> todos os dados serão perdidos (exceto a senha do admin).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResetSystemSection />
                </CardContent>
            </Card>
        </div>
    );
};

// Restore Backup Section Component
function RestoreBackupSection() {
    const { toast } = useToast();
    const [isRestoring, setIsRestoring] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);

    const handleRestore = async () => {
        setShowConfirm(false);
        setIsRestoring(true);
        setRestoreResult(null);

        try {
            const result = await importBackup();
            setRestoreResult(result);

            if (result.success) {
                toast({
                    title: "Backup restaurado com sucesso!",
                    description: "A página será recarregada para aplicar as alterações...",
                });

                // Reload after a short delay to show the success message
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else if (result.message !== 'Nenhum arquivo selecionado') {
                toast({
                    variant: "destructive",
                    title: "Erro ao restaurar backup",
                    description: result.message,
                });
            }
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Erro ao restaurar backup",
                description: err instanceof Error ? err.message : "Erro desconhecido",
            });
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <>
            {/* Confirm Dialog */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-warning">
                            <AlertCircle className="h-5 w-5" />
                            Confirmar Restauração
                        </DialogTitle>
                        <DialogDescription className="space-y-2">
                            <p>
                                <strong>Atenção:</strong> Esta ação irá substituir todos os dados atuais do sistema pelos dados do backup selecionado.
                            </p>
                            <p>
                                Isso inclui: funcionários, afastamentos, feriados, eventos e usuários.
                            </p>
                            <p className="text-warning font-medium">
                                Esta ação não pode ser desfeita!
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleRestore} className="flex-1">
                            Confirmar Restauração
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Restore UI */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-warning/5 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-3">
                    <Upload className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                        <h4 className="font-medium">Importar Backup</h4>
                        <p className="text-sm text-muted-foreground">
                            Selecione um arquivo .zip de backup para restaurar os dados do sistema.
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowConfirm(true)}
                    disabled={isRestoring}
                    className="gap-2 border-warning/50 hover:bg-warning/10"
                >
                    <Upload className="h-4 w-4" />
                    {isRestoring ? 'Restaurando...' : 'Selecionar Arquivo'}
                </Button>
            </div>

            {/* Result Display */}
            {restoreResult && restoreResult.success && (
                <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                    <h4 className="font-medium flex items-center gap-2 text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        Restauração Concluída
                    </h4>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                        {restoreResult.details.meta && (
                            <p>Backup de: {formatBackupDate(restoreResult.details.meta.createdAt)}</p>
                        )}
                        <ul className="ml-4 list-disc">
                            {restoreResult.details.employeesCount !== undefined && (
                                <li>{restoreResult.details.employeesCount} funcionários</li>
                            )}
                            {restoreResult.details.leavesCount !== undefined && (
                                <li>{restoreResult.details.leavesCount} afastamentos</li>
                            )}
                            {restoreResult.details.holidaysCount !== undefined && (
                                <li>{restoreResult.details.holidaysCount} feriados</li>
                            )}
                            {restoreResult.details.eventsCount !== undefined && (
                                <li>{restoreResult.details.eventsCount} eventos</li>
                            )}
                        </ul>
                        {restoreResult.details.usersRestored && (
                            <p className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Base de usuários restaurada
                            </p>
                        )}
                        <p className="text-warning flex items-center gap-1 mt-2">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Recarregando página...
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}

// Config Section Component - Cargos & Departamentos
function ConfigSection() {
    const { roles, departments, addRole, updateRole, deleteRole, addDepartment, updateDepartment, deleteDepartment } = useConfig();
    const { toast } = useToast();

    const [newRole, setNewRole] = useState('');
    const [newDepartment, setNewDepartment] = useState('');
    const [editingRole, setEditingRole] = useState<{ id: string; name: string } | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<{ id: string; name: string } | null>(null);

    // Role handlers
    const handleAddRole = async () => {
        if (!newRole.trim()) return;
        await addRole(newRole);
        setNewRole('');
        toast({ title: "Cargo adicionado", description: `"${newRole.toUpperCase()}" foi adicionado.` });
    };

    const handleUpdateRole = async () => {
        if (!editingRole || !editingRole.name.trim()) return;
        await updateRole(editingRole.id, editingRole.name);
        toast({ title: "Cargo atualizado", description: `Cargo renomeado para "${editingRole.name.toUpperCase()}".` });
        setEditingRole(null);
    };

    const handleDeleteRole = async (id: string, name: string) => {
        if (confirm(`Excluir o cargo "${name}"?`)) {
            await deleteRole(id);
            toast({ title: "Cargo excluído", description: `"${name}" foi removido.` });
        }
    };

    // Department handlers
    const handleAddDepartment = async () => {
        if (!newDepartment.trim()) return;
        await addDepartment(newDepartment);
        setNewDepartment('');
        toast({ title: "Departamento adicionado", description: `"${newDepartment}" foi adicionado.` });
    };

    const handleUpdateDepartment = async () => {
        if (!editingDepartment || !editingDepartment.name.trim()) return;
        await updateDepartment(editingDepartment.id, editingDepartment.name);
        toast({ title: "Departamento atualizado", description: `Departamento renomeado para "${editingDepartment.name}".` });
        setEditingDepartment(null);
    };

    const handleDeleteDepartment = async (id: string, name: string) => {
        if (confirm(`Excluir o departamento "${name}"?`)) {
            await deleteDepartment(id);
            toast({ title: "Departamento excluído", description: `"${name}" foi removido.` });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cargos */}
            <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Cargos ({roles.length})
                </h4>

                {/* Add new role */}
                <div className="flex gap-2">
                    <Input
                        placeholder="Novo cargo..."
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                    />
                    <Button size="sm" onClick={handleAddRole} disabled={!newRole.trim()}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* List */}
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {roles.map(role => (
                        <div key={role.id} className="flex items-center justify-between p-2 hover:bg-muted/50">
                            {editingRole?.id === role.id ? (
                                <Input
                                    value={editingRole.name}
                                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                                    className="h-7 text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateRole()}
                                    autoFocus
                                />
                            ) : (
                                <span className="text-sm">{role.name}</span>
                            )}
                            <div className="flex gap-1">
                                {editingRole?.id === role.id ? (
                                    <>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleUpdateRole}>
                                            <CheckCircle2 className="h-3 w-3 text-success" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingRole(null)}>
                                            <AlertCircle className="h-3 w-3" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingRole(role)}>
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteRole(role.id, role.name)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {roles.length === 0 && (
                        <p className="text-sm text-muted-foreground p-2">Nenhum cargo cadastrado.</p>
                    )}
                </div>
            </div>

            {/* Departamentos */}
            <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Departamentos ({departments.length})
                </h4>

                {/* Add new department */}
                <div className="flex gap-2">
                    <Input
                        placeholder="Novo departamento..."
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                    />
                    <Button size="sm" onClick={handleAddDepartment} disabled={!newDepartment.trim()}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* List */}
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                    {departments.map(dep => (
                        <div key={dep.id} className="flex items-center justify-between p-2 hover:bg-muted/50">
                            {editingDepartment?.id === dep.id ? (
                                <Input
                                    value={editingDepartment.name}
                                    onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                                    className="h-7 text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateDepartment()}
                                    autoFocus
                                />
                            ) : (
                                <span className="text-sm">{dep.name}</span>
                            )}
                            <div className="flex gap-1">
                                {editingDepartment?.id === dep.id ? (
                                    <>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleUpdateDepartment}>
                                            <CheckCircle2 className="h-3 w-3 text-success" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingDepartment(null)}>
                                            <AlertCircle className="h-3 w-3" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingDepartment(dep)}>
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteDepartment(dep.id, dep.name)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {departments.length === 0 && (
                        <p className="text-sm text-muted-foreground p-2">Nenhum departamento cadastrado.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Reset System Section Component
function ResetSystemSection() {
    const { toast } = useToast();
    const [showConfirm, setShowConfirm] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const handleReset = async () => {
        if (confirmText !== 'REDEFINIR') return;

        setIsResetting(true);

        try {
            // Import dataStore for direct IndexedDB access
            const { dataStore, STORES } = await import('@/repositories/DataStore');

            // Helper function for generating IDs with fallback
            const generateId = () => {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                    return crypto.randomUUID();
                }
                return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            };

            // Clear all data stores (but NOT users - preserve admin)
            await dataStore.clear(STORES.EMPLOYEES);
            await dataStore.clear(STORES.LEAVES);
            await dataStore.clear(STORES.HOLIDAYS);
            await dataStore.clear(STORES.EVENTS);
            await dataStore.clear(STORES.ROLES);
            await dataStore.clear(STORES.DEPARTMENTS);

            // Add sample data (1 example of each)
            const sampleEmployee = {
                id: generateId(),
                name: 'Colaborador Exemplo',
                role: 'ANALISTA',
                department: 'Departamento Geral',
                vacationBalance: 30,
                color: '#3B82F6',
                status: 'ATIVO' as const,
            };

            const today = new Date();
            const sampleLeave = {
                id: generateId(),
                employeeId: sampleEmployee.id,
                employeeName: sampleEmployee.name,
                employeeRole: sampleEmployee.role,
                startDate: today.toISOString().split('T')[0],
                endDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                type: 'FERIAS',
                daysOff: 5,
                workDaysOff: 5,
                status: 'ATIVO',
            };

            const sampleHoliday = {
                id: generateId(),
                date: `${today.getFullYear()}-12-25`,
                name: 'Natal',
                type: 'NACIONAL' as const,
            };

            const sampleEvent = {
                id: generateId(),
                date: `${today.getFullYear()}-01-15`,
                name: 'Reunião de Planejamento',
                type: 'REUNIAO',
            };

            const sampleRole = { id: generateId(), name: 'ANALISTA' };
            const sampleDepartment = { id: generateId(), name: 'Departamento Geral' };

            // Save sample data
            await dataStore.set(STORES.EMPLOYEES, sampleEmployee);
            await dataStore.set(STORES.LEAVES, sampleLeave);
            await dataStore.set(STORES.HOLIDAYS, sampleHoliday);
            await dataStore.set(STORES.EVENTS, sampleEvent);
            await dataStore.set(STORES.ROLES, sampleRole);
            await dataStore.set(STORES.DEPARTMENTS, sampleDepartment);

            toast({
                title: "Sistema redefinido!",
                description: "Todos os dados foram resetados. Recarregando...",
            });

            // Reload to apply changes
            setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
            console.error('Reset error:', error);
            toast({
                variant: "destructive",
                title: "Erro ao redefinir",
                description: error instanceof Error ? error.message : "Erro desconhecido",
            });
            setIsResetting(false);
        }
    };

    return (
        <>
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <RotateCcw className="h-5 w-5" />
                            Confirmar Redefinição
                        </DialogTitle>
                        <DialogDescription className="space-y-3">
                            <p>
                                <strong className="text-destructive">ATENÇÃO:</strong> Esta ação irá apagar TODOS os dados do sistema:
                            </p>
                            <ul className="list-disc ml-4 text-sm space-y-1">
                                <li>Todos os colaboradores</li>
                                <li>Todos os afastamentos</li>
                                <li>Todos os feriados</li>
                                <li>Todos os eventos</li>
                                <li>Cargos e departamentos personalizados</li>
                            </ul>
                            <p className="text-sm">
                                A <strong>senha do administrador será preservada</strong>.
                            </p>
                            <div className="pt-2">
                                <Label className="text-sm">Digite REDEFINIR para confirmar:</Label>
                                <Input
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                    placeholder="REDEFINIR"
                                    className="mt-1"
                                />
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 mt-4">
                        <Button variant="outline" onClick={() => { setShowConfirm(false); setConfirmText(''); }} className="flex-1">
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReset}
                            disabled={confirmText !== 'REDEFINIR' || isResetting}
                            className="flex-1"
                        >
                            {isResetting ? 'Redefinindo...' : 'Confirmar Redefinição'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-3">
                    <RotateCcw className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                        <h4 className="font-medium">Redefinir Banco de Dados</h4>
                        <p className="text-sm text-muted-foreground">
                            Limpa todos os dados e restaura com 1 exemplo de cada item (colaborador, afastamento, feriado, evento).
                        </p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    onClick={() => setShowConfirm(true)}
                    className="gap-2"
                >
                    <RotateCcw className="h-4 w-4" />
                    Redefinir Sistema
                </Button>
            </div>
        </>
    );
}

export default AdminDashboard;
