import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import {
    Users, Calendar, LayoutDashboard,
    Briefcase, Plus, Trash2, CheckCircle2,
    Download, Upload
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/auth";
import { useData } from "@/context/DataContext";
import { useConfig } from "@/context/ConfigContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Holiday } from "@/lib/types";

import {
    downloadBackup,
    importBackup,
} from "@/lib/backupUtils";

// Import registration components (consolidated from RegistrationsPage)
// Import registration components (consolidated from RegistrationsPage)
import { EmployeesTab } from "@/components/registrations/EmployeesTab";
import { EventsTab } from "@/components/registrations/EventsTab";
import { ApprovalQueueTab } from "@/components/admin/ApprovalQueueTab";

export default function AdminDashboard() {
    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-display font-bold text-foreground">Administração</h1>
                <p className="text-muted-foreground">Gerencie usuários, configurações e dados do sistema.</p>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-7 lg:w-[900px] mb-8">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="approvals">Aprovações</TabsTrigger>
                    <TabsTrigger value="users">Usuários</TabsTrigger>
                    <TabsTrigger value="employees">Colaboradores</TabsTrigger>
                    <TabsTrigger value="holidays">Feriados</TabsTrigger>
                    <TabsTrigger value="events">Eventos</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <OverviewTab />
                </TabsContent>

                <TabsContent value="approvals" className="space-y-6">
                    <ApprovalQueueTab />
                </TabsContent>

                <TabsContent value="users" className="space-y-6">
                    <UsersTab />
                </TabsContent>

                <TabsContent value="employees" className="space-y-6">
                    <EmployeesTab />
                </TabsContent>

                <TabsContent value="holidays" className="space-y-6">
                    <HolidaysTab />
                </TabsContent>

                <TabsContent value="events" className="space-y-6">
                    <EventsTab />
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <SettingsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// --- TAB COMPONENTS ---

function OverviewTab() {
    const { employees, leaves, holidays } = useData();
    const { getAllUsers } = useAuth();
    const [userCount, setUserCount] = useState(0);

    useEffect(() => {
        if (getAllUsers) {
            getAllUsers().then(users => setUserCount(users.length)).catch(() => setUserCount(0));
        }
    }, [getAllUsers]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{employees.length}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Afastamentos Ativos</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{leaves.filter(l => l.status === 'ATIVO').length}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Usuários do Sistema</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{userCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Feriados Cadastrados</CardTitle>
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{holidays.length}</div>
                </CardContent>
            </Card>
        </div>
    );
}

function UsersTab() {
    const { getAllUsers, registerUser, deleteUser } = useAuth();
    const { employees } = useData();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // User Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [employeeId, setEmployeeId] = useState('none');

    const loadUsers = useCallback(async () => {
        if (getAllUsers) {
            try {
                const fetchedUsers = await getAllUsers();
                setUsers(fetchedUsers);
            } catch {
                setUsers([]);
            }
        }
    }, [getAllUsers]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleRegister = async () => {
        if (!registerUser) return;
        try {
            await registerUser(username, password, role, employeeId === 'none' ? null : employeeId);
            setIsOpen(false);
            loadUsers();
            toast({ title: "Sucesso", description: "Usuário criado." });
            setUsername(''); setPassword('');
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Erro desconhecido";
            toast({ variant: "destructive", title: "Erro", description: message });
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Confirmar exclusão?")) {
            if (deleteUser) {
                await deleteUser(id);
                loadUsers();
                toast({ title: "Usuário removido" });
            }
        }
    }

    const getEmployeeName = (id: string | null) => employees.find(e => e.id === id)?.name || '-';

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Usuários</CardTitle>
                    <CardDescription>Gerencie o acesso ao sistema</CardDescription>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Novo Usuário</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome de Usuário</Label>
                                <Input value={username} onChange={e => setUsername(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Senha</Label>
                                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Permissão</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Vincular Funcionário</Label>
                                <Select value={employeeId} onValueChange={setEmployeeId}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleRegister} className="w-full">Salvar</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Permissão</TableHead>
                            <TableHead>Funcionário</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(u => (
                            <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.username}</TableCell>
                                <TableCell className="capitalize">{u.role}</TableCell>
                                <TableCell>{getEmployeeName(u.employee_id || null)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(u.id!)} disabled={u.username === 'admin'}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function HolidaysTab() {
    const { holidays, addHoliday, deleteHoliday } = useData();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    // Form
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState('NACIONAL');
    const [recurring, setRecurring] = useState(false);

    const handleSave = async () => {
        if (!name || !date) return;
        try {
            await addHoliday({ name, date, type: type as Holiday['type'], recurring });
            setIsOpen(false);
            setName(''); setDate(''); setRecurring(false);
            toast({ title: "Feriado adicionado" });
        } catch (e: unknown) {
            toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar feriado" });
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Feriados</CardTitle>
                    <CardDescription>Gerencie os feriados e folgas nacionais/regionais</CardDescription>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Adicionar Feriado</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Novo Feriado</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Natal" />
                            </div>
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NACIONAL">Nacional</SelectItem>
                                        <SelectItem value="ESTADUAL">Estadual</SelectItem>
                                        <SelectItem value="MUNICIPAL">Municipal</SelectItem>
                                        <SelectItem value="FACULTATIVO">Facultativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="recurring" checked={recurring} onCheckedChange={setRecurring} />
                                <Label htmlFor="recurring">Repetir todo ano (Recorrente)</Label>
                            </div>
                            <Button onClick={handleSave} className="w-full">Salvar</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Recorrente</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {holidays.sort((a, b) => a.date.localeCompare(b.date)).map(h => (
                            <TableRow key={h.id}>
                                <TableCell>{format(new Date(h.date), 'dd/MM')}{!h.recurring && `/${format(new Date(h.date), 'yyyy')}`}</TableCell>
                                <TableCell className="font-medium">{h.name}</TableCell>
                                <TableCell><span className="text-xs bg-muted px-2 py-1 rounded">{h.type}</span></TableCell>
                                <TableCell>{h.recurring ? <CheckCircle2 className="h-4 w-4 text-primary" /> : '-'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteHoliday(h.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function SettingsTab() {
    // Backup & Config Logic
    // Use ConfigContext for Roles/Departments
    const { roles, addRole, deleteRole, departments, addDepartment, deleteDepartment, sectorName, setSectorName } = useConfig();
    const [newRole, setNewRole] = useState('');
    const [newDept, setNewDept] = useState('');
    const [tempSectorName, setTempSectorName] = useState(sectorName);

    useEffect(() => {
        setTempSectorName(sectorName);
    }, [sectorName]);

    const handleSaveSector = async () => {
        if (setSectorName) {
            await setSectorName(tempSectorName);
            // toast({ title: "Nome do setor atualizado" }); // toast needed from hook
        }
    };

    // Backup Logic
    const { toast } = useToast();
    const [isBackingUp, setIsBackingUp] = useState(false);

    const handleManualBackup = async () => {
        setIsBackingUp(true);
        try {
            await downloadBackup();
            toast({ title: "Backup realizado!" });
        } catch (e: unknown) { toast({ variant: "destructive", title: "Erro", description: "Falha no backup" }); }
        finally { setIsBackingUp(false); }
    };

    return (
        <div className="space-y-6">
            {/* General Settings */}
            <Card>
                <CardHeader><CardTitle>Geral</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-2 max-w-md">
                        <Label>Nome do Setor (Exibido no Topo)</Label>
                        <div className="flex gap-2">
                            <Input value={tempSectorName} onChange={e => setTempSectorName(e.target.value)} placeholder="Ex: RH" />
                            <Button onClick={handleSaveSector}>Salvar</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Roles & Departments Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Cargos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input placeholder="Novo Cargo" value={newRole} onChange={e => setNewRole(e.target.value)} />
                            <Button size="icon" onClick={() => { addRole(newRole); setNewRole(''); }}><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="max-h-[200px] overflow-auto space-y-1">
                            {roles.map(r => (
                                <div key={r.id} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                                    <span>{r.name}</span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteRole(r.id)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Departamentos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input placeholder="Novo Departamento" value={newDept} onChange={e => setNewDept(e.target.value)} />
                            <Button size="icon" onClick={() => { addDepartment(newDept); setNewDept(''); }}><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="max-h-[200px] overflow-auto space-y-1">
                            {departments.map(d => (
                                <div key={d.id} className="flex justify-between items-center p-2 bg-muted/20 rounded">
                                    <span>{d.name}</span>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteDepartment(d.id)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Backup Section */}
            <Card>
                <CardHeader><CardTitle>Backup e Restauração</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                            <div className="font-medium flex items-center gap-2"><Download className="h-4 w-4" /> Backup Manual</div>
                            <p className="text-sm text-muted-foreground">Baixe todos os dados em um arquivo ZIP.</p>
                        </div>
                        <Button onClick={handleManualBackup} disabled={isBackingUp}>{isBackingUp ? 'Gerando...' : 'Baixar'}</Button>
                    </div>
                    {/* Placeholder for Import - simplified for brevity */}
                    <div className="flex items-center justify-between p-4 border rounded-lg border-warning/20 bg-warning/5">
                        <div className="space-y-1">
                            <div className="font-medium flex items-center gap-2 text-warning"><Upload className="h-4 w-4" /> Restaurar Backup</div>
                            <p className="text-sm text-muted-foreground">Substitua os dados atuais por um backup.</p>
                        </div>
                        <RestoreBackupSimple />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function RestoreBackupSimple() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    return (
        <Button variant="outline" className="border-warning text-warning hover:bg-warning/10" onClick={async () => {
            if (!confirm("CUIDADO: Isso apagará todos os dados atuais! Confirmar?")) return;
            setLoading(true);
            try {
                const res = await importBackup();
                if (res.success) {
                    toast({ title: "Restaurado!", description: "Recarregando..." });
                    setTimeout(() => window.location.reload(), 1000);
                }
            } catch (e: unknown) { toast({ variant: "destructive", title: "Erro" }); }
            setLoading(false);
        }} disabled={loading}>
            {loading ? '...' : 'Importar'}
        </Button>
    )
}
