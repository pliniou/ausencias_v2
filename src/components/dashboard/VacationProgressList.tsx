import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Employee } from '@/lib/types';

function VacationProgressCard({ employee }: { employee: Employee }) {
    const balance = employee.vacationBalance || 0;
    const name = employee.name;
    const role = employee.role;
    const usedDays = 30 - balance;
    const percentage = (usedDays / 30) * 100;

    return (
        <div className="p-3 bg-card rounded-lg border border-border hover:shadow-sm hover:border-primary/20 transition-all duration-200">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-foreground leading-tight">{name}</h4>
                        <p className="text-xs text-muted-foreground">{role}</p>
                    </div>
                </div>
                <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md">
                    {balance}d
                </span>
            </div>
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Usados: {usedDays}d</span>
                    <span className="text-foreground font-medium">{percentage.toFixed(0)}%</span>
                </div>
                <Progress value={percentage} className="h-1.5" />
            </div>
        </div>
    );
}

export function VacationProgressList({ employees }: { employees: Employee[] }) {
    const activeEmployees = employees.filter(e => e.status === 'ATIVO');

    return (
        <Card className="border">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                    <span>Saldo de Férias</span>
                    <Link to="/admin" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                        Ver todos <ArrowRight className="h-3 w-3" />
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[400px] overflow-y-auto pt-0">
                {activeEmployees.slice(0, 5).map((employee) => (
                    <VacationProgressCard key={employee.id} employee={employee} />
                ))}
            </CardContent>
        </Card>
    );
}
