import React from 'react';
import { Search, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { leaveTypeLabels } from '@/lib/types';

import { FilterState } from './LeaveFilters.utils';

interface LeaveFiltersProps {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
    className?: string;
}

export function LeaveFilters({ filters, onChange, className }: LeaveFiltersProps) {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...filters, search: e.target.value });
    };

    const handleTypeChange = (value: string) => {
        onChange({ ...filters, type: value });
    };

    const handleStatusChange = (value: string) => {
        onChange({ ...filters, status: value });
    };

    const handleDateRangeChange = (range: DateRange | undefined) => {
        onChange({ ...filters, dateRange: range });
    };

    const clearFilters = () => {
        onChange({
            search: '',
            type: 'all',
            status: 'all',
            dateRange: undefined,
        });
    };

    const hasActiveFilters = filters.search || filters.type !== 'all' || filters.status !== 'all' || filters.dateRange;

    return (
        <div className={`flex flex-col gap-4 p-4 bg-muted/30 rounded-lg border border-border ${className}`}>
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Buscar</span>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Nome do funcionário..."
                            value={filters.search}
                            onChange={handleSearchChange}
                            className="pl-9 bg-background"
                        />
                    </div>
                </div>

                <div className="w-full md:w-[200px] space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Tipo</span>
                    <Select value={filters.type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os tipos</SelectItem>
                            {Object.entries(leaveTypeLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full md:w-[200px] space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    <Select value={filters.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os status</SelectItem>
                            <SelectItem value="ATIVO">Em Andamento</SelectItem>
                            <SelectItem value="PLANEJADO">Planejado</SelectItem>
                            <SelectItem value="ENCERRADO">Encerrado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full md:w-auto space-y-1">
                    <span className="text-sm font-medium text-muted-foreground mb-1 block">Período</span>
                    <DatePickerWithRange date={filters.dateRange} setDate={handleDateRangeChange} />
                </div>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearFilters}
                        className="text-muted-foreground hover:text-foreground h-10 w-10 shrink-0"
                        title="Limpar filtros"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
