import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowLeft, LayoutGrid, Clock, ShieldAlert } from 'lucide-react';

export function PrivacyPolicy() {
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
          <a href="mailto:streminiai@gmail.com" className="text-xs font-bold uppercase text-neutral-800 hover:text-black transition-colors flex items-center gap-1.5 font-sans">
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

          <div className="flex items-center space-x-2.5 text-emerald-700 pt-2">
            <ShieldCheck size={20} />
            <span className="text-xs font-bold uppercase tracking-widest font-mono">Data Security Principles</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111111] leading-tight mt-1">
            PRIVACY POLICY
          </h1>

          <div className="text-xs text-[#666666] font-mono flex items-center gap-4 border-b border-[#EEEEEE] pb-6">
            <span>Effective Date: May 27, 2026</span>
            <span>•</span>
            <span>Version: 2.5 (Pure Non-Custodial)</span>
          </div>
        </div>

        {/* Policy Body */}
        <div className="space-y-8 text-sm text-[#333333] leading-relaxed">
          
          {/* Summary Callout banner */}
          <div className="p-5 bg-neutral-100 border border-neutral-200 rounded text-xs text-neutral-800 space-y-2">
            <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldAlert size={14} className="text-neutral-800" />
              <span>Core Privacy Guarantee: Zero User Storage Context</span>
            </div>
            <p className="leading-relaxed">
              Stremini operates under a **purely non-custodial** environment. This means that your email queues, documents, databases, drive files, and response forms are analyzed entirely in-memory within your local browser layout. Our services **do NOT cache, persist, or collect** your raw files or datasets on any cloud infrastructure owned by Stremini. All API transit tokens reside exclusively in your local session space.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold uppercase text-[#111111] tracking-tight border-b border-neutral-100 pb-1">
              1. Information We Access and How it is Handled
            </h2>
            <p>
              When navigating Stremini Workspace, the application requests local OAuth synchronization access to standard Google Workspace API endpoints. Here is exactly what is accessed and why:
            </p>
            <ul className="list-disc pl-5 space-y-3 text-xs text-[#555555]">
              <li>
                <strong>Gmail API (Gmail Scopes - Read, Send, Metadata):</strong> Used exclusively to populate your Mail queue list, compose custom replies, compile thread summaries, or draft message contexts.
              </li>
              <li>
                <strong>Google Drive & Google Docs API (Drive Scopes):</strong> Used to search, preview, and categorize files across your authorized drives, generating summary metadata.
              </li>
              <li>
                <strong>Google Forms API (Form Scopes):</strong> Used to query live spreadsheets, structure, and aggregates of submissions, rendering local statistical indicators and insights.
              </li>
              <li>
                <strong>Firebase Firestore Context:</strong> For teams utilizing manual databases and workspace rules configured inside Firestore, variables are written either to your own user-configured Firebase bucket or protected local session storage. We do not operate a general database for tracking your entries.
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold uppercase text-[#111111] tracking-tight border-b border-neutral-100 pb-1">
              2. Google OAuth Verification and API Scopes Disclosure
            </h2>
            <p>
              In strict accordance with the Google API Services User Data Policy, our application's use and transfer to any other app of information received from Google APIs will adhere to the **Google API Services User Data Policy**, including the Limited Use requirements.
            </p>
            <p className="text-xs bg-neutral-100 p-4 border border-neutral-200 rounded font-mono text-neutral-700">
              STRICT LIMITED USE DIRECTIVE: We do not transfer, compile, sell, or disclose user data to any third-party aggregators, advertising networks, or model brokers. Your data is used exclusively to display your workspace inside your personal active browser dashboard.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold uppercase text-[#111111] tracking-tight border-b border-neutral-100 pb-1">
              3. Processing with Local Parsing Algorithms
            </h2>
            <p>
              To offer summaries of active email queues, documents, and form feedback responses, Stremini interfaces with native translation and parsing scripts.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-[#555555]">
              <li>Your API calls execute directly from the server or client context securely.</li>
              <li>No personal information processed through the parsing endpoints is cached or utilized for retraining.</li>
              <li>Under no conditions does Stremini sell your search logs, queries, or summary histories.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold uppercase text-[#111111] tracking-tight border-b border-neutral-100 pb-1">
              4. Cookies and Web Analytics
            </h2>
            <p>
              This application utilizes standard local variables to remember user choices, such as active styles (dark or light parameters). We do not load invasive marketing track cookies, pixel campaigns, or third-party advertising modules.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-extrabold uppercase text-[#111111] tracking-tight border-b border-neutral-100 pb-1">
              5. Support and Compliance Requests
            </h2>
            <p>
              We welcome complete transparency regarding data handling. If you have regulatory inquiries, wish to verify the non-custodial operations of our code, or have concerns regarding OAuth privileges, please contact our support desk:
            </p>
            <a 
              href="mailto:streminiai@gmail.com"
              className="inline-flex items-center space-x-2 text-neutral-800 hover:text-black text-xs font-bold uppercase tracking-wider bg-white border border-[#EEEEEE] px-4 py-2 rounded-sm transition-all"
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
            <p className="font-bold text-[#111111]">Stremini Workspace Trust Operations</p>
            <p>© 2026 Stremini. Pure non-custodial integrity.</p>
          </div>
          <a href="mailto:streminiai@gmail.com" className="text-neutral-800 hover:text-[#111111] transition-colors font-mono">streminiai@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}
