/**
 * React Entry Point
 *
 * Renders the app into the DOM with:
 *   - BrowserRouter for client-side routing
 *   - AuthProvider wrapping the entire tree so every component can
 *     access the current user / login / logout actions via context
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
