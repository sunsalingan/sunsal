import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// import Rescue from './Rescue.jsx' 
import './index.css'

window.onerror = function (message, source, lineno, colno, error) {
    console.error("Global Error Caught:", message, source, lineno, error);
    document.body.innerHTML += `<div style="color:red; padding:20px;"><h1>Critical Error</h1><p>${message}</p></div>`;
};

console.log("Main entry point executing...");

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
