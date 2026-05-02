// ============================================================================
//  src/lib/gemini.ts  — AI client calling the Cloudflare Worker backend
//
//  Replace WORKER_URL after running: wrangler deploy
//  e.g. https://stremini-workspace.YOUR-SUBDOMAIN.workers.dev
// ============================================================================

// ▼▼▼  REPLACE after `wrangler deploy`  ▼▼▼
const WORKER_URL = 'https://taskflow-backend.vishwajeetadkine705.workers.dev';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// ─── Client-side safety: strip any leaked K2 reasoning ────────────────────────
function stripThinking(text: string): string {
  if (!text) return '';
  // Remove fully closed blocks
  let out = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Remove everything from an unclosed <think> onward
  const idx = out.search(/<think>/i);
  if (idx !== -1) out = out.slice(0, idx);
  // Remove stray closing tags and other wrappers
  out = out.replace(/<\/think>/gi, '');
  out = out.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  out = out.replace(/<reflection>[\s\S]*?<\/reflection>/gi, '');
  out = out.replace(/<analysis>[\s\S]*?<\/analysis>/gi, '');

  // Remove preamble/meta-reasoning before structured markdown output.
  const firstSection = out.search(/^##\s/m);
  if (firstSection > 0) out = out.slice(firstSection);

  // Drop common leaked instruction lines if they still appear.
  out = out
    .split('\n')
    .filter(line => !/^\s*(the user wants|however we have no|thus we need|let'?s parse|given the constraints)/i.test(line))
    .join('\n');

  return out.trim();
}


function normalizeMeetingSynthesis(text: string): string {
  const cleaned = stripThinking(text);
  if (!cleaned) return '';

  const requiredSections = [
    'Overview',
    'Key Decisions',
    'Action Items',
    'Draft Follow-up Email',
  ];

  const escaped = requiredSections
    .map(title => title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const headingPattern = new RegExp(`^##\\s*(${escaped.join('|')})\\s*$`, 'im');
  const firstRequired = cleaned.search(headingPattern);
  const source = firstRequired >= 0 ? cleaned.slice(firstRequired) : cleaned;

  const lines = source.split('\n');
  const sectionMap = new Map<string, string[]>();
  let current: string | null = null;

  for (const line of lines) {
    const match = line.match(/^##\s*(.+?)\s*$/);
    if (match) {
      const title = match[1].trim();
      current = requiredSections.find(s => s.toLowerCase() === title.toLowerCase()) ?? null;
      if (current && !sectionMap.has(current)) sectionMap.set(current, []);
      continue;
    }
    if (current) {
      sectionMap.get(current)!.push(line);
    }
  }

  if (sectionMap.size === 0) return cleaned;

  return requiredSections
    .map(section => {
      const body = (sectionMap.get(section) ?? []).join('\n').trim();
      return `## ${section}\n${body}`.trimEnd();
    })
    .join('\n\n')
    .trim();
}

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
