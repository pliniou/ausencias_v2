import React, { useState } from 'react';
import { Calendar, User, Trash2 } from 'lucide-react';
import { LeaveBadge } from '@/components/ui/LeaveBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ApprovalStatusBadge } from '@/components/ui/ApprovalStatusBadge';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { formatDateBR } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { Leave } from '@/lib/types';
import { toast } from 'sonner';

interface LeaveCardProps {
    leave: Leave;
    onClick?: () => void;
    onDelete?: (id: string) => void;
    className?: string;
}

export function LeaveCard({ leave, onClick, onDelete, className }: LeaveCardProps) {
    const [showDelete, setShowDelete] = useState(false);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDelete(true);
    };

    const handleConfirmDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(leave.id);
            toast.success('Afastamento excluído!', {
                description: `${leave.employeeName} foi removido.`,
            });
        }
        setShowDelete(false);
    };

    return (
        <>
            <div
                onClick={onClick}
                className={cn(
                    'group bg-card rounded-xl border border-border p-4 transition-all duration-200 hover:shadow-lg hover:border-primary/30 cursor-pointer relative',
                    className
                )}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <LeaveBadge type={leave.type} />
                            {leave.approvalStatus && leave.approvalStatus !== 'APPROVED' ? (
                                <ApprovalStatusBadge status={leave.approvalStatus} />
                            ) : (
                                <StatusBadge status={leave.status as "ATIVO" | "PLANEJADO" | "ENCERRADO"} />
                            )}
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{leave.employeeName}</span>
                        </div>

                        <p className="text-sm text-muted-foreground">{leave.employeeRole}</p>
                    </div>

                    {onDelete && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={handleDeleteClick}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-lg border border-border/50">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">
                            {formatDateBR(leave.startDate)} - {formatDateBR(leave.endDate)}
                        </span>
                    </div>
                </div>

                {leave.notes && (
                    <p className="mt-3 text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                        {leave.notes}
                    </p>
                )}
            </div>

            <ConfirmDeleteDialog
                open={showDelete}
                onOpenChange={setShowDelete}
                onConfirm={handleConfirmDelete}
                title="Excluir Afastamento"
                description={`Tem certeza que deseja excluir o afastamento de ${leave.employeeName}?`}
            />
        </>
    );
}
