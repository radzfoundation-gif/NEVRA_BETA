
export type DateGroup = 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Previous 30 Days' | 'Older';

export interface Session {
    id: string;
    title: string;
    created_at: string;
    updated_at?: string;
    mode?: 'builder' | 'tutor';
    [key: string]: any;
}

export const groupSessionsByDate = (sessions: Session[]): Record<DateGroup, Session[]> => {
    const groups: Record<DateGroup, Session[]> = {
        'Today': [],
        'Yesterday': [],
        'Previous 7 Days': [],
        'Previous 30 Days': [],
        'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    sessions.forEach(session => {
        // Robust date parsing
        let sessionDate: Date;
        try {
            const dateStr = session.updated_at || session.created_at;
            if (!dateStr) {
                // If no date, treat as oldest
                groups['Older'].push(session);
                return;
            }

            sessionDate = new Date(dateStr);
            if (isNaN(sessionDate.getTime())) {
                // Invalid date, treat as oldest
                groups['Older'].push(session);
                return;
            }
        } catch (e) {
            groups['Older'].push(session);
            return;
        }

        // Normalize date to start of day for comparison
        const compareDate = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

        if (compareDate.getTime() === today.getTime()) {
            groups['Today'].push(session);
        } else if (compareDate.getTime() === yesterday.getTime()) {
            groups['Yesterday'].push(session);
        } else if (compareDate > last7Days) {
            groups['Previous 7 Days'].push(session);
        } else if (compareDate > last30Days) {
            groups['Previous 30 Days'].push(session);
        } else {
            groups['Older'].push(session);
        }
    });

    return groups;
};
