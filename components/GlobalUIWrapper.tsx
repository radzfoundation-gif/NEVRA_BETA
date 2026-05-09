import React from 'react';
import { useUI } from './UIContext';
import SettingsModal from './settings/SettingsModal';
import ShortcutBrowser from './ShortcutBrowser';
import { useTokenLimit } from '@/hooks/useTokenLimit';

const GlobalUIWrapper: React.FC = () => {
    const { 
        isSettingsOpen, setSettingsOpen, 
        isShortcutBrowserOpen, setShortcutBrowserOpen 
    } = useUI();
    const { tokensUsed, isSubscribed } = useTokenLimit();

    return (
        <>
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setSettingsOpen(false)}
                isSubscribed={isSubscribed || false}
                tokensUsed={tokensUsed}
            />
            <ShortcutBrowser
                isOpen={isShortcutBrowserOpen}
                onClose={() => setShortcutBrowserOpen(false)}
            />
        </>
    );
};

export default GlobalUIWrapper;
