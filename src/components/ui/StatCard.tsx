import { cn } from '@/lib/utils';

const variantStyles = {
    default: 'bg-card',
    primary: 'bg-gradient-to-br from-primary to-primary/80',
    success: 'bg-gradient-to-br from-status-active to-status-active/80',
    warning: 'bg-gradient-to-br from-leave-court to-leave-court/80',
    danger: 'bg-gradient-to-br from-destructive to-destructive/80',
};

const textStyles = {
    default: 'text-foreground',
    primary: 'text-white drop-shadow-md',
    success: 'text-white drop-shadow-md',
    warning: 'text-white drop-shadow-md',
    danger: 'text-white drop-shadow-md',
};

export interface StatCardProps {
    title: React.ReactNode;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    variant?: "default" | "primary" | "success" | "warning" | "danger";
    className?: string;
}

export function StatCard({ title, value, subtitle, icon, variant = 'default', className }: StatCardProps) {
    const isColored = variant !== 'default';

    return (
        <div className={cn('stat-card', variantStyles[variant], className)}>
            <div className="flex items-start justify-between">
                <div>
                    <p className={cn('text-sm font-medium', textStyles[variant], isColored && 'opacity-95')}>{title}</p>
                    <p className={cn('mt-2 text-3xl font-display font-bold', textStyles[variant])}>{value}</p>
                    {subtitle && (
                        <p className={cn('mt-1 text-sm', textStyles[variant], isColored && 'opacity-90')}>{subtitle}</p>
                    )}
                </div>
                <div className={cn('rounded-xl p-3', variant === 'default' ? 'bg-primary/10' : 'bg-white/20 backdrop-blur-sm')}>
                    <div className={cn(variant === 'default' ? 'text-primary' : 'text-white drop-shadow-lg')}>
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
}
