const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined;

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function buildUrl(path: string): string {
  if (!WORKER_URL) {
    throw new Error('Missing VITE_WORKER_URL environment variable.');
  }

  const base = normalizeBaseUrl(WORKER_URL);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

async function postJson<T = any>(path: string, payload: Record<string, unknown>): Promise<T> {
  const url = buildUrl(path);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();

  if (!res.ok) {
    let message = responseText || `HTTP ${res.status}`;
    try {
      const parsed = responseText ? JSON.parse(responseText) : null;
      if (parsed?.error) message = parsed.error;
    } catch {
      // keep responseText as-is
    }
    throw new Error(`${path} failed (${res.status}): ${message}`);
  }

  if (!responseText) return {} as T;

  try {
    const parsed = JSON.parse(responseText);
    if (parsed?.error) {
      throw new Error(typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error));
    }
    return parsed as T;
  } catch {
    return responseText as T;
  }
}

export async function generateBriefing(emails: any[], driveFiles: any[]) {
  const data = await postJson<{ briefing: string }>('/api/briefing', { emails, driveFiles });
  return data.briefing;
}

export async function summarizeThread(threadMessages: any[]) {
  const data = await postJson<{ summary: string }>('/api/summarise/thread', { threadMessages });
  return data.summary;
}

export async function summarizeDocumentContent(content: string) {
  const data = await postJson<{ summary: string }>('/api/summarise/doc', { content });
  return data.summary;
}

export async function rewriteDocument(content: string, tone: 'formal' | 'casual' | 'persuasive' = 'formal') {
  const data = await postJson<{ rewritten: string }>('/api/rewrite/doc', { content, tone });
  return data.rewritten;
}

export async function askDocumentQuestion(content: string, question: string, history: { role: string, parts: { text: string }[] }[] = []) {
  const data = await postJson<{ answer: string }>('/api/ask/doc', { content, question, history });
  return data.answer;
}

export async function draftEmailWithAI(prompt: string, context: string = '') {
  const data = await postJson<{ draft: string }>('/api/draft/email', { prompt, context });
  return data.draft;
}

export async function generateDatabaseSchema(description: string) {
  return postJson('/api/database/generate', { description });
}

export async function generateMeetingIntelligence(notes: any[], emails: any[]) {
  const data = await postJson<{ synthesis: string }>('/api/meeting', { notes, emails });
  return data.synthesis;
}

export async function generateFormStructure(description: string) {
  return postJson('/api/form/generate', { description });
}

export async function editFormStructureWithAI(currentStructure: any, prompt: string) {
  return postJson('/api/form/edit', { currentStructure, prompt });
}

export async function generatePresentationStructure(description: string) {
  return postJson('/api/slides/generate', { description });
}

export async function summarizePresentation(slides: any[]) {
  const data = await postJson<{ summary: string }>('/api/slides/summarise', { slides });
  return data.summary;
}

export async function askPresentationQuestion(slides: any[], question: string, history: any[] = []) {
  const data = await postJson<{ answer: string }>('/api/slides/ask', { slides, question, history });
  return data.answer;
}

export async function editPresentationStructureWithAI(currentStructure: any, prompt: string) {
  return postJson('/api/slides/edit', { currentStructure, prompt });
}
