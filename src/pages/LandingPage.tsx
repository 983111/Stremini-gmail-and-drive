import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Mail, 
  FileText, 
  LayoutGrid, 
  Layers, 
  Activity, 
  CheckCircle2, 
  Zap, 
  Menu, 
  X, 
  Database, 
  ClipboardList, 
  Presentation,
  Globe,
  Flame,
  Scale
} from 'lucide-react';

export function LandingPage() {
  const { signIn, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'forms' | 'slides' | 'inbox'>('forms');

  // Trigger smooth scroll
  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] font-sans selection:bg-[#E5E5E5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAFAFA]/80 backdrop-blur-md border-b border-[#EEEEEE] transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-sm bg-[#111111] flex items-center justify-center">
              <LayoutGrid size={16} className="text-[#FAFAFA]" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight hover:opacity-80 transition-opacity">Stremini Workspace</span>
              <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 tracking-wider uppercase font-mono ring-1 ring-indigo-200/50">Intelligence</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToId('features')} className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors uppercase tracking-wider">Capabilities</button>
            <button onClick={() => scrollToId('mockup')} className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors uppercase tracking-wider">Preview</button>
            <Link to="/blog" className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors uppercase tracking-wider">Intelligence Blog</Link>
            <button onClick={() => scrollToId('pricing')} className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors uppercase tracking-wider">Licensing</button>
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <Link
                to="/"
                className="px-4 py-2 bg-[#111111] text-[#FAFAFA] text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#222222] transition-colors flex items-center space-x-2"
              >
                <span>Enter Admin Console</span>
                <ArrowRight size={12} />
              </Link>
            ) : (
              <>
                <button
                  onClick={signIn}
                  className="px-4 py-2 border border-[#EEEEEE] text-[#111111] text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-neutral-50 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={signIn}
                  className="px-4 py-2 bg-[#111111] text-[#FAFAFA] text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#222222] transition-colors flex items-center space-x-2 shadow-sm"
                >
                  <span>Get Started Free</span>
                  <Zap size={12} className="fill-[#FAFAFA]" />
                </button>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-[#666666] hover:text-[#111111]"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#EEEEEE] bg-[#FAFAFA] px-4 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
            <button onClick={() => scrollToId('features')} className="block w-full text-left text-xs font-bold text-[#666666] hover:text-[#111111] uppercase tracking-wider">Capabilities</button>
            <button onClick={() => scrollToId('mockup')} className="block w-full text-left text-xs font-bold text-[#666666] hover:text-[#111111] uppercase tracking-wider">Preview</button>
            <Link to="/blog" className="block text-xs font-bold text-[#666666] hover:text-[#111111] uppercase tracking-wider">Intelligence Blog</Link>
            <button onClick={() => scrollToId('pricing')} className="block w-full text-left text-xs font-bold text-[#666666] hover:text-[#111111] uppercase tracking-wider">Licensing</button>
            <div className="pt-4 border-t border-[#EEEEEE] space-y-2">
              {user ? (
                <Link
                  to="/"
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-[#111111] text-[#FAFAFA] text-xs font-bold uppercase tracking-wider rounded-sm"
                >
                  <span>Enter Admin Console</span>
                  <ArrowRight size={12} />
                </Link>
              ) : (
                <>
                  <button
                    onClick={signIn}
                    className="w-full py-3 border border-[#EEEEEE] text-center text-xs font-bold uppercase tracking-wider rounded-sm"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={signIn}
                    className="w-full py-3 bg-[#111111] text-center text-[#FAFAFA] text-xs font-bold uppercase tracking-wider rounded-sm flex items-center justify-center space-x-2"
                  >
                    <span>Get Started Free</span>
                    <Zap size={12} className="fill-[#FAFAFA]" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 pb-16 px-4 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#F0F0F0_1px,transparent_1px),linear-gradient(to_bottom,#F0F0F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center space-x-2 bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-full">
            <Sparkles size={12} className="text-neutral-600 animate-pulse" />
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Cognitive Productivity Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#111111] font-sans leading-[1.05]">
            Orchestrate your entire Google Workspace.
          </h1>

          <p className="text-base sm:text-lg text-[#555555] max-w-2xl mx-auto leading-relaxed">
            The elite enterprise intelligence suite. Turn complex feedback grids into insight streams, synchronize active databases, and direct drafts in seconds, securely.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            {user ? (
              <Link
                to="/"
                className="w-full sm:w-auto px-8 py-4 bg-[#111111] text-[#FAFAFA] text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-neutral-900 transition-all shadow-[0_4px_14px_0_rgba(17,17,17,0.15)] flex items-center justify-center space-x-3 active:scale-[0.98]"
              >
                <span>Access Console</span>
                <ArrowRight size={13} />
              </Link>
            ) : (
              <>
                <button
                  onClick={signIn}
                  className="w-full sm:w-auto px-8 py-4 bg-[#111111] text-[#FAFAFA] text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-neutral-900 transition-all shadow-[0_4px_14px_0_rgba(17,17,17,0.15)] flex items-center justify-center space-x-3 active:scale-[0.98]"
                >
                  <span>Begin Secure Onboarding</span>
                  <Zap size={13} className="fill-[#FAFAFA]" />
                </button>
                <button
                  onClick={() => scrollToId('features')}
                  className="w-full sm:w-auto px-8 py-4 bg-transparent border border-[#CCCCCC] text-[#111111] text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-neutral-50 transition-colors flex items-center justify-center"
                >
                  Explore Capabilities
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Interface Mockup */}
        <div id="mockup" className="max-w-5xl mx-auto mt-20 relative z-10">
          <div className="bg-white border border-[#CCCCCC] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Mock Window Header */}
            <div className="bg-neutral-50 border-b border-[#EEEEEE] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-neutral-200"></div>
                <div className="w-3 h-3 rounded-full bg-neutral-200"></div>
                <div className="w-3 h-3 rounded-full bg-neutral-200"></div>
              </div>
              <div className="flex items-center space-x-1.5 bg-white border border-[#E5E5E5] rounded px-3 py-1 text-[10px] text-[#888888] font-mono">
                <Lock size={10} className="text-emerald-600" />
                <span>workspace.stremini.ai</span>
              </div>
              <div className="w-12"></div>
            </div>

            {/* Mock Workspace Page Workspace */}
            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[480px]">
              {/* Fake Sidebar */}
              <div className="md:col-span-1 bg-neutral-50 border-r border-[#EEEEEE] p-5 space-y-6">
                <div className="space-y-1">
                  <div className="text-[9px] font-bold text-[#888888] tracking-widest uppercase font-mono">Operations</div>
                  <div className="space-y-1">
                    <button 
                      onClick={() => setActiveTab('forms')}
                      className={`w-full text-left px-3 py-2 rounded-sm text-xs flex items-center space-x-2 transition-all ${activeTab === 'forms' ? 'bg-white border border-[#E5E5E5] font-semibold text-[#111111]' : 'text-[#666666] hover:bg-neutral-100 hover:text-[#111111]'}`}
                    >
                      <ClipboardList size={14} className="text-[#111111]" />
                      <span>Form Synchronizer</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('slides')}
                      className={`w-full text-left px-3 py-2 rounded-sm text-xs flex items-center space-x-2 transition-all ${activeTab === 'slides' ? 'bg-white border border-[#E5E5E5] font-semibold text-[#111111]' : 'text-[#666666] hover:bg-neutral-100 hover:text-[#111111]'}`}
                    >
                      <Presentation size={14} className="text-[#111111]" />
                      <span>Slides Orchestrator</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('inbox')}
                      className={`w-full text-left px-3 py-2 rounded-sm text-xs flex items-center space-x-2 transition-all ${activeTab === 'inbox' ? 'bg-white border border-[#E5E5E5] font-semibold text-[#111111]' : 'text-[#666666] hover:bg-neutral-100 hover:text-[#111111]'}`}
                    >
                      <Mail size={14} className="text-[#111111]" />
                      <span>Inbox Intelligence</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-neutral-200">
                  <div className="text-[9px] font-bold text-[#888888] tracking-widest uppercase font-mono">Cognitive Health</div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-sm border border-emerald-100">
                    <span className="flex items-center gap-1.5 font-bold font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Local Secure Link
                    </span>
                    <span>100% Client-Side</span>
                  </div>
                </div>
              </div>

              {/* Fake Content Workspace */}
              <div className="md:col-span-3 p-6 bg-white flex flex-col justify-between">
                <div>
                  {activeTab === 'forms' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#111111]">Form Responses Sync</h4>
                          <p className="text-[10px] text-[#666666]">Direct query and digest synchronization from Forms API.</p>
                        </div>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-mono font-bold">18 Responses</span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="p-3 bg-neutral-50 rounded-sm border border-neutral-100 text-xs flex justify-between items-center">
                          <span className="font-medium">"How would you rate the experience?"</span>
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-neutral-200 text-neutral-700">Avg: 4.8 / 5.0</span>
                        </div>
                        <div className="p-3 bg-neutral-50 rounded-sm border border-neutral-100 text-xs flex justify-between items-center">
                          <span className="font-medium">"What is your primary workspace challenge?"</span>
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-neutral-200 text-neutral-700">Text Summary Active</span>
                        </div>
                      </div>

                      <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                          <Sparkles size={13} className="text-indigo-600" />
                          <span>Gemini Analytical Synthesis</span>
                        </div>
                        <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                          Feedback signals strong positive sentiment on form structure, recommending we refine onboarding metrics.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'slides' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#111111]">Presentation Grid Alignment</h4>
                          <p className="text-[10px] text-[#666666]">Compile structures and push to Master Slide components.</p>
                        </div>
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded font-mono font-bold">4 Elements Ready</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-sm space-y-1">
                          <div className="text-[9px] font-bold text-neutral-400">ITEM #1</div>
                          <div className="text-xs font-bold">Vision & Execution</div>
                          <p className="text-[10px] text-neutral-500">Core directives aligned to corporate themes.</p>
                        </div>
                        <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-sm space-y-1">
                          <div className="text-[9px] font-bold text-neutral-400">ITEM #2</div>
                          <div className="text-xs font-bold">Workspace Efficiency</div>
                          <p className="text-[10px] text-neutral-500 font-mono text-emerald-600">Sync: Success</p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-neutral-900 rounded-lg text-[#FAFAFA] text-xs font-mono space-y-1">
                        <div className="text-amber-400">Console Terminal Output</div>
                        <div>$ google-slides --align --source-id="docs_01"</div>
                        <div className="text-emerald-400">&gt;&gt; Synthesized master structures generated. Ready for Google Slides compile.</div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'inbox' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#111111]">Cognitive Inbox Management</h4>
                          <p className="text-[10px] text-[#666666]">Smart search filters and direct cognitive summarization.</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-sm text-xs">
                          <div className="flex justify-between font-bold mb-1">
                            <span>SVP Operations</span>
                            <span className="text-neutral-400 font-mono">11:05 AM</span>
                          </div>
                          <div className="text-neutral-500 line-clamp-1">Reviewing the quarterly layout synchronization plan for general distribution...</div>
                        </div>

                        <div className="flex gap-2.5">
                          <button className="flex-1 text-center py-2 border border-[#CCCCCC] text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-neutral-50 transition-colors">
                            Summarize Core Thread
                          </button>
                          <button className="flex-1 text-center py-2 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-neutral-800 transition-colors">
                            Generate Cognizant Draft
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px] text-neutral-500 gap-3">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck size={14} className="text-neutral-400" />
                    <span>Independent product. Zero telemetry or analytical scraping.</span>
                  </div>
                  <div className="text-[#111111] font-bold">Stremini Workspace Core 2.5</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Grid */}
      <section className="py-12 border-t border-b border-[#EEEEEE] bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest font-mono mb-6">TRUSTED COGNITIVE ARCHITECTURE RUNNING NATIVELY</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-40 grayscale select-none">
            <span className="font-bold text-lg tracking-widest font-sans">ACME CORP</span>
            <span className="font-bold text-lg tracking-widest font-sans">GLOBEX</span>
            <span className="font-bold text-lg tracking-widest font-sans">SOYLENT</span>
            <span className="font-bold text-lg tracking-widest font-sans">INITECH</span>
            <span className="font-bold text-lg tracking-widest font-sans">UMBRELLA</span>
          </div>
        </div>
      </section>

      {/* Bento Capabilities Grid */}
      <section id="features" className="py-24 px-4 bg-[#FCFCFC]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] mb-2 uppercase font-sans">
              Designed For High-Performance Workflows.
            </h2>
            <p className="text-sm sm:text-base text-[#666666]">
              Unifying scattered silos inside Google Workspace into highly integrated command spaces. 
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Large Span */}
            <div className="md:col-span-2 bg-white border border-[#EEEEEE] rounded-xl p-8 hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-sm flex items-center justify-center">
                  <Database size={18} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#111111]">Intellect Databases Engine</h3>
                <p className="text-xs sm:text-sm text-[#555555] max-w-lg leading-relaxed">
                  Direct prompt-driven workspace databases compiling schemas, layouts, state monitors, and row metrics dynamically. No formula typing required—instruct what fields you need to coordinate, and let the model structure everything.
                </p>
              </div>
              
              {/* Mini visual */}
              <div className="pt-4 border-t border-neutral-100 grid grid-cols-3 gap-3">
                <div className="p-3 bg-neutral-50 rounded border border-neutral-100 space-y-1">
                  <div className="text-[8px] font-mono font-bold text-indigo-600">METRICS</div>
                  <div className="text-[11px] font-bold text-neutral-900">Task Tracker</div>
                </div>
                <div className="p-3 bg-neutral-50 rounded border border-neutral-100 space-y-1">
                  <div className="text-[8px] font-mono font-bold text-indigo-600">CAPACITY</div>
                  <div className="text-[11px] font-bold text-neutral-900">Custom Columns</div>
                </div>
                <div className="p-3 bg-neutral-900 text-white rounded border border-neutral-800 space-y-1">
                  <div className="text-[8px] font-mono font-bold text-indigo-400">INTELLIGENCE</div>
                  <div className="text-[11px] font-bold">100% Synced</div>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Vertical */}
            <div className="bg-white border border-[#EEEEEE] rounded-xl p-8 hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-sm flex items-center justify-center">
                  <Presentation size={18} className="text-amber-700" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-[#111111]">Slide Builders</h3>
                <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                  Synthesize outlines into clean, presentation-ready frameworks quickly, retaining precise formatting and hierarchical styling parameters perfectly inside Google Slides.
                </p>
              </div>
              <div className="bg-[#FAF9F6] border border-[#F0EBE0] p-3 rounded text-[11px] font-mono text-amber-900">
                &gt; Align Master Blueprint... [OK]
              </div>
            </div>

            {/* Bento Card 3: Dynamic Forms Sync */}
            <div className="bg-white border border-[#EEEEEE] rounded-xl p-8 hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-sm flex items-center justify-center">
                  <ClipboardList size={18} className="text-emerald-700" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-[#111111]">Form Intellect</h3>
                <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                  Re-evaluate feedback dynamically, extract qualitative trends using language analysis feeds, track averages of scaling scores, and align actionable initiatives instantly.
                </p>
              </div>
              <div className="bg-emerald-50 text-emerald-950 p-2.5 rounded-lg border border-emerald-100 text-[11px] flex justify-between items-center font-bold">
                <span>Real-Time Submissions Active</span>
                <span className="font-mono bg-white px-1.5 py-0.5 border border-emerald-200 rounded">Live Loop</span>
              </div>
            </div>

            {/* Bento Card 4: Mail Grid Security */}
            <div className="md:col-span-2 bg-white border border-[#EEEEEE] rounded-xl p-8 hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-sm flex items-center justify-center">
                  <Mail size={18} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#111111]">Advanced Filter Suite</h3>
                <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                  Harness powerful search inputs to organize emails, write professional cognizant replies, translate text, and generate high-fidelity bullet context on demand inside Gmail.
                </p>
              </div>
              <div className="flex gap-2.5 text-[11px] font-medium text-neutral-600">
                <span className="bg-neutral-100 border border-neutral-200 px-3 py-1 rounded">Sender Filter</span>
                <span className="bg-neutral-100 border border-neutral-200 px-3 py-1 rounded">Date Intervals</span>
                <span className="bg-neutral-100 border border-neutral-200 px-3 py-1 rounded">Attachment Presence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security, Data Protection & Warranty Section (Anti-Suing) */}
      <section className="py-20 bg-[#FAFAFA] border-t border-b border-[#EEEEEE] relative">
        <div className="max-w-4xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 uppercase">
              Zero-Trust Local Security Architecture
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] max-w-xl mx-auto">
              Stremini was built with structural legal safety and privacy protection guidelines as default. Here's our operational framework for absolute compliance:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 p-5 bg-white border border-neutral-200 rounded-lg">
              <div className="flex items-center space-x-2 text-indigo-700">
                <Lock size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest font-mono">1. Pure Non-Custodial Sync</h4>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Stremini behaves as a transparent browser layer. Your personal information, files, emails, and database records remain strictly within Google or your local session. We never save, cache, or train on your personal datasets.
              </p>
            </div>

            <div className="space-y-3 p-5 bg-white border border-neutral-200 rounded-lg">
              <div className="flex items-center space-x-2 text-indigo-700">
                <Globe size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest font-mono">2. Independent API Integration</h4>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Stremini is an independent product using Google's public OAuth workspace APIs. We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with Google LLC or Alphabet Inc.
              </p>
            </div>

            <div className="space-y-3 p-5 bg-white border border-neutral-200 rounded-lg">
              <div className="flex items-center space-x-2 text-indigo-700">
                <Flame size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest font-mono">3. Liability Protections</h4>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                We distribute this tooling on an "AS IS" basis. There are no absolute representations of continuous service availability. Under no conditions shall Stremini be liable for any direct, collateral, or circumstantial service outages.
              </p>
            </div>

            <div className="space-y-3 p-5 bg-white border border-neutral-200 rounded-lg">
              <div className="flex items-center space-x-2 text-indigo-700">
                <Scale size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest font-mono">4. Complete Scope Disclosures</h4>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                When you grant space parameters (e.g. Gmail Queue, Drive Sync), this application utilizes transit tokens temporarily to synchronize queries inside the memory frame.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 bg-white text-[#111111]">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight uppercase">Licensing Tiers</h2>
            <p className="text-xs sm:text-sm text-[#666666] max-w-sm mx-auto">
              Straightforward, minimal licensing terms. No nested upgrade walls.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-[#FAFAFA] border border-[#EEEEEE] rounded-2xl p-8 space-y-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Standard Workspace License</h3>
                <p className="text-xs text-[#666666] mt-1">Perfect for professionals and teams</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded uppercase tracking-wider font-mono">Current Tier</span>
            </div>

            <div className="flex items-baseline space-x-1">
              <span className="text-5xl font-extrabold tracking-tighter text-[#111111]">$0</span>
              <span className="text-xs text-[#666666] font-mono">/ Month (Free)</span>
            </div>

            <div className="space-y-3 pt-6 border-t border-[#EEEEEE]">
              <div className="flex items-center space-x-3 text-xs text-[#333333]">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Unlimited Drive synchronization parameters</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-[#333333]">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Inbox summarization with Google Gemini</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-[#333333]">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Forms responses diagnostics and diagnostics</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-[#333333]">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>100% Client-side local data encryption parameters</span>
              </div>
            </div>

            <button
              onClick={signIn}
              className="w-full bg-[#111111] hover:bg-neutral-900 text-[#FAFAFA] py-3 text-xs font-extrabold uppercase tracking-widest rounded-sm transition-all flex items-center justify-center space-x-2 shadow-sm"
            >
              <span>Activate Standard License</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Bottom Callout */}
      <section className="py-20 bg-neutral-900 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[#111111]/90" />
        <div className="relative z-10 max-w-2xl mx-auto px-4 space-y-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase leading-[1.1]">
            Ready to experience elite workspace synergy?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Authorize your API parameters locally and start commanding your operational suite in minutes.
          </p>
          <button
            onClick={signIn}
            className="inline-flex items-center space-x-2 bg-white text-black font-extrabold py-3.5 px-8 text-xs uppercase tracking-widest rounded-sm hover:bg-neutral-100 transition-all shadow-md active:scale-95"
          >
            <span>Initialize Account Free</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#EEEEEE] text-[#555555]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="space-y-4 lg:col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 text-[#111111]">
              <div className="w-6 h-6 rounded-sm bg-[#111111] flex items-center justify-center">
                <LayoutGrid size={12} className="text-[#FAFAFA]" />
              </div>
              <span className="font-bold text-sm tracking-tight">Stremini Workspace</span>
            </div>
            <p className="text-xs text-[#888888] leading-relaxed max-w-xs">
              Elite enterprise intelligence layer for your dynamic data structures. Transparent, local, secure.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider font-mono">Intelligence Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/blog" className="hover:text-[#111111] transition-colors">Intelligence Blog</Link></li>
              <li><button onClick={() => scrollToId('features')} className="hover:text-[#111111] transition-colors text-left">Product Features</button></li>
              <li><button onClick={() => scrollToId('mockup')} className="hover:text-[#111111] transition-colors text-left">Interactive Deck</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider font-mono">Safety & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/privacy" className="hover:text-[#111111] transition-colors">Privacy Principles Feed</Link></li>
              <li><Link to="/terms" className="hover:text-[#111111] transition-colors">Workspace Terms of Conditions</Link></li>
            </ul>
          </div>

          <div className="space-y-3" id="footer-support-box">
            <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider font-mono">Help & Support</h4>
            <p className="text-xs text-[#666666]">
              Direct support inquiries, suggestions, and parameter audit contact:
            </p>
            <a 
              id="footer-support-email-link"
              href="mailto:streminiai@gmail.com"
              className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 text-xs font-semibold cursor-pointer"
            >
              <Mail size={12} />
              <span>streminiai@gmail.com</span>
            </a>
          </div>

          {/* Newsletter Signup Form Column */}
          <div className="space-y-4" id="newsletter-container">
            <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider font-mono">Operational Intel</h4>
            <p className="text-xs text-[#666666] leading-relaxed">
              Subscribe to standard workspace intelligence briefings, setup guides, and privacy releases.
            </p>
            {newsletterSubmitted ? (
              <div 
                id="newsletter-success-toast" 
                className="p-4 bg-emerald-50 border border-emerald-100/80 rounded-sm text-[11px] leading-relaxed text-emerald-800 space-y-1 animate-in fade-in zoom-in-95 duration-200"
              >
                <span className="font-bold block uppercase tracking-wide">Subscription Confirmed!</span>
                <p className="opacity-90 font-medium">Thank you for subscribing to Stremini Intelligence updates.</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribeNewsletter} id="newsletter-signup-form" className="space-y-2 pt-1">
                <div className="flex flex-col gap-2">
                  <input
                    id="newsletter-email-input"
                    type="email"
                    placeholder="Enter email address"
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value);
                      if (newsletterError) setNewsletterError('');
                    }}
                    required
                    disabled={newsletterLoading}
                    className="w-full px-3 py-2 bg-white border border-[#EEEEEE] rounded-sm text-xs text-[#111111] placeholder:text-neutral-400 outline-none focus:border-neutral-450 focus:ring-1 focus:ring-neutral-450/20 disabled:opacity-60 transition-all font-sans"
                  />
                  <button
                    id="newsletter-submit-button"
                    type="submit"
                    disabled={newsletterLoading}
                    className="w-full px-4 py-2 bg-[#111111] hover:bg-neutral-800 text-[#FAFAFA] font-bold text-xs uppercase tracking-wider rounded-sm transition-all focus:ring-2 focus:ring-neutral-450 focus:ring-offset-2 disabled:bg-neutral-300 disabled:text-neutral-500 shrink-0"
                  >
                    {newsletterLoading ? 'Submitting...' : 'Subscribe'}
                  </button>
                </div>
                {newsletterError && (
                  <p id="newsletter-error-feedback" className="text-[11px] text-red-600 font-medium">{newsletterError}</p>
                )}
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-[#EEEEEE] py-8 text-center text-[11px] text-[#888888] max-w-7xl mx-auto px-4 space-y-2">
          <p>© 2026 Stremini Workspace. All rights reserved globally.</p>
          <p className="max-w-3xl mx-auto px-4 opacity-70">
            Disclaimer: Stremini Workspace is not affiliated with Google Workspace, Gmail, Google Drive, Google Forms, Google Slides, Google Inc, or Alphabet Inc. All brand trademarks remain property of their respective holders. API parameters are routed strictly through local user OAuth contexts.
          </p>
        </div>
      </footer>
    </div>
  );
}
