import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  Mail, 
  ArrowRight, 
  BookOpen, 
  Share2, 
  ChevronRight,
  Sparkles,
  Search,
  LayoutGrid
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  role: string;
  date: string;
  readTime: string;
  category: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: "orchestrating-workspace-intelligence",
    title: "Orchestrating Workspace Intelligence without Relying on Complex Frameworks",
    excerpt: "Discover how client-side models can synchronize with real-time Google API endpoints to optimize database commands.",
    content: `
At modern tech firms, managing vast directories of spreadsheets, slides, and correspondence requires consistent coordination. Traditionally, workflows were constrained to static scripts. By introducing flexible cognitive layout models, we can orchestrate these components into adaptive nodes of an intelligent system.

## Resolving the Fragile Setup Problem

Many software systems depend on brittle background scripts that fail silently the moment a layout structure modifies. When a team updates a user response form, existing scripts break, resulting in incorrect fields being pushed into analytical dashboards. 

By applying language intelligence models directly to Google Forms schemas, we can unify collected response fields dynamically into aligned database columns without brittle hardcoding. This shift replaces fragile triggers with adaptive understanding.

## Dynamic Database Generation on Demand

Instead of relying on rigid, pre-constructed database frameworks, modern workspaces can design relational database structures instantly from simple natural prompts:

1. **Intelligent Mapping**: Translating form structures, email files, and sheets with structural semantics.
2. **Context-Preserved Synthesizers**: Syncing multiple input matrices inside an optimized memory space before saving them.
3. **Transparent Execution**: Carrying out operations on the client-side using direct user credentials to guarantee strict data safety.

By keeping the orchestration pipeline local, businesses completely bypass the legal liability and latency overhead of external cloud databases.

## Next-Generation Workspace Synergy

Synchronizing your tools reduces operational overhead and enhances product delivery. Creating slides from document structures, analyzing form responses, and compiling reports should not feel like manual data entry. With elite cognitive engines operating on direct APIs, you command your assets effortlessly.

Learn more about managing these capabilities locally inside the Stremini dashboard! For feedback, questions, or architectural inquiries, reach out to our team at streminiai@gmail.com.
    `,
    author: "Elena Vance",
    role: "Director of Cognitive Systems",
    date: "May 24, 2026",
    readTime: "5 min read",
    category: "Architecture"
  },
  {
    id: "rise-of-cognitive-workflows",
    title: "The Rise of Cognitive Workflows: Replacing Static Automation with Intelligent Synergy",
    excerpt: "Static task chains are too fragile for fluid work environments. Explore how intelligent context syncing elevates performance.",
    content: `
Static step list software works perfectly—until a file name changes, an email subject shifts, or an unexpected response option is introduced to a database. The moment a structured model meets real-world fluidity, static triggers fail.

## Why Rigid Automations Fail

Rigid tools follow single-branch paths. They assume absolute structure. If you configure a rule that says "If mail subject contains 'Invoice', copy file to Drive", a vendor typing "Invoicing Report" skips the rule entirely.

Cognitive workflows, by contrast, rely on contextual semantic routing. Instead of hardcoded keyword matches, semantic intelligence models evaluate the intent of the data structure. They understand that a "Bill of Lading" or a "Remittance File" belongs in your Financial Drive repository, even without direct keywords.

## Three Pillars of Workspace Synergy

To establish real workspace synergy, focus on three primary architectural requirements:

### I. Comprehensive Context Synchronization
A workspace tool is only as clever as the context it access. Elevate operations by connecting Gmail threads, Google Drive directories, and active databases into an aggregated layout state.

### II. Fluid Command Interfaces
Minimize complex settings. Allow workspace coordinators to align slides, sync documents, or evaluate responses from simple, natural commands.

### III. Zero-Snooping Compliance
Data residency is a critical business priority. True workspace tools must perform translation and cognitive analysis directly inside the client context without sending sensitive customer databases to unauthorized servers.

## Moving Toward Tomorrow

Creating an integrated workspace where form answers synthesize into smart actions and drafts are generated with continuous context represents the future of professional work. Explore these tools safely on Stremini. For support and alignment, write to streminiai@gmail.com.
    `,
    author: "Marcus Aurel",
    role: "Lead Workspace Strategist",
    date: "May 18, 2026",
    readTime: "4 min read",
    category: "Insights"
  },
  {
    id: "minimizing-regulatory-risks-for-google-oauth-apps",
    title: "Minimizing Regulatory Liability and Compliance Risk for Google OAuth Applications",
    excerpt: "A deep dive into building secure, private, non-custodial apps that handle Google Forms, Gmail, and Drive APIs safely.",
    content: `
Deploying applications that interface with Google APIs (e.g. Gmail, Google Drive, and Google Forms) requires strict attention to user security, privacy disclosures, and structural data protection guidelines. One wrong turn can expose an app to significant regulatory risk.

## Embracing Non-Custodial Architecture

The safest way to protect both your application and your customers is simple: **do not keep their data.**

Traditional software architectures route API responses through external database servers to format them, analyze them, and store backups. This turns the application owner into a data custodian, imposing high audit compliance overhead and introducing legal liability should a breach occur.

#### The Client-Side Advantage
By constructing a non-custodial framework (where tokens, schemas, and credentials remain in-memory inside the client's browser), you drastically minimize variables:

1. **Direct Transport**: Access tokens communicate directly with official Google APIs.
2. **Local Processing**: Synthesis models (like Google Gemini) receive data through secure local proxies, returning answers directly to the user view.
3. **No Latent Cache**: Closing the browser window destroys sensitive session data completely.

## Explicit Visibility is Compliance Only

User trust is built on radical transparency. When planning an OAuth workspace application:

- **State the boundaries distinctly**: Tell the user why every scope is required.
- **Maintain clear contact points**: Provide readable, active communication channels (contact stream: streminiai@gmail.com).
- **Incorporate proper liability disclaimers**: Formulate clear terms describing that services are offered "As-Is", ensuring security parameters are clearly established.

By adopting protective design frameworks early, builders can focus purely on providing elite workspace intelligence safely.
    `,
    author: "Sarah Jenkins, Esq.",
    role: "Privacy Operations Council",
    date: "May 12, 2026",
    readTime: "7 min read",
    category: "Compliance"
  }
];

export function Blog() {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedPost = BLOG_POSTS.find(p => p.id === selectedPostId);

  const filteredPosts = BLOG_POSTS.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] font-sans selection:bg-[#E5E5E5] flex flex-col justify-between">
      {/* Blog Nav Header */}
      <header className="border-b border-[#EEEEEE] bg-[#FAFAFA]/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-[#111111]">
            <div className="w-8 h-8 rounded-sm bg-[#111111] flex items-center justify-center">
              <LayoutGrid size={15} className="text-[#FAFAFA]" />
            </div>
            <span className="font-bold text-sm tracking-tight">Stremini Workspace</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/" className="text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] transition-colors">Workspace App</Link>
            <a href="mailto:streminiai@gmail.com" className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors flex items-center gap-1">
              <Mail size={12} />
              <span className="hidden sm:inline">Support</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-8 py-12 md:py-20">
        {selectedPost ? (
          /* Single Article Read Mode */
          <article className="space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Back Button */}
            <div>
              <button 
                onClick={() => setSelectedPostId(null)}
                className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] bg-white border border-[#EEEEEE] px-4 py-2 rounded-sm transition-all"
              >
                <ArrowLeft size={12} />
                <span>Back to Intelligence Feed</span>
              </button>
            </div>

            {/* Post Meta */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 tracking-wider uppercase font-mono ring-1 ring-indigo-100">
                {selectedPost.category}
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#111111] leading-[1.15]">
                {selectedPost.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-xs text-[#666666] pt-2 border-b border-t border-[#EEEEEE] py-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-neutral-700 uppercase">
                    {selectedPost.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-[#111111]">{selectedPost.author}</div>
                    <div className="text-[10px] opacity-85">{selectedPost.role}</div>
                  </div>
                </div>

                <div className="h-6 w-px bg-neutral-200 hidden sm:block"></div>

                <div className="flex items-center space-x-4">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Calendar size={12} />
                    {selectedPost.date}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock size={12} />
                    {selectedPost.readTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Post Content Body */}
            <div className="prose prose-neutral max-w-none text-[#333333] prose-headings:text-neutral-900 prose-headings:font-extrabold prose-p:leading-relaxed prose-li:text-xs">
              {selectedPost.content.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('## ')) {
                  return <h2 key={idx} className="text-xl sm:text-2xl font-black text-[#111111] mt-8 mb-4 border-b border-neutral-100 pb-2 uppercase tracking-tight">{paragraph.replace('## ', '')}</h2>;
                }
                if (paragraph.startsWith('### ')) {
                  return <h3 key={idx} className="text-base sm:text-lg font-bold text-[#111111] mt-6 mb-3 italic">{paragraph.replace('### ', '')}</h3>;
                }
                if (paragraph.startsWith('#### ')) {
                  return <h4 key={idx} className="text-sm font-extrabold text-[#111111] mt-4 mb-2 uppercase tracking-wider">{paragraph.replace('#### ', '')}</h4>;
                }
                if (paragraph.startsWith('- ')) {
                  return (
                    <ul key={idx} className="list-disc pl-5 my-3 space-y-1.5 text-xs text-[#444444]">
                      {paragraph.split('\n').map((li, lIdx) => (
                        <li key={lIdx}>{li.replace('- ', '')}</li>
                      ))}
                    </ul>
                  );
                }
                if (paragraph.trim().startsWith('1. ') || paragraph.trim().startsWith('2. ') || paragraph.trim().startsWith('3. ')) {
                  return (
                    <ol key={idx} className="list-decimal pl-5 my-4 space-y-2 text-xs text-[#444444]">
                      {paragraph.split('\n').map((li, lIdx) => (
                        <li key={lIdx}>{li.substring(3)}</li>
                      ))}
                    </ol>
                  );
                }
                return <p key={idx} className="leading-relaxed text-sm mb-4 whitespace-pre-wrap">{paragraph.trim()}</p>;
              })}
            </div>

            {/* Bottom Support Footer */}
            <div className="p-6 bg-[#FAFAFA] border border-[#EEEEEE] rounded-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 mt-12">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase text-[#111111]">Questions About this Article?</h4>
                <p className="text-[11px] text-[#666666]">Connect directly with our operations team and authors.</p>
              </div>
              <a 
                href="mailto:streminiai@gmail.com" 
                className="inline-flex items-center space-x-2 text-indigo-700 hover:text-indigo-900 text-xs font-bold uppercase tracking-wider bg-white border border-[#EEEEEE] px-4 py-2 rounded-sm transition-all"
              >
                <Mail size={12} />
                <span>streminiai@gmail.com</span>
              </a>
            </div>
          </article>
        ) : (
          /* Blog Grid List Mode */
          <div className="space-y-16 animate-in fade-in duration-200">
            {/* Title */}
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <div className="inline-flex items-center space-x-1.5 bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-full">
                <BookOpen size={11} className="text-neutral-600" />
                <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest font-mono">Workspace Intellect Feed</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111111]">
                Intelligence Blog
              </h1>
              <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
                Engineering insights, structural compliance guidelines, and workspace orchestration methodologies designed for elite operational teams.
              </p>
            </div>

            {/* Search Filter input */}
            <div className="max-w-md mx-auto relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Filter articles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#EEEEEE] rounded-sm text-xs text-[#111111] outline-none focus:border-[#CCCCCC] transition-colors"
              />
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
              {filteredPosts.map(post => (
                <div 
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  className="bg-white border border-[#EEEEEE] rounded-sm p-6 space-y-4 hover:border-[#CCCCCC] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-indigo-700 font-mono tracking-widest uppercase">
                        {post.category}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {post.readTime}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold tracking-tight text-[#111111] line-clamp-2 hover:text-[#222222]">
                      {post.title}
                    </h3>

                    <p className="text-xs text-[#666666] leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#FAFAFA] flex justify-between items-center text-[10px] text-[#888888]">
                    <span>By {post.author}</span>
                    <span className="font-extrabold uppercase text-[#111111] flex items-center space-x-1 group">
                      <span>Read More</span>
                      <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              ))}

              {filteredPosts.length === 0 && (
                <div className="p-12 text-center col-span-2 text-neutral-500 bg-neutral-50 border border-dashed border-[#EEEEEE] rounded">
                  No matching posts found. Try another query.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer support call card */}
      <footer className="bg-white border-t border-[#EEEEEE] py-12 text-[#888888] text-xs">
        <div className="max-w-5xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-6 font-mono text-[11px]">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-bold text-[#111111]">Stremini Workspace Intellect Blog</p>
            <p>© 2026 Stremini Workspace.</p>
          </div>
          <div className="flex items-center space-x-3">
            <span>Support:</span>
            <a href="mailto:streminiai@gmail.com" className="text-indigo-600 hover:underline">streminiai@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
