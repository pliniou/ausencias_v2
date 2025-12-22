import { cn } from '@/lib/utils';
import { ApprovalStatus } from '@/lib/types';

const statusLabels: Record<ApprovalStatus, string> = {
    PENDING: 'Pendente',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    CANCELLED: 'Cancelado',
};

const statusStyles: Record<ApprovalStatus, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    APPROVED: 'bg-green-500/10 text-green-600 border-green-500/20',
    REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20',
    CANCELLED: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
    return (
        <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
            statusStyles[status] || statusStyles.PENDING
        )}>
            <span className={cn(
                'w-1.5 h-1.5 rounded-full mr-1.5',
                status === 'PENDING' && 'bg-yellow-500',
                status === 'APPROVED' && 'bg-green-500',
                status === 'REJECTED' && 'bg-red-500',
                status === 'CANCELLED' && 'bg-gray-500'
            )} />
            {statusLabels[status] || status}
        </span>
    );
}
