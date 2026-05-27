import { Link } from 'react-router-dom';
import { Scale, Mail, ArrowLeft, LayoutGrid, AlertTriangle } from 'lucide-react';

export function TermsOfConditions() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] font-sans selection:bg-[#E5E5E5] flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[#EEEEEE] bg-[#FAFAFA]/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-[#111111]">
            <div className="w-8 h-8 rounded-sm bg-[#111111] flex items-center justify-center">
              <LayoutGrid size={15} className="text-[#FAFAFA]" />
            </div>
            <span className="font-bold text-sm tracking-tight">Stremini Workspace</span>
          </Link>
          <a href="mailto:streminiai@gmail.com" className="text-xs font-bold uppercase text-indigo-700 hover:text-indigo-900 transition-colors flex items-center gap-1.5">
            <Mail size={12} />
            <span>Support</span>
          </a>
        </div>
      </header>

      {/* Main compliance content */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 md:px-8 py-12 md:py-20 space-y-12">
        <div className="space-y-4">
          <Link 
            to="/"
            className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] transition-all"
          >
            <ArrowLeft size={12} />
            <span>Back to Homepage</span>
          </Link>

          <div className="flex items-center space-x-2.5 text-[#111111] pt-2">
            <Scale size={20} className="text-neutral-700" />
            <span className="text-xs font-bold uppercase tracking-widest font-mono">WORKSPACE TERMS OF CONDITIONS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111111] leading-tight mt-1 uppercase">
            Terms of Use
          </h1>

          <div className="text-xs text-[#666666] font-mono flex items-center gap-4 border-b border-[#EEEEEE] pb-6">
            <span>Last Updated: May 27, 2026</span>
            <span>•</span>
            <span>Binding Service Standards</span>
          </div>
        </div>

        {/* Policy Body */}
        <div className="space-y-8 text-sm text-[#333333] leading-relaxed">
          
          {/* Urgent Liability Reminder */}
          <div className="p-5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle size={14} className="text-amber-800" />
              <span>CRITICAL DISCLAIMER FOR COMPLIANT WORKFLOWS</span>
            </div>
            <p className="leading-relaxed">
              **PLEASE READ THIS AGREEMENT CAREFULLY.** BY AUTHORIZING STREMINI AND INTEGRATING YOUR WORKSPACE CREDENTIALS, YOU EXPLICITLY AGREE TO COMPLY WITH AND BE BOUND BY THESE LEGAL PARAMETERS. THESE TERMS LIMIT YOUR RECOURSE AND EXCLUDE GENERAL WARRANTIES CONCERNING ACCURACY, DATA TRANSIT, AND CONTINUOUS SYSTEM UPTIME.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold uppercase text-[#111111] tracking-tight border-b border-neutral-150 pb-1">
              1. Non-Custodial Nature & User Responsibility
            </h2>
            <p>
              Stremini Workspace is a client-side visual orchestrator. By linking your Google OAuth token parameters, you authorize the application to process inputs inside your local context.
            </p>
            <p className="text-xs text-[#555555]">
              You bear full responsibility for all activities, API command requests, and document formatting updates that execute under your authenticated Google account credentials. In compliance with data safety standards, ensure your system environments are secure.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold uppercase text-[#111111] tracking-tight border-b border-neutral-150 pb-1">
              2. Absolute "As-Is" Warranty Exclusion
            </h2>
            <p className="font-semibold text-neutral-900 uppercase text-xs">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE JURISDICTIONAL LAWS:
            </p>
            <p className="bg-white border border-neutral-200 p-4 rounded text-xs leading-relaxed text-[#444444] font-mono shadow-sm">
              STREMINI DISTRIBUTES SERVICES ON AN "AS IS" AND "AS AVAILABLE" STRUCTURAL STANDARDS BASIS. WE EXPLICITLY DISCLAIM ALL WARRANTIES OF ANY CATEGORY, EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO INTELLECTUAL FITNESS FOR GOALS, ACCURACY, ABSENCE OF CORRUPTION, LACK OF BUGS, OR SECURE CONTINUITY OF API TRANSIT. YOU OPERATE THE INTELLIGENCE DASHBOARD SOLELY AT YOUR OWN RISK.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold uppercase text-[#111111] tracking-tight border-b border-neutral-150 pb-1">
              3. Limitation of Liability Shield
            </h2>
            <p>
              Under no scenarios shall the developers, partners, authors, or team members of Stremini be liable for any collateral, accidental, punitive, special, or consequential damages whatsoever (including, without limitation, direct loss of data assets, disruption of database columns, email delivery errors, spreadsheet data corruption, or business interruption scenarios) stemming from the operation inside Google APIs, even if advised ahead of time.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold uppercase text-[#111111] tracking-tight border-b border-neutral-150 pb-1">
              4. Affiliation and Patent Disclosures
            </h2>
            <p>
              Stremini Workspace behaves strictly as an independent, third-party interface.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#555555]">
              <li>We are not sponsored, aligned, or officially partnered with Google LLC or parent Alphabet Inc.</li>
              <li>"Google Workspace", "Gmail", "Google Drive", "Forms", and "Slides" are registered trademarks of Google LLC.</li>
              <li>You must comply with individual Google Terms of Service guidelines when connecting account profiles.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold uppercase text-[#111111] tracking-tight border-b border-neutral-150 pb-1">
              5. Governing Law and Arbitrage
            </h2>
            <p>
              These terms of use shall be governed and interpreted in complete alignment with local operational jurisdictions. Any formal legal contentions or disputes must be filed under binding local arbitrage parameters before pursuing courtroom proceedings.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold uppercase text-[#111111] tracking-tight border-b border-neutral-150 pb-1">
              6. Communication and Legal Queries
            </h2>
            <p>
              For legal compliance audits, contract interpretations, partnership alignments, or operational notices, reach out to our legal department at:
            </p>
            <a 
              href="mailto:streminiai@gmail.com"
              className="inline-flex items-center space-x-2 text-indigo-700 hover:text-indigo-900 text-xs font-bold uppercase tracking-wider bg-white border border-[#EEEEEE] px-4 py-2 rounded-sm transition-all"
            >
              <Mail size={12} />
              <span>streminiai@gmail.com</span>
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#EEEEEE] py-12 text-[#888888] text-xs">
        <div className="max-w-4xl w-full mx-auto px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-6 font-mono text-[11px]">
          <div>
            <p className="font-bold text-[#111111]">Stremini Legal Counsel Operations</p>
            <p>© 2026 Stremini. All rights guarded.</p>
          </div>
          <a href="mailto:streminiai@gmail.com" className="text-indigo-600 hover:text-indigo-800 transition-colors">streminiai@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}
