/**
 * Color Palette Utility
 * Provides a curated set of modern colors for employee assignments
 * Auto-suggests unique colors based on already-used colors
 */

// Modern flat design color palette - visually distinct, accessible colors
export const EMPLOYEE_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#A855F7', // Purple
    '#22C55E', // Green
    '#0EA5E9', // Sky
    '#FB7185', // Rose
    '#FBBF24', // Yellow
    '#4ADE80', // Light Green
    '#38BDF8', // Light Blue
    '#C084FC', // Light Purple
    '#FB923C', // Light Orange
];

/**
 * Get a suggested color that hasn't been used yet
 * @param usedColors - Array of colors already in use
 * @returns A suggested color hex code
 */
export function getSuggestedColor(usedColors: (string | undefined)[]): string {
    const normalizedUsed = usedColors
        .filter((c): c is string => !!c)
        .map(c => c.toUpperCase());

    // Find first unused color from palette
    for (const color of EMPLOYEE_COLORS) {
        if (!normalizedUsed.includes(color.toUpperCase())) {
            return color;
        }
    }

    // If all colors used, generate a random one
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

/**
 * Get all used colors from employees
 */
export function getUsedColors(employees: { color?: string }[]): string[] {
    return employees
        .map(e => e.color)
        .filter((c): c is string => !!c);
}
