import { describe, it, expect } from 'vitest';
import { validateVacationRule } from '@/lib/businessRules';
import { getLeaveStatus, isWeekend, getCalendarDays } from '@/lib/dateUtils';
import { Leave } from '@/lib/types';
import { addDays, format, subDays } from 'date-fns';

describe('Business Logic Validation', () => {

    describe('Limits - Vacation Rules (CLT)', () => {
        const mockLeaves: Leave[] = [];
        const employeeId = 'emp1';
        const acquisitiveStart = '2024-01-01';

        it('should allow a valid 30-day vacation if no other leaves exist', () => {
            const result = validateVacationRule(mockLeaves, employeeId, 30, acquisitiveStart);
            expect(result.valid).toBe(true);
        });

        it('should reject vacation < 5 days', () => {
            const result = validateVacationRule(mockLeaves, employeeId, 4, acquisitiveStart);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('inferior a 5 dias');
        });

        it('should reject if total exceeds 30 days', () => {
            const existingLeaves: Leave[] = [{
                id: '1', employeeId, employeeName: 'Test', employeeRole: 'Dev',
                startDate: '2024-05-01', endDate: '2024-05-20', type: 'FERIAS',
                acquisitivePeriodStart: acquisitiveStart, daysOff: 20, status: 'ATIVO'
            }];

            const result = validateVacationRule(existingLeaves, employeeId, 11, acquisitiveStart);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('Limite de 30 dias excedido');
        });

        it('should allow valid 14-day rule scenario', () => {
            const existingLeaves1: Leave[] = [{
                id: '1', employeeId, employeeName: 'Test', employeeRole: 'Dev',
                startDate: '2024-05-01', endDate: '2024-05-10', type: 'FERIAS',
                acquisitivePeriodStart: acquisitiveStart, daysOff: 10, status: 'ENCERRADO'
            }];
            const result1 = validateVacationRule(existingLeaves1, employeeId, 20, acquisitiveStart);
            expect(result1.valid).toBe(true);
        });

        it('should enforce 14-day rule when reaching 30 days', () => {
            const existingLeaves2: Leave[] = [
                {
                    id: '1', employeeId, employeeName: 'Test', employeeRole: 'Dev',
                    startDate: '2024-05-01', endDate: '2024-05-10', type: 'FERIAS',
                    acquisitivePeriodStart: acquisitiveStart, daysOff: 10, status: 'ENCERRADO',
                    workDaysOff: 8, efficiency: 80 // Add missing fields to satisfy typescript if strict
                },
                {
                    id: '2', employeeId, employeeName: 'Test', employeeRole: 'Dev',
                    startDate: '2024-08-01', endDate: '2024-08-10', type: 'FERIAS',
                    acquisitivePeriodStart: acquisitiveStart, daysOff: 10, status: 'ENCERRADO',
                    workDaysOff: 8, efficiency: 80
                }
            ];
            // Trying to take the last 10 days
            const result2 = validateVacationRule(existingLeaves2, employeeId, 10, acquisitiveStart);
            expect(result2.valid).toBe(false);
            expect(result2.message).toContain('14 dias ou mais');
        });
    });

    describe('Applications - Leave Lifecycle', () => {
        it('should correctly identify STATUS', () => {
            const today = new Date();
            const pastStart = format(subDays(today, 10), 'yyyy-MM-dd');
            const pastEnd = format(subDays(today, 5), 'yyyy-MM-dd');

            // ENCERRADO
            expect(getLeaveStatus(pastStart, pastEnd)).toBe('ENCERRADO');

            const futureStart = format(addDays(today, 5), 'yyyy-MM-dd');
            const futureEnd = format(addDays(today, 10), 'yyyy-MM-dd');

            // PLANEJADO
            expect(getLeaveStatus(futureStart, futureEnd)).toBe('PLANEJADO');

            const activeStart = format(subDays(today, 2), 'yyyy-MM-dd');
            const activeEnd = format(addDays(today, 2), 'yyyy-MM-dd');

            // ATIVO
            expect(getLeaveStatus(activeStart, activeEnd)).toBe('ATIVO');
        });
    });

    describe('Calendars - Date Utils', () => {
        it('should identify weekends correctly', () => {
            // Saturday (June 1st 2024 is Saturday)
            // Use T12:00:00 to avoid timezone rolling back to previous day
            expect(isWeekend(new Date('2024-06-01T12:00:00'))).toBe(true);
            // Sunday
            expect(isWeekend(new Date('2024-06-02T12:00:00'))).toBe(true);
            // Monday
            expect(isWeekend(new Date('2024-06-03T12:00:00'))).toBe(false);
        });

        it('should generate correct calendar grid size', () => {
            // June 2024 starts on Saturday (6 days padding if week starts on Sunday)
            // June has 30 days.
            // 01/06/2024 is Saturday. getDay() 6.
            // If week starts on Sunday (0), prefix is 6 nulls.
            const days = getCalendarDays(new Date('2024-06-01'));
            expect(days.length).toBeGreaterThanOrEqual(30);

            // Check first real day
            const firstDay = days.find(d => d !== null);
            expect(firstDay).toBeDefined();
            expect(firstDay?.getDate()).toBe(1);
        });
    });

});
