/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
    <div className="flex bg-white flex-col items-center justify-center min-h-screen">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-semibold mb-2 text-[#111]">Executive</h1>
        <p className="text-xs tracking-[0.2em] uppercase text-[#666] mb-8">Productivity</p>
        <button
          onClick={signIn}
          className="bg-black hover:bg-[#222] text-white w-full py-3 px-4 rounded-md font-medium transition-colors"
        >
          Continue with Google
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

