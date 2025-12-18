/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'ocean' | 'forest';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'app-theme';
const validThemes: Theme[] = ['dark', 'light', 'ocean', 'forest'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem(THEME_KEY);
        // Migrate from removed themes to light
        if (savedTheme === 'sepia' || savedTheme === 'colorful' || savedTheme === 'sunset' || savedTheme === 'purple') {
            return 'light';
        }
        return validThemes.includes(savedTheme as Theme) ? (savedTheme as Theme) : 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        // Remove all theme classes
        validThemes.forEach(t => root.classList.remove(t));
        // Also remove old themes
        root.classList.remove('sepia', 'colorful');
        // Add current theme
        root.classList.add(theme);
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    const changeTheme = (newTheme: Theme) => {
        if (validThemes.includes(newTheme)) {
            setTheme(newTheme);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export { validThemes };
export type { Theme };
