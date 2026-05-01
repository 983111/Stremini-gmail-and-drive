// ============================================================================
//  src/lib/ai.ts
//  AI client — calls the deployed Cloudflare Worker backend.
//
//  After deploying worker-stremini.js with `wrangler deploy`, replace the
//  placeholder below with your real Worker URL.
//
//  Example: https://stremini-workspace.YOUR-SUBDOMAIN.workers.dev
// ============================================================================

// ▼▼▼  REPLACE THIS with your deployed Worker URL after running `wrangler deploy`  ▼▼▼
const WORKER_URL = 'https://taskflow-backend.vishwajeetadkine705.workers.dev';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

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

// ─── Briefing ─────────────────────────────────────────────────────────────────
export async function generateBriefing(emails: any[], driveFiles: any[]): Promise<string> {
  const data = await post<{ briefing: string }>('/api/briefing', { emails, driveFiles });
  return data.briefing ?? '';
}

// ─── Email thread summary ─────────────────────────────────────────────────────
export async function summarizeThread(threadMessages: any[]): Promise<string> {
  const data = await post<{ summary: string }>('/api/summarise/thread', { threadMessages });
  return data.summary ?? '';
}

// ─── Document summary ─────────────────────────────────────────────────────────
export async function summarizeDocumentContent(content: string): Promise<string> {
  const data = await post<{ summary: string }>('/api/summarise/doc', { content });
  return data.summary ?? '';
}

// ─── Document rewrite ─────────────────────────────────────────────────────────
export async function rewriteDocument(
  content: string,
  tone: 'formal' | 'casual' | 'persuasive' = 'formal'
): Promise<string> {
  const data = await post<{ rewritten: string }>('/api/rewrite/doc', { content, tone });
  return data.rewritten ?? '';
}

// ─── Document Q&A ─────────────────────────────────────────────────────────────
export async function askDocumentQuestion(
  content: string,
  question: string,
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<string> {
  const data = await post<{ answer: string }>('/api/ask/doc', { content, question, history });
  return data.answer ?? '';
}

// ─── Email drafting ───────────────────────────────────────────────────────────
export async function draftEmailWithAI(prompt: string, context: string = ''): Promise<string> {
  const data = await post<{ draft: string }>('/api/draft/email', { prompt, context });
  return data.draft ?? '';
}

// ─── Database schema generation ───────────────────────────────────────────────
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

// ─── Meeting intelligence ─────────────────────────────────────────────────────
export async function generateMeetingIntelligence(notes: any[], emails: any[]): Promise<string> {
  const data = await post<{ synthesis: string }>('/api/meeting', { notes, emails });
  return data.synthesis ?? '';
}
