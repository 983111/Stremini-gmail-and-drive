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
import { Databases } from './pages/Databases';
import { Forms } from './pages/Forms';
import { Slides } from './pages/Slides';
import { LandingPage } from './pages/LandingPage';
import { Blog } from './pages/Blog';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfConditions } from './pages/TermsOfConditions';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <LandingPage />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/blog" element={<Blog />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfConditions />} />

          {/* Protected workspace routes */}
          <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="docs/*" element={<Documents />} />
            <Route path="mail/*" element={<Mail />} />
            <Route path="drive/*" element={<Drive />} />
            <Route path="databases/*" element={<Databases />} />
            <Route path="forms/*" element={<Forms />} />
            <Route path="slides/*" element={<Slides />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

