import React from 'react';

// A completely isolated component with NO external dependencies other than React.
// If this fails to render, the issue is in vite/main.jsx/index.html.
export default function Rescue() {
    return (
        <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: 'green', fontSize: '3rem' }}>RESCUE MODE ACTIVE</h1>
            <p style={{ fontSize: '1.5rem' }}>
                If you see this screen, React is working correctly.
            </p>
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '10px' }}>
                <p>Status: <strong>Safe</strong></p>
                <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    Reload Application
                </button>
            </div>
        </div>
    );
}
