import { cn } from '@/lib/utils';

const statusLabels = {
    ATIVO: 'Ativo',
    PLANEJADO: 'Planejado',
    ENCERRADO: 'Encerrado',
};

const statusStyles = {
    ATIVO: 'bg-status-active/10 text-status-active border-status-active/20',
    PLANEJADO: 'bg-status-planned/10 text-status-planned border-status-planned/20',
    ENCERRADO: 'bg-status-ended/10 text-status-ended border-status-ended/20',
};

export function StatusBadge({ status }: { status: keyof typeof statusLabels }) {
    return (
        <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
            statusStyles[status]
        )}>
            <span className={cn(
                'w-1.5 h-1.5 rounded-full mr-1.5',
                status === 'ATIVO' && 'bg-status-active',
                status === 'PLANEJADO' && 'bg-status-planned',
                status === 'ENCERRADO' && 'bg-status-ended'
            )} />
            {statusLabels[status]}
        </span>
    );
}
