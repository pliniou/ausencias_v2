import { describe, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/repositories/DataStore', () => ({
    dataStore: {
        init: vi.fn().mockResolvedValue(undefined),
        migrate: vi.fn().mockResolvedValue(undefined),
        getAll: vi.fn().mockResolvedValue([]),
        set: vi.fn().mockResolvedValue(undefined),
        setAll: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
    },
    STORES: {
        EMPLOYEES: 'employees',
        LEAVES: 'leaves',
        HOLIDAYS: 'holidays',
        EVENTS: 'events',
    }
}));

describe('App', () => {
    it('renders without crashing', () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );
        // Basic check - maybe check for something we know is there?
        // Since we don't know the exact content, just rendering is a good first step.
        // Or check for a known text if we knew it.
        // screen.debug();
    });
});
