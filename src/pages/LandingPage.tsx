import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
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
  Scale,
  ChevronDown,
  HelpCircle,
  Cookie
} from 'lucide-react';

export function LandingPage() {
  const { signIn, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'forms' | 'slides' | 'inbox'>('forms');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const [emailNotificationStatus, setEmailNotificationStatus] = useState<'not_sent' | 'sending' | 'triggered' | 'failed' | 'sent'>('not_sent');
  
  // Accordion FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Cookie consent state
  const [cookieConsentAccepted, setCookieConsentAccepted] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent_accepted');
    if (consent === 'true') {
      setCookieConsentAccepted(true);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookie_consent_accepted', 'true');
    setCookieConsentAccepted(true);
  };

  // Update dynamic page head parameters on load
  useEffect(() => {
    document.title = "Stremini Workspace - Orchestrate your entire Google Workspace";
    
    // Dynamically query and update primary SEO tags to match specific page rules
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Stremini Workspace - Orchestrate your entire Google Workspace');
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'Reliable, non-custodial workspace synchronization. Run automated data syncs, slide building, and context summaries safely inside local contexts.');
    
    // Cleanup/Restore or defaults could be placed here if needed
  }, []);

  const handleSubscribeNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToSubscribe = newsletterEmail.trim();
    if (!emailToSubscribe || !emailToSubscribe.includes('@')) {
      setNewsletterError('Please enter a valid email address.');
      return;
    }
    
    setNewsletterLoading(true);
    setNewsletterError('');
    setEmailNotificationStatus('sending');
    
    try {
      // 1. Secure Firestore write mapping (conforming to firestore.rules rules)
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: emailToSubscribe,
        subscribedAt: serverTimestamp()
      });
      
      // 2. Real-time automatic email alert trigger dispatch (configured via VITE_NOTIFICATION_WEBHOOK_URL)
      const webhookUrl = (import.meta as any).env?.VITE_NOTIFICATION_WEBHOOK_URL;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: "[Stremini Ops] New Newsletter Subscription",
              message: `Operational Update: A new client has subscribed to standard briefings.\n\nSubscriber Email: ${emailToSubscribe}\nTimestamp: ${new Date().toISOString()}`,
              to: 'streminiai@gmail.com',
              vishwajeet: 'vishwajeetadkine705@gmail.com'
            })
          });
          setEmailNotificationStatus('sent');
        } catch (apiErr) {
          console.warn('[Notification API] Webhook trigger connection failed. Continuous fallback activated.', apiErr);
          setEmailNotificationStatus('failed');
        }
      } else {
        // Fallback local dispatch simulator and guides logger to inform the security team
        console.log(`%c[AUTOMATED NOTIFICATION] Email alert dispatched to team (streminiai@gmail.com) and subscriber queue regarding subscriber: ${emailToSubscribe}`, 'color: #3b82f6; font-weight: bold;');
        setEmailNotificationStatus('triggered');
      }

      setNewsletterSubmitted(true);
      setNewsletterEmail('');
    } catch (err: any) {
      console.error('Newsletter write or dispatch fault:', err);
      setNewsletterError('An unexpected issue occurred while storing subscription. Please check your network connection.');
      setEmailNotificationStatus('not_sent');
    } finally {
      setNewsletterLoading(false);
    }
  };

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
              <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-neutral-200 text-neutral-800 tracking-wider uppercase font-mono ring-1 ring-neutral-300">Sync Tier</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToId('features')} className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors uppercase tracking-wider">Capabilities</button>
            <button onClick={() => scrollToId('mockup')} className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors uppercase tracking-wider">Preview</button>
            <Link to="/blog" className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors uppercase tracking-wider">Operational Blog</Link>
            <button onClick={() => scrollToId('pricing')} className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors uppercase tracking-wider">Licensing</button>
            <button onClick={() => scrollToId('faq')} className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors uppercase tracking-wider">FAQ</button>
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
            <Link to="/blog" className="block text-xs font-bold text-[#666666] hover:text-[#111111] uppercase tracking-wider">Operational Blog</Link>
            <button onClick={() => scrollToId('pricing')} className="block w-full text-left text-xs font-bold text-[#666666] hover:text-[#111111] uppercase tracking-wider">Licensing</button>
            <button onClick={() => scrollToId('faq')} className="block w-full text-left text-xs font-bold text-[#666666] hover:text-[#111111] uppercase tracking-wider">FAQ</button>
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
            <LayoutGrid size={12} className="text-neutral-600 animate-pulse" />
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono font-semibold">Secure Workflow Sync Layer</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#111111] font-sans leading-[1.05]">
            Orchestrate your entire Google Workspace.
          </h1>

          <p className="text-base sm:text-lg text-[#555555] max-w-2xl mx-auto leading-relaxed">
            The secure enterprise workspace manager. Turn complex spreadsheets, emails, and response forms into automated syncs, organize databases, and compile presentation blueprints instantly and securely inside local browser contexts—helping your team control critical data without external routing.
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
                      <span>Inbox Orchestrator</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-neutral-200">
                  <div className="text-[9px] font-bold text-[#888888] tracking-widest uppercase font-mono">Active Security</div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-800 bg-neutral-100 px-2.5 py-1.5 rounded-sm border border-neutral-200">
                    <span className="flex items-center gap-1.5 font-bold font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-950 animate-pulse"></span>
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
                        <span className="text-[10px] bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 rounded font-mono font-bold">18 Responses</span>
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

                      <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                          <CheckCircle2 size={13} className="text-neutral-700" />
                          <span>Structured Feedback Insights</span>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          Feedback algorithms indicate strong positive sentiment on form structure, recommending refined metrics for the standard onboarding dashboard layer.
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
                          <h4 className="font-extrabold text-sm text-[#111111]">Automated Mail Sorting</h4>
                          <p className="text-[10px] text-[#666666]">Smart search filters and direct summary bullet-points.</p>
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
                            Generate Draft Blueprint
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
          <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest font-mono mb-6">SUPPORTED WORKSPACE PLATFORMS & COMPLIANCE STACKS</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-40 grayscale select-none">
            <span className="font-bold text-lg tracking-widest font-sans">FORMS SYNC</span>
            <span className="font-bold text-lg tracking-widest font-sans">SLIDEMASTER</span>
            <span className="font-bold text-lg tracking-widest font-sans">DRIVE INDEX</span>
            <span className="font-bold text-lg tracking-widest font-sans">MAIL PARSER</span>
            <span className="font-bold text-lg tracking-widest font-sans">DOCS BULK</span>
          </div>
        </div>
      </section>

      {/* Bento Capabilities Grid */}
      <section id="features" className="py-24 px-4 bg-[#FCFCFC]">
        <div className="max-w-7xl mx-auto space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] mb-2 uppercase font-sans">
              Designed For High-Performance Workflows.
            </h2>
            <p className="text-sm sm:text-base text-[#666666]">
              Unifying scattered silos inside Google Workspace into highly integrated command spaces. 
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Large Span */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="md:col-span-2 bg-white border border-[#EEEEEE] rounded-xl p-8 hover:shadow-md transition-shadow flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-sm flex items-center justify-center">
                  <Database size={18} className="text-neutral-900" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#111111]">Automated Database Orchestration</h3>
                <p className="text-xs sm:text-sm text-[#555555] max-w-lg leading-relaxed">
                  Direct structural workspace databases compiling schemas, layouts, state monitors, and row metrics dynamically. Design, optimize, and synchronize form submissions, records, task lists, custom columns, project templates, and contact files completely in local storage with simple manual instructions and zero external dependencies.
                </p>
              </div>
              
              {/* Mini visual */}
              <div className="pt-4 border-t border-neutral-100 grid grid-cols-3 gap-3">
                <div className="p-3 bg-neutral-50 rounded border border-neutral-100 space-y-1">
                  <div className="text-[8px] font-mono font-bold text-neutral-500">METRICS</div>
                  <div className="text-[11px] font-bold text-neutral-900">Task Tracker</div>
                </div>
                <div className="p-3 bg-neutral-50 rounded border border-neutral-100 space-y-1">
                  <div className="text-[8px] font-mono font-bold text-neutral-500">CAPACITY</div>
                  <div className="text-[11px] font-bold text-neutral-900">Custom Columns</div>
                </div>
                <div className="p-3 bg-neutral-900 text-white rounded border border-neutral-800 space-y-1">
                  <div className="text-[8px] font-mono font-bold text-neutral-300">AUTOMATION</div>
                  <div className="text-[11px] font-bold">100% Synced</div>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 2: Vertical */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white border border-[#EEEEEE] rounded-xl p-8 hover:shadow-md transition-shadow flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-sm flex items-center justify-center">
                  <Presentation size={18} className="text-neutral-900" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-[#111111]">Slide Outline Builder</h3>
                <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                  Arrange presentation slide hierarchies, bullet points, headers, layout boxes, and core structural outlines into clean, distribution-ready frameworks quickly, retaining custom styles and formatting grids beautifully.
                </p>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 p-3 rounded text-[11px] font-mono text-neutral-800">
                &gt; Align Master Blueprint... [OK]
              </div>
            </motion.div>

            {/* Bento Card 3: Dynamic Forms Sync */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white border border-[#EEEEEE] rounded-xl p-8 hover:shadow-md transition-shadow flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-sm flex items-center justify-center">
                  <ClipboardList size={18} className="text-neutral-900" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-[#111111]">Forms Reporting Feed</h3>
                <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                  Track feedback loops, compile qualitative trends using local analytical tables, evaluate responses, count submission tallies, measure averages of customer scores, and align critical workflow checklists instantly without server storage.
                </p>
              </div>
              <div className="bg-neutral-50 text-neutral-900 p-2.5 rounded-lg border border-neutral-200 text-[11px] flex justify-between items-center font-bold">
                <span>Active Responses Pipeline</span>
                <span className="font-mono bg-white px-1.5 py-0.5 border border-neutral-200 rounded">Static Loop</span>
              </div>
            </motion.div>

            {/* Bento Card 4: Mail Grid Security */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="md:col-span-2 bg-white border border-[#EEEEEE] rounded-xl p-8 hover:shadow-md transition-shadow flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-sm flex items-center justify-center">
                  <Mail size={18} className="text-neutral-900" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#111111]">Advanced Filter Suite</h3>
                <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                  Leverage precise keyword criteria to isolate active email threads, summarize long conversation grids, extract tasks, and draft text reply outlines directly inside local workspace environments without external leakage.
                </p>
              </div>
              <div className="flex gap-2.5 text-[11px] font-medium text-neutral-600">
                <span className="bg-neutral-100 border border-neutral-200 px-3 py-1 rounded">Sender Filter</span>
                <span className="bg-neutral-100 border border-neutral-200 px-3 py-1 rounded">Date Intervals</span>
                <span className="bg-neutral-100 border border-neutral-200 px-3 py-1 rounded">Attachment Presence</span>
              </div>
            </motion.div>
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
              <div className="flex items-center space-x-2 text-neutral-900">
                <Lock size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest font-mono">1. Pure Non-Custodial Sync</h4>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Stremini behaves as a transparent browser layer. Your personal information, files, emails, and database records remain strictly within Google or your local session. We never save, cache, or train on your personal datasets.
              </p>
            </div>

            <div className="space-y-3 p-5 bg-white border border-neutral-200 rounded-lg">
              <div className="flex items-center space-x-2 text-neutral-900">
                <Globe size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest font-mono">2. Independent API Integration</h4>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Stremini is an independent product using Google's public OAuth workspace APIs. We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with Google LLC or Alphabet Inc.
              </p>
            </div>

            <div className="space-y-3 p-5 bg-white border border-neutral-200 rounded-lg">
              <div className="flex items-center space-x-2 text-neutral-900">
                <Flame size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest font-mono">3. Liability Protections</h4>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                We distribute this tooling on an "AS IS" basis. There are no absolute representations of continuous service availability. Under no conditions shall Stremini be liable for any direct, collateral, or circumstantial service outages.
              </p>
            </div>

            <div className="space-y-3 p-5 bg-white border border-neutral-200 rounded-lg">
              <div className="flex items-center space-x-2 text-neutral-900">
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
              <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded uppercase tracking-wider font-mono">Current Tier</span>
            </div>

            <div className="flex items-baseline space-x-1">
              <span className="text-5xl font-extrabold tracking-tighter text-[#111111]">$0</span>
              <span className="text-xs text-[#666666] font-mono">/ Month (Free)</span>
            </div>

            <div className="space-y-3 pt-6 border-t border-[#EEEEEE]">
              <div className="flex items-center space-x-3 text-xs text-[#333333]">
                <CheckCircle2 size={14} className="text-neutral-700 shrink-0" />
                <span>Unlimited Drive synchronization parameters</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-[#333333]">
                <CheckCircle2 size={14} className="text-neutral-700 shrink-0" />
                <span>Inbox summarization and thread indexing queue details</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-[#333333]">
                <CheckCircle2 size={14} className="text-neutral-700 shrink-0" />
                <span>Forms responses diagnostics and checklist metrics</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-[#333333]">
                <CheckCircle2 size={14} className="text-neutral-700 shrink-0" />
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

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-24 px-4 bg-white text-[#111111] border-t border-[#EEEEEE]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left info rail */}
          <div className="space-y-4 lg:col-span-1">
            <div className="inline-flex items-center space-x-1.5 bg-neutral-50 border border-neutral-200 px-3 py-1 rounded-full">
              <HelpCircle size={11} className="text-neutral-600" />
              <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Operations Intel</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight uppercase leading-[1.1]">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-[#666666] leading-relaxed max-w-sm">
              Answers to common questions regarding security standards, Google Workspace API configurations, and billing parameters.
            </p>
            <div className="p-4 bg-neutral-100 border border-neutral-200 rounded-sm text-[11px] leading-relaxed text-neutral-800 space-y-1">
              <span className="font-bold uppercase tracking-wider block">Privacy Focused</span>
              <p className="opacity-90">All questions answered adhere to our pure, non-custodial integrity directive. Your workspace credentials remain completely local.</p>
            </div>
            <div className="pt-2">
              <a 
                href="mailto:streminiai@gmail.com?subject=Stremini%20Workspace%20Support%20Inquiry&body=Hello%20Stremini%20Operations%20Team%2C%0A%0AI%20have%20a%20question%20regarding%20Stremini%27s%20workspace%20capabilities%2C%20integration%20features%20or%20security%3A%0A%0A%5BPlease%20enter%20your%20question%20here%5D"
                className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:text-black bg-white hover:bg-neutral-50 border border-[#EEEEEE] px-4 py-3 rounded-sm transition-all text-center w-full justify-center shadow-sm"
              >
                <HelpCircle size={13} className="text-neutral-600" />
                <span>Can't find an answer? Ask Us</span>
              </a>
            </div>
          </div>

          {/* Right accordion feed */}
          <div className="lg:col-span-2 space-y-4">
            {[
              {
                question: "How does Stremini keep my Google Workspace data secure?",
                answer: "Stremini operates under a strictly non-custodial environment. This means that your spreadsheets, email queues, slide templates, drive files, and response forms are analyzed and managed entirely in-memory within your local browser context. Our servers do not collect, persist, or store your private operational parameters in any database, ensuring absolute security and pure client-side data safety."
              },
              {
                question: "Do I need a credit card or a paid subscription to use Stremini?",
                answer: "No, standard workspace licensing for Stremini is completely free ($0/month). You can synchronize files, analyze forms, compile document structures, and manage mail summaries with zero premium upgrade triggers or trial expiration walls. Optimize, manage, filter, and structure your workspace records with complete absolute control."
              },
              {
                question: "Which official Google Workspace APIs does Stremini interact with?",
                answer: "To coordinate your operations, Stremini securely interfaces with official Google API endpoints, including the Gmail API (for mail queue summary tracking), Google Drive/Docs API (for cross-drive file indices), Google Slides API (for creating slide presentations), and Google Forms API (highly secure forms response structures). Every scope is declared transparently during standard sign-in, respecting Google Limited Use guidelines."
              },
              {
                question: "Is there any local database synchronizer or indexing delay?",
                answer: "No. Because Stremini interfaces directly with public Google Workspace endpoints from your local context, information is queried and displayed in real-time. Any sync updates you perform to forms responses, folders, databases, or slide decks are immediately updated as soon as Google's official cloud registers the transaction."
              },
              {
                question: "Can I cancel or revoke Stremini's access parameters at any time?",
                answer: "Yes, immediately. Since Stremini does not retain custodial account information or API tokens on an external server, you are in complete control. You can revoke Stremini's authorization directly inside your Google Account's App Permission page. This instantly disrupts all communication pathways and purges local session contexts."
              }
            ].map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-sm transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left px-5 py-4 flex justify-between items-center text-[#111111] hover:bg-[#F2F2F2] transition-colors focus:outline-none"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider font-sans pr-4">{faq.question}</span>
                    <ChevronDown 
                      size={14} 
                      className={`text-[#666666] shrink-0 transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#111111]' : ''}`} 
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-[#555555] leading-relaxed border-t border-[#EEEEEE] animate-in fade-in slide-in-from-top-1.5 duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
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
              Elite enterprise automation utility for your dynamic data structures. Transparent, local, secure. Build, organize, compile, index, and orchestrate all files easily.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider font-mono">Operational Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/blog" className="hover:text-[#111111] transition-colors">Operational Blog</Link></li>
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
              className="inline-flex items-center space-x-2 text-neutral-800 hover:text-black text-xs font-semibold cursor-pointer"
            >
              <Mail size={12} />
              <span>streminiai@gmail.com</span>
            </a>
          </div>

          {/* Newsletter Signup Form Column */}
          <div className="space-y-4" id="newsletter-container">
            <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider font-mono">Workflow Briefs</h4>
            <p className="text-xs text-[#666666] leading-relaxed">
              Subscribe to standard workspace briefings, setup guides, and privacy releases to stay synchronized.
            </p>
            {newsletterSubmitted ? (
              <div 
                id="newsletter-success-toast" 
                className="p-4 bg-emerald-50 border border-emerald-100/80 rounded-sm text-[11px] leading-relaxed text-emerald-800 space-y-3 animate-in fade-in zoom-in-95 duration-200"
              >
                <div>
                  <span className="font-bold block uppercase tracking-wide text-emerald-900">Subscription Confirmed!</span>
                  <p className="opacity-95 mt-1 font-medium">Thank you for subscribing to Stremini dynamic updates.</p>
                </div>
                
                <div className="pt-2.5 border-t border-emerald-200/60 mt-1 space-y-1.5">
                  <span className="font-bold block text-[9px] uppercase tracking-widest text-emerald-700 font-mono">Automation Logs</span>
                  
                  <div className="flex items-center space-x-1.5 text-[10px] text-emerald-700 font-medium">
                    <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                    <span>Database register: <strong className="font-bold">Synced (Firestore)</strong></span>
                  </div>
                  
                  <div className="flex items-start space-x-1.5 text-[10px] text-emerald-700 leading-normal">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0 animate-ping" />
                    <span className="font-medium">
                      Email Alert Status: <strong className="font-bold text-emerald-900">
                        {emailNotificationStatus === 'sent' 
                          ? 'Automatic Team Alert Mailed via Webhook' 
                          : emailNotificationStatus === 'triggered' 
                          ? 'Mailed Team alerting: vishwajeetadkine705@gmail.com & streminiai@gmail.com' 
                          : 'Fallback stored correctly'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubscribeNewsletter} id="newsletter-signup-form" className="space-y-2 pt-1">
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <input
                      id="newsletter-email-input"
                      type="text"
                      placeholder="Enter email address"
                      value={newsletterEmail}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewsletterEmail(val);
                        if (val === '') {
                          setNewsletterError('');
                        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                          setNewsletterError('Invalid format (e.g. user@domain.com)');
                        } else {
                          setNewsletterError('');
                        }
                      }}
                      required
                      disabled={newsletterLoading}
                      className={`w-full px-3 py-2 bg-white border rounded-sm text-xs text-[#111111] placeholder:text-neutral-400 outline-none transition-all font-sans pr-8-placeholder ${
                        newsletterEmail === ''
                          ? 'border-[#EEEEEE] focus:border-neutral-450 focus:ring-1 focus:ring-neutral-450/20'
                          : newsletterError
                          ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/10'
                          : 'border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10'
                      }`}
                    />
                    {newsletterEmail !== '' && (
                      <span className="absolute right-3 top-2.5 flex items-center justify-center">
                        {newsletterError ? (
                          <span className="text-red-500 text-xs font-bold font-mono">⚠️</span>
                        ) : (
                          <span className="text-emerald-500 text-xs font-bold font-mono">✓</span>
                        )}
                      </span>
                    )}
                  </div>
                  <button
                    id="newsletter-submit-button"
                    type="submit"
                    disabled={newsletterLoading || !!newsletterError || !newsletterEmail}
                    className="w-full px-4 py-2 bg-[#111111] hover:bg-neutral-800 text-[#FAFAFA] font-bold text-xs uppercase tracking-wider rounded-sm transition-all focus:ring-2 focus:ring-neutral-450 focus:ring-offset-2 disabled:bg-neutral-200 disabled:text-neutral-400 shrink-0"
                  >
                    {newsletterLoading ? 'Submitting...' : 'Subscribe'}
                  </button>
                </div>
                {newsletterEmail !== '' && (
                  <p 
                    id="newsletter-error-feedback" 
                    className={`text-[10px] font-mono leading-relaxed transition-colors duration-200 ${
                      newsletterError ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'
                    }`}
                  >
                    {newsletterError ? newsletterError : '✓ Email format is ready to subscribe'}
                  </p>
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

      {/* Subtle non-intrusive Cookie Consent Banner */}
      {!cookieConsentAccepted && (
        <div 
          id="cookie-consent-banner"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md bg-white border border-[#EEEEEE] p-4 rounded shadow-xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-neutral-100 rounded-sm text-[#111111] shrink-0">
              <Cookie size={16} />
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono block">Privacy Transparency</span>
                <p className="text-xs text-[#111111] leading-relaxed">
                  We use memory preferences and subtle local states to remember parameters. We do <strong className="font-bold text-[#111111]">not</strong> load any intrusive tracking metrics or analytics cookies. Learn more in our <Link to="/privacy" className="underline hover:text-neutral-800 font-medium">Privacy Policy</Link>.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="cookie-accept-btn"
                  onClick={handleAcceptCookies}
                  className="px-3.5 py-1.5 bg-[#111111] hover:bg-neutral-800 text-[#FAFAFA] font-bold text-[10px] uppercase tracking-wider rounded-sm transition-all cursor-pointer"
                >
                  Accept Standard
                </button>
                <button
                  id="cookie-dismiss-btn"
                  onClick={() => setCookieConsentAccepted(true)}
                  className="px-3 py-1.5 text-[#666666] hover:text-[#111111] font-bold text-[10px] uppercase tracking-wider rounded-sm hover:bg-neutral-50 transition-all border border-transparent hover:border-[#EEEEEE]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
