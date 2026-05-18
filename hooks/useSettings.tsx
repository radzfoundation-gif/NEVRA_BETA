import { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import { useUser } from '../lib/authContext';
import { getUserPreferences, updateUserPreferences } from '../lib/database';

export interface Settings {
    theme: 'light' | 'dark' | 'system';
    defaultAIMode: 'fast' | 'reasoning' | 'creative' | 'coding' | 'academic' | 'document';
    defaultTone: 'professional' | 'friendly' | 'direct' | 'creative' | 'funny' | 'critical' | 'tutor' | 'ceo';
    defaultResponseLength: 'short' | 'balanced' | 'detailed';
    planningBeforeAnswer: boolean;
    showTokenUsage: boolean;
    soundNotification: boolean;
    lineWrapping: boolean;
    autoSave: boolean;
    compactMode: boolean;
}

const DEFAULT_SETTINGS: Settings = {
    theme: 'system',
    defaultAIMode: 'fast',
    defaultTone: 'professional',
    defaultResponseLength: 'balanced',
    planningBeforeAnswer: true,
    showTokenUsage: false,
    soundNotification: true,
    lineWrapping: true,
    autoSave: true,
    compactMode: false,
};

const STORAGE_KEY = 'useglass-settings';

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
    isSyncing: boolean;
} | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { user, isSignedIn } = useUser();
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Load initial settings
    useEffect(() => {
        const loadSettings = async () => {
            let initialSettings = DEFAULT_SETTINGS;
            
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    initialSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
                } catch (e) {}
            }

            if (isSignedIn && user?.id) {
                setIsSyncing(true);
                try {
                    const cloudPrefs = await getUserPreferences(user.id);
                    if (cloudPrefs && cloudPrefs.preferences) {
                        initialSettings = { 
                            ...initialSettings, 
                            ...cloudPrefs.preferences,
                            theme: (cloudPrefs.theme as Settings['theme']) || initialSettings.theme 
                        };
                    }
                } catch (e) {} finally {
                    setIsSyncing(false);
                }
            }
            setSettings(initialSettings);
            setIsLoaded(true);
        };
        loadSettings();
    }, [isSignedIn, user?.id]);

    // Save settings
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

        if (isSignedIn && user?.id) {
            const timer = setTimeout(async () => {
                try {
                    await updateUserPreferences(user.id, {
                        theme: settings.theme,
                        preferences: settings
                    });
                } catch (e) {}
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [settings, isLoaded, isSignedIn, user?.id]);

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
        <SettingsContext.Provider value={{ settings, updateSetting, isLoaded, effectiveTheme, isSyncing }}>
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
