import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock sql.js to avoid WASM loading issues in JSDOM (and mock database logic)
vi.mock('sql.js', () => ({ default: vi.fn() }));

vi.mock('@/lib/database', () => ({
    db: {
        init: vi.fn().mockResolvedValue(undefined),
        query: vi.fn().mockReturnValue([{ count: 1 }]), // Return count 1 to skip seeding logic
        run: vi.fn(),
        save: vi.fn(),
    }
}));
