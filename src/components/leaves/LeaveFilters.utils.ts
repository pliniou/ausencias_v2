import { DateRange } from 'react-day-picker';

export interface FilterState {
    search: string;
    type: string;
    status: string;
    dateRange: DateRange | undefined;
}

export const initialFilters: FilterState = {
    search: '',
    type: 'all',
    status: 'all',
    dateRange: undefined,
};
