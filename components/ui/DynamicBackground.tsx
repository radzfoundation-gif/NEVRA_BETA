import React from 'react';

const DynamicBackground: React.FC = () => {
    return (
        <div
            className="fixed inset-0 pointer-events-none -z-50"
            style={{ background: '#FFFFFF' }}
        />
    );
};

export default DynamicBackground;
