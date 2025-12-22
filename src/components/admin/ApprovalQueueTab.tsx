import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmActionDialog } from '@/components/ui/ConfirmActionDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Calendar, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ApprovalQueueTab() {
    const { getPendingLeaves, approveLeave, rejectLeave } = useData();
    const { user } = useAuth();
    const pendingLeaves = getPendingLeaves();

    const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [note, setNote] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleAction = (id: string, type: 'approve' | 'reject') => {
        setSelectedLeaveId(id);
        setActionType(type);
        setNote('');
        setIsDialogOpen(true);
    };

    const confirmAction = async () => {
        if (!selectedLeaveId || !actionType || !user) return;

        const info = {
            decidedBy: user.username,
            decisionNote: note,
        };

        try {
            if (actionType === 'approve') {
                await approveLeave(selectedLeaveId, info);
                toast.success('Solicitação aprovada com sucesso!');
            } else {
                await rejectLeave(selectedLeaveId, info);
                toast.success('Solicitação rejeitada com sucesso!');
            }
        } catch (error) {
            console.error('Error processing leave:', error);
            toast.error('Erro ao processar solicitação.');
        } finally {
            setIsDialogOpen(false);
            setSelectedLeaveId(null);
            setActionType(null);
        }
    };

    if (pendingLeaves.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center border rounded-lg bg-muted/10 border-dashed min-h-[300px]">
                <div className="p-3 rounded-full bg-primary/10">
                    <Check className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-medium text-foreground">Tudo em dia!</h3>
                    <p className="text-muted-foreground">Não há solicitações pendentes de aprovação.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingLeaves.map((leave) => (
                    <Card key={leave.id} className="overflow-hidden transition-all hover:shadow-md border-l-4 border-l-warning">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground mb-1">{leave.employeeRole}</div>
                                    <CardTitle className="text-lg">{leave.employeeName}</CardTitle>
                                </div>
                                <Badge variant="outline" className="bg-warning/20 text-warning-foreground border-warning/50">
                                    Pendente
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {format(new Date(leave.startDate), 'dd/MM/yyyy')} - {format(new Date(leave.endDate), 'dd/MM/yyyy')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    <span>{leave.daysOff} dias ({leave.workDaysOff} úteis)</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="w-4 h-4" />
                                    <span className="capitalize">{leave.type.toLowerCase()}</span>
                                </div>
                                {leave.createdAt && (
                                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                        Solicitado em: {format(new Date(leave.createdAt), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    className="flex-1 bg-success hover:bg-success/90 text-white"
                                    size="sm"
                                    onClick={() => handleAction(leave.id, 'approve')}
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Aprovar
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    size="sm"
                                    onClick={() => handleAction(leave.id, 'reject')}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Rejeitar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <ConfirmActionDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onConfirm={confirmAction}
                title={actionType === 'approve' ? 'Aprovar Solicitação' : 'Rejeitar Solicitação'}
                variant={actionType === 'reject' ? 'danger' : 'default'}
                confirmLabel={actionType === 'approve' ? 'Aprovar' : 'Rejeitar'}
                description={
                    <div className="space-y-4 py-2">
                        <p>
                            {actionType === 'approve'
                                ? 'Tem certeza que deseja aprovar esta solicitação? Ela será adicionada ao calendário oficial.'
                                : 'Tem certeza que deseja rejeitar esta solicitação? O colaborador será notificado.'}
                        </p>
                        <div className="space-y-2">
                            <label htmlFor="note" className="text-sm font-medium">
                                Observação (Opcional)
                            </label>
                            <Textarea
                                id="note"
                                placeholder={actionType === 'approve' ? "Ex: Aprovado conforme planejado" : "Ex: Período incompatível com demandas do setor"}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>
                }
            />
        </div>
    );
}
