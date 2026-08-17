import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'fluentnova-theme';
const VALID_THEMES = ['basic', 'dark', 'solar'];
const DEFAULT_THEME = 'solar';

const ThemeContext = createContext(null);

/**
 * Applies `data-theme` attribute on <html> to activate the correct
 * CSS custom-property ruleset defined in /styles/themes/.
 */
const applyThemeToDOM = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
};

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        try {
            const stored = localStorage.getItem(THEME_KEY);
            if (stored && VALID_THEMES.includes(stored)) return stored;
        } catch { /* SSR or private browsing */ }
        return DEFAULT_THEME;
    });

    // Sync DOM attribute whenever theme changes
    useEffect(() => {
        applyThemeToDOM(theme);
    }, [theme]);

    const setTheme = useCallback((newTheme) => {
        if (!VALID_THEMES.includes(newTheme)) return;
        setThemeState(newTheme);
        try {
            localStorage.setItem(THEME_KEY, newTheme);
        } catch { /* quota exceeded or private mode */ }
    }, []);

    // Cycle through themes: basic → dark → solar → basic
    const toggleTheme = useCallback(() => {
        setThemeState((prev) => {
            const idx = VALID_THEMES.indexOf(prev);
            const next = VALID_THEMES[(idx + 1) % VALID_THEMES.length];
            try { localStorage.setItem(THEME_KEY, next); } catch { }
            return next;
        });
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themes: VALID_THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
    return ctx;
};

export default ThemeContext;
