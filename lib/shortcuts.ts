import { LucideIcon, Command, Search, MessageSquare, Plus, Settings, Image, Code, Home, User, PanelLeft, Monitor } from 'lucide-react';

export interface Shortcut {
    id: string;
    keys: string[];
    description: string;
    category: 'general' | 'navigation' | 'chat' | 'editor' | 'canvas';
    icon?: LucideIcon;
}

export const SHORTCUTS: Shortcut[] = [
    // General
    {
        id: 'search',
        keys: ['Ctrl', 'K'],
        description: 'Open command palette',
        category: 'general',
        icon: Search
    },
    {
        id: 'settings',
        keys: ['Ctrl', ','],
        description: 'Open settings',
        category: 'general',
        icon: Settings
    },
    {
        id: 'theme',
        keys: ['Ctrl', 'T'],
        description: 'Toggle theme',
        category: 'general',
        icon: Monitor
    },

    // Navigation
    {
        id: 'home',
        keys: ['G', 'H'],
        description: 'Go to Home',
        category: 'navigation',
        icon: Home
    },
    {
        id: 'toggle-sidebar',
        keys: ['Ctrl', 'B'],
        description: 'Toggle sidebar',
        category: 'navigation',
        icon: PanelLeft
    },
    {
        id: 'profile',
        keys: ['G', 'P'],
        description: 'Go to Profile',
        category: 'navigation',
        icon: User
    },

    // Chat
    {
        id: 'new-chat',
        keys: ['Ctrl', 'N'],
        description: 'Start a new chat',
        category: 'chat',
        icon: Plus
    },
    {
        id: 'focus-input',
        keys: ['/'],
        description: 'Focus chat input',
        category: 'chat',
        icon: MessageSquare
    },
    {
        id: 'attach-file',
        keys: ['Ctrl', 'U'],
        description: 'Attach file',
        category: 'chat',
        icon: Image
    },

    // Editor/Canvas
    {
        id: 'format-code',
        keys: ['Alt', 'Shift', 'F'],
        description: 'Format code',
        category: 'editor',
        icon: Code
    },
    {
        id: 'run-code',
        keys: ['Ctrl', 'Enter'],
        description: 'Run code block',
        category: 'editor',
        icon: Code
    }
];

export const getShortcutsByCategory = (category: string): Shortcut[] => {
    if (category === 'all') return SHORTCUTS;
    return SHORTCUTS.filter(s => s.category === category);
};

export const searchShortcuts = (query: string): Shortcut[] => {
    const lowerQuery = query.toLowerCase();
    return SHORTCUTS.filter(s =>
        s.description.toLowerCase().includes(lowerQuery) ||
        s.category.toLowerCase().includes(lowerQuery) ||
        s.keys.some(k => k.toLowerCase().includes(lowerQuery))
    );
};
