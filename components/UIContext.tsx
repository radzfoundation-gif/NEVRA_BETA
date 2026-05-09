import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    isSidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    isSettingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;
    isShortcutBrowserOpen: boolean;
    setShortcutBrowserOpen: (open: boolean) => void;
    isSubscriptionPopupOpen: boolean;
    setSubscriptionPopupOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isShortcutBrowserOpen, setShortcutBrowserOpen] = useState(false);
    const [isSubscriptionPopupOpen, setSubscriptionPopupOpen] = useState(false);

    return (
        <UIContext.Provider value={{
            isSidebarOpen, setSidebarOpen,
            isSettingsOpen, setSettingsOpen,
            isShortcutBrowserOpen, setShortcutBrowserOpen,
            isSubscriptionPopupOpen, setSubscriptionPopupOpen
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within a UIProvider');
    return context;
};
