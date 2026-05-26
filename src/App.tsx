/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ArrowRight, LayoutGrid, ShieldCheck, FileText, Lock } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Mail } from './pages/Mail';
import { Drive } from './pages/Drive';
import { Databases } from './pages/Databases';
import { Forms } from './pages/Forms';
import { Slides } from './pages/Slides';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <Login />;
  return <>{children}</>;
}

function Login() {
  const { signIn } = useAuth();
  const year = 2026;

  return (
    <div className="flex bg-background flex-col min-h-screen text-foreground">
      <header className="border-b border-border/80 bg-surface/50 backdrop-blur supports-[backdrop-filter]:bg-surface/30 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-3">
            <div className="inline-flex items-center justify-center p-2 bg-surface rounded-sm border border-border/70">
              <LayoutGrid size={20} className="text-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Stremini Workspace</h1>
              <p className="text-[10px] tracking-[0.25em] uppercase text-muted">Universal Workspace Suite</p>
            </div>
          </div>
          <button
            onClick={signIn}
            className="bg-foreground hover:bg-foreground-hover text-background px-4 py-2 rounded-sm font-semibold transition-all shadow active:scale-[0.98]"
          >
            Sign in with Google
          </button>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
          <p className="text-xs tracking-[0.24em] uppercase text-muted mb-5">Stremini Workspace 2.0 · {year}</p>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight max-w-4xl mx-auto mb-5">
            Automate the entire Google Workspace with elite AI workflows.
          </h2>
          <p className="text-base md:text-lg text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
            Transform docs to slides, sheets to apps, and repetitive operations into secure, deterministic automations built for teams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={signIn}
              className="bg-foreground hover:bg-foreground-hover text-background w-full sm:w-auto py-3 px-6 rounded-sm font-semibold transition-all shadow-lg active:scale-[0.98] inline-flex items-center justify-center gap-2"
            >
              Start Automating <ArrowRight size={16} />
            </button>
            <a
              href="#privacy-policy"
              className="w-full sm:w-auto py-3 px-6 rounded-sm border border-border/80 hover:bg-surface transition-colors"
            >
              Read Privacy Policy
            </a>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-14 grid md:grid-cols-3 gap-4">
          {[
            { icon: FileText, title: 'Slide Builder', text: 'Convert technical documents into presentation-ready decks while preserving templates.' },
            { icon: LayoutGrid, title: 'Form Automator', text: 'Generate branching forms and workflows from unstructured requirements.' },
            { icon: Lock, title: 'Intelligent Drive Sync', text: 'Apply secure tagging and file permission automation across shared drives.' },
          ].map((feature) => (
            <article key={feature.title} className="border border-border/80 bg-surface p-5 rounded-sm">
              <feature.icon size={18} className="mb-3" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{feature.text}</p>
            </article>
          ))}
        </section>

        <section id="privacy-policy" className="border-y border-border/80 bg-surface/40">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="inline-flex items-center gap-2 mb-4 text-sm text-muted">
              <ShieldCheck size={16} /> Legal & Privacy
            </div>
            <h3 className="text-2xl font-semibold mb-4">Privacy Policy (Effective January 1, 2026)</h3>
            <div className="space-y-3 text-sm text-muted leading-relaxed max-w-4xl">
              <p>
                Stremini Workspace processes Google Workspace data only to provide requested automation features. We limit access to required scopes,
                retain data for the minimum operational period, and use security controls to protect data in transit and at rest.
              </p>
              <p>
                We do not sell personal information. Workspace administrators and end users can request access, correction, or deletion of account-linked
                data. For legal requests, privacy inquiries, or incident reporting, contact: privacy@stremini.ai.
              </p>
              <p>
                By using the platform, you agree to our Terms of Service, acceptable use requirements, and organization-level compliance responsibilities.
                Review this policy periodically because legal and product requirements may evolve.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/80">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <p className="text-sm text-muted">© {year} Stremini Workspace. All rights reserved.</p>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <a href="#privacy-policy" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Security</a>
            <a href="mailto:privacy@stremini.ai" className="hover:underline">Contact Legal</a>
          </nav>
        </div>
      </footer>
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
