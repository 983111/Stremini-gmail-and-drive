/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Mail } from './pages/Mail';
import { Drive } from './pages/Drive';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <Login />;
  return <>{children}</>;
}

function Login() {
  const { signIn } = useAuth();
  return (
    <div className="flex bg-background flex-col items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center p-3 bg-surface rounded-sm mb-6">
           <LayoutGrid size={32} className="text-foreground" />
        </div>
        <h1 className="text-3xl md:text-5xl font-semibold mb-2 text-foreground tracking-tight">Stremini</h1>
        <p className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-muted mb-12">Universal Workspace Suite</p>
        <button
          onClick={signIn}
          className="bg-foreground hover:bg-foreground-hover text-background w-full py-4 px-6 rounded-sm font-semibold transition-all shadow-lg active:scale-[0.98]"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="docs/*" element={<Documents />} />
            <Route path="mail/*" element={<Mail />} />
            <Route path="drive/*" element={<Drive />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

