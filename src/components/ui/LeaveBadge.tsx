import { leaveTypeLabels, leaveTypeColors } from '@/lib/types';
import { cn } from '@/lib/utils';

export function LeaveBadge({ type, size = 'md', className }: { type: keyof typeof leaveTypeLabels, size?: 'sm' | 'md', className?: string }) {
    return (
        <span className={cn(
            'leave-badge',
            leaveTypeColors[type],
            size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1',
            className
        )}>
            {leaveTypeLabels[type]}
        </span>
    );
}
