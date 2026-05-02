const WORKER_URL = 'https://taskflow-backend.vishwajeetadkine705.workers.dev';

// ─── Think stripper (mirrors worker.js clean()) ───────────────────────────────
function stripThinking(text: string): string {
  if (!text) return '';
  let o = text;

  // 1. Remove all known XML reasoning wrappers
  const WRAP_TAGS = ['think','thinking','thought','reasoning','reason',
                     'reflection','reflect','analysis','scratchpad','cot'];
  for (const t of WRAP_TAGS) {
    o = o.replace(new RegExp(`<${t}>[\\s\\S]*?<\\/${t}>`, 'gi'), '');
    const idx = o.search(new RegExp(`<${t}>`, 'i'));
    if (idx !== -1) o = o.slice(0, idx);
    o = o.replace(new RegExp(`<\\/${t}>`, 'gi'), '');
  }

  // 2. Bare unclosed </think> — keep only what comes after
  if (o.includes('</think>')) o = o.split('</think>').pop() ?? o;

  // 3. Strip markdown-fenced reasoning blocks
  o = o.replace(/```(?:think(?:ing)?|reason(?:ing)?|reflect(?:ion)?|analysis|scratchpad)[\s\S]*?```/gi, '');

  // 4. Slice off untagged reasoning preambles
  const ANSWER_START = [
    /^##?\s+\w/,
    /^(hi|hello|dear|hey|greetings)[,\s]/i,
    /^\s*[{\[]/,
    /^(thank(s| you)|please|following|as per|i hope)/i,
    /^[-*]\s+\*{0,2}\w/,
    /^\d+\.\s+\w/,
  ];
  const REASONING_LINE = [
    /\bwe (must|need to|have to|should|can|cannot|could)\b/i,
    /\bthe user (says|wants|asked|said|is asking)\b/i,
    /\b(thus|so) (produce|we|the|a|an|start)\b/i,
    /\b(given|based on) the (context|data|emails|above)\b/i,
    /\b(possibly|likely|probably) (the|we|they|this)\b/i,
    /\blet'?s (parse|examine|look|check|see|start|begin)\b/i,
    /\b(now|next|first|second|third)[,]? (we|let|the|i)\b/i,
    /\binfer\b/i,
    /\bproduce (a|an|the|something|output)\b/i,
  ];

  const lines = o.split('\n');
  let answerStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const isReasoning = REASONING_LINE.some(r => r.test(line));
    const isAnswer    = ANSWER_START.some(r => r.test(line));
    if (isAnswer && !isReasoning) { answerStart = i; break; }
  }
  if (answerStart > 0) o = lines.slice(answerStart).join('\n');

  return o.trim();
}

// ─── Meeting synthesis normalizer ─────────────────────────────────────────────
// Ensures all 4 required sections exist and tables render correctly.
function normalizeMeetingSynthesis(text: string): string {
  const cleaned = stripThinking(text);
  if (!cleaned) return '';

  const REQUIRED = ['Overview', 'Key Decisions', 'Action Items', 'Draft Follow-up Email'];

  // Find where the first required section starts
  const escaped = REQUIRED.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const headingPat = new RegExp(`^##\\s*(${escaped.join('|')})\\s*$`, 'im');
  const firstIdx = cleaned.search(headingPat);
  const source = firstIdx >= 0 ? cleaned.slice(firstIdx) : cleaned;

  // Parse into section map — keep multi-line content including table rows
  const sectionMap = new Map<string, string[]>();
  let current: string | null = null;

  for (const line of source.split('\n')) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      const title = REQUIRED.find(s => s.toLowerCase() === m[1].trim().toLowerCase()) ?? null;
      current = title;
      if (current && !sectionMap.has(current)) sectionMap.set(current, []);
      continue;
    }
    if (current) sectionMap.get(current)!.push(line);
  }

  // If we got nothing useful, return cleaned text as-is
  if (sectionMap.size === 0) return cleaned;

  // Build fallback table rows for missing sections
  const fallbackTables: Record<string, string> = {
    'Key Decisions': `| Decision | Owner | Status |\n|---|---|---|\n| No decisions recorded | — | — |`,
    'Action Items':  `| Task | Owner | Due Date | Priority |\n|---|---|---|---|\n| No action items recorded | — | — | — |`,
  };

  return REQUIRED.map(section => {
    const body = (sectionMap.get(section) ?? []).join('\n').trim();
    const content = body.length > 0 ? body : (fallbackTables[section] ?? '*No data available.*');
    return `## ${section}\n\n${content}`;
  }).join('\n\n').trim();
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────
async function post<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`${WORKER_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Worker error ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json as T;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function generateBriefing(emails: any[], driveFiles: any[]): Promise<string> {
  const data = await post<{ briefing: string }>('/api/briefing', { emails, driveFiles });
  return stripThinking(data.briefing ?? '');
}

export async function summarizeThread(threadMessages: any[]): Promise<string> {
  const data = await post<{ summary: string }>('/api/summarise/thread', { threadMessages });
  return stripThinking(data.summary ?? '');
}

export async function summarizeDocumentContent(content: string): Promise<string> {
  const data = await post<{ summary: string }>('/api/summarise/doc', { content });
  return stripThinking(data.summary ?? '');
}

export async function rewriteDocument(
  content: string,
  tone: 'formal' | 'casual' | 'persuasive' = 'formal'
): Promise<string> {
  const data = await post<{ rewritten: string }>('/api/rewrite/doc', { content, tone });
  return stripThinking(data.rewritten ?? '');
}

export async function askDocumentQuestion(
  content: string,
  question: string,
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<string> {
  const data = await post<{ answer: string }>('/api/ask/doc', { content, question, history });
  return stripThinking(data.answer ?? '');
}

export async function draftEmailWithAI(prompt: string, context: string = ''): Promise<string> {
  const data = await post<{ draft: string }>('/api/draft/email', { prompt, context });
  return stripThinking(data.draft ?? '');
}

export async function generateDatabaseSchema(description: string): Promise<{
  databaseTitle: string;
  columns: any[];
  rows: any[];
}> {
  const data = await post<{ databaseTitle: string; columns: any[]; rows: any[] }>(
    '/api/database/generate',
    { description }
  );
  return {
    databaseTitle: data.databaseTitle ?? 'Database',
    columns:       data.columns       ?? [],
    rows:          data.rows          ?? [],
  };
}

export async function generateMeetingIntelligence(notes: any[], emails: any[]): Promise<string> {
  const data = await post<{ synthesis: string }>('/api/meeting', { notes, emails });
  return normalizeMeetingSynthesis(data.synthesis ?? '');
}
