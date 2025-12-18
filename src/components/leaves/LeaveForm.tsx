import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addMonths } from 'date-fns';
import { CalendarIcon, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useData } from '@/context/DataContext';
import { leaveTypeLabels, leaveTypeDescriptions } from '@/lib/types';
import { leaveTypes } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const leaveSchema = z.object({
    employeeId: z.string().min(1, 'Selecione um colaborador'),
    type: z.string().min(1, 'Selecione o tipo de afastamento'),
    startDate: z.date({ required_error: 'Data de início é obrigatória' }),
    endDate: z.date({ required_error: 'Data de fim é obrigatória' }),
    acquisitivePeriodStart: z.date().optional(),
    acquisitivePeriodEnd: z.date().optional(),
    notes: z.string().optional(),
}).refine(data => data.endDate >= data.startDate, {
    message: 'Data de fim deve ser igual ou posterior à data de início',
    path: ['endDate'],
}).refine(data => {
    if (data.type === 'FERIAS') {
        return !!data.acquisitivePeriodStart && !!data.acquisitivePeriodEnd;
    }
    return true;
}, {
    message: 'Período Aquisitivo é obrigatório para Férias',
    path: ['acquisitivePeriodStart'],
}).refine(data => {
    if (data.type === 'FERIAS' && data.acquisitivePeriodEnd && data.startDate) {
        // Concessive period limit: Acquisitive End + 11 months (to warn/block about "dobra" risk)
        const limit = addMonths(data.acquisitivePeriodEnd, 11);
        return data.startDate <= limit;
    }
    return true;
}, {
    message: 'Início das férias excede o limite do período concessivo (Fim Aquisitivo + 11 meses).',
    path: ['startDate'],
});

export function LeaveForm({ onSuccess }: { onSuccess?: () => void }) {
    const { employees, addLeave, validateVacationRule } = useData();
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [acquisitiveStart, setAcquisitiveStart] = useState<Date | undefined>();
    const [acquisitiveEnd, setAcquisitiveEnd] = useState<Date | undefined>();
    const [validationError, setValidationError] = useState<string | null>(null);

    const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<z.infer<typeof leaveSchema>>({
        resolver: zodResolver(leaveSchema),
    });

    const selectedType = watch('type');

    useEffect(() => {
        if (selectedType !== 'FERIAS') {
            setAcquisitiveStart(undefined);
            setAcquisitiveEnd(undefined);
            setValidationError(null);
        }
    }, [selectedType]);

    // Calcular data limite de concessão (início do aquisitivo + 1 ano + 11 meses)
    // Simplificação: Fim do aquisitivo + 11 meses (aprox) para limite legal de gozo
    const concessiveLimit = acquisitiveEnd ? addMonths(acquisitiveEnd, 11) : null;

    const calculateDays = () => {
        if (!startDate || !endDate) return 0;
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const onSubmit = (data: z.infer<typeof leaveSchema>) => {
        setValidationError(null);
        const employee = employees.find(e => e.id === data.employeeId);
        if (!employee) return;

        const daysOff = calculateDays();

        // Vacation Logic Validation
        if (data.type === 'FERIAS') {
            const validation = validateVacationRule(
                data.employeeId,
                format(data.startDate, 'yyyy-MM-dd'),
                daysOff,
                data.acquisitivePeriodStart ? format(data.acquisitivePeriodStart, 'yyyy-MM-dd') : '',
                data.acquisitivePeriodEnd ? format(data.acquisitivePeriodEnd, 'yyyy-MM-dd') : ''
            );

            if (!validation.valid) {
                setValidationError(validation.message || null);
                return;
            }
        }

        addLeave({
            employeeId: data.employeeId,
            employeeName: employee.name,
            employeeRole: employee.role,
            type: data.type,
            startDate: format(data.startDate, 'yyyy-MM-dd'),
            endDate: format(data.endDate, 'yyyy-MM-dd'),
            acquisitivePeriodStart: data.acquisitivePeriodStart ? format(data.acquisitivePeriodStart, 'yyyy-MM-dd') : undefined,
            acquisitivePeriodEnd: data.acquisitivePeriodEnd ? format(data.acquisitivePeriodEnd, 'yyyy-MM-dd') : undefined,
            daysOff,
            workDaysOff: Math.round(daysOff * 0.7),
            efficiency: Math.round((Math.round(daysOff * 0.7) / daysOff) * 100),
            notes: data.notes,
        });

        toast.success('Afastamento registrado!', {
            description: `${employee.name} - ${leaveTypeLabels[data.type as keyof typeof leaveTypeLabels]}`,
        });

        reset();
        setStartDate(undefined);
        setEndDate(undefined);
        setAcquisitiveStart(undefined);
        setAcquisitiveEnd(undefined);
        onSuccess?.();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="employeeId">Colaborador *</Label>
                    <Select onValueChange={(value) => setValue('employeeId', value)}>
                        <SelectTrigger className={cn(errors.employeeId && 'border-destructive')}>
                            <SelectValue placeholder="Selecione o colaborador" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.filter(e => e.status === 'ATIVO').map((employee) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                    {employee.name} - {employee.role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.employeeId && (
                        <p className="text-sm text-destructive">{errors.employeeId.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Afastamento *</Label>
                    <Select onValueChange={(value) => setValue('type', value)}>
                        <SelectTrigger className={cn(errors.type && 'border-destructive')}>
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            {leaveTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    <div className="flex flex-col items-start text-left">
                                        <span>{leaveTypeLabels[type as keyof typeof leaveTypeLabels]}</span>
                                        {leaveTypeDescriptions[type as keyof typeof leaveTypeDescriptions] && (
                                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                                                {leaveTypeDescriptions[type as keyof typeof leaveTypeDescriptions]}
                                            </span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.type && (
                        <p className="text-sm text-destructive">{errors.type.message}</p>
                    )}
                </div>

                {selectedType === 'FERIAS' && (
                    <>
                        <div className="col-span-full bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
                            <h4 className="flex items-center gap-2 font-semibold text-sm text-primary">
                                <Info className="h-4 w-4" />
                                Dados do Período Aquisitivo
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Início Aquisitivo *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !acquisitiveStart && 'text-muted-foreground')}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {acquisitiveStart ? format(acquisitiveStart, 'dd/MM/yyyy') : 'Início'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={acquisitiveStart}
                                                onSelect={(date) => {
                                                    setAcquisitiveStart(date);
                                                    setValue('acquisitivePeriodStart', date);
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>Fim Aquisitivo *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !acquisitiveEnd && 'text-muted-foreground')}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {acquisitiveEnd ? format(acquisitiveEnd, 'dd/MM/yyyy') : 'Fim'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={acquisitiveEnd}
                                                onSelect={(date) => {
                                                    setAcquisitiveEnd(date);
                                                    setValue('acquisitivePeriodEnd', date);
                                                }}
                                                defaultMonth={acquisitiveStart || undefined}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            {concessiveLimit && (
                                <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded">
                                    Limite para concessão (aprox.): <span className="font-bold text-destructive">{format(concessiveLimit, 'dd/MM/yyyy')}</span>
                                </div>
                            )}
                            {errors.acquisitivePeriodStart && (
                                <p className="text-sm text-destructive font-medium">{errors.acquisitivePeriodStart.message}</p>
                            )}
                        </div>
                    </>
                )}

                <div className="space-y-2">
                    <Label>Data de Início *</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !startDate && 'text-muted-foreground',
                                    errors.startDate && 'border-destructive'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, 'dd/MM/yyyy') : 'Selecione a data'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={(date) => {
                                    setStartDate(date);
                                    if (date) setValue('startDate', date);
                                }}
                                initialFocus
                                className="pointer-events-auto"
                            />
                        </PopoverContent>
                    </Popover>
                    {errors.startDate && (
                        <p className="text-sm text-destructive">{errors.startDate.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Data de Fim *</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !endDate && 'text-muted-foreground',
                                    errors.endDate && 'border-destructive'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, 'dd/MM/yyyy') : 'Selecione a data'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={(date) => {
                                    setEndDate(date);
                                    if (date) setValue('endDate', date);
                                }}
                                disabled={(date) => startDate ? date < startDate : false}
                                defaultMonth={startDate || undefined}
                                initialFocus
                                className="pointer-events-auto"
                            />
                        </PopoverContent>
                    </Popover>
                    {errors.endDate && (
                        <p className="text-sm text-destructive">{errors.endDate.message}</p>
                    )}
                </div>
            </div>

            {validationError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro de Validação (CLT)</AlertTitle>
                    <AlertDescription>{validationError}</AlertDescription>
                </Alert>
            )}

            {startDate && endDate && (
                <div className="bg-primary/10 rounded-xl p-4 transition-all">
                    <p className="text-sm font-medium text-foreground">
                        Total de dias: <span className="text-primary font-bold">{calculateDays()} dias</span>
                    </p>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                    id="notes"
                    placeholder="Informações adicionais sobre o afastamento..."
                    {...register('notes')}
                    rows={3}
                />
            </div>

            <Button type="submit" className="w-full">
                Registrar Afastamento
            </Button>
        </form>
    );
}
