import { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';

export interface Settings {
    theme: 'light' | 'dark' | 'system';
    showTokenUsage: boolean;
    soundNotification: boolean;
    lineWrapping: boolean;
    autoSave: boolean;
    compactMode: boolean;
}

const DEFAULT_SETTINGS: Settings = {
    theme: 'system',
    showTokenUsage: false,
    soundNotification: true,
    lineWrapping: true,
    autoSave: true,
    compactMode: false,
};

const STORAGE_KEY = 'noir-settings';

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
}

const SettingsContext = createContext<{
    settings: Settings;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    isLoaded: boolean;
    effectiveTheme: 'light' | 'dark';
} | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings({ ...DEFAULT_SETTINGS, ...parsed });
            } catch (e) {
                setSettings(DEFAULT_SETTINGS);
            }
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }
    }, [settings, isLoaded]);

    useEffect(() => {
        if (!isLoaded) return;
        
        const root = document.documentElement;
        const effectiveTheme = settings.theme === 'system' ? getSystemTheme() : settings.theme;
        
        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [settings.theme, isLoaded]);

    useEffect(() => {
        if (!isLoaded || settings.theme !== 'system') return;
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            const root = document.documentElement;
            if (e.matches) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [settings.theme, isLoaded]);

    const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const effectiveTheme = useMemo(() => {
        return settings.theme === 'system' ? getSystemTheme() : settings.theme;
    }, [settings.theme]);

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, isLoaded, effectiveTheme }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}

export default useSettings;
