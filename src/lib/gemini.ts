const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined;

type WorkerRequest = {
  task: string;
  payload: Record<string, unknown>;
};

const ENDPOINT_SUFFIXES = ['', '/api/ai', '/api/gemini', '/ai', '/gemini'];

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function buildCandidateUrls(baseUrl: string): string[] {
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const candidates = new Set<string>();

  for (const suffix of ENDPOINT_SUFFIXES) {
    if (!suffix) {
      candidates.add(normalizedBase);
      continue;
    }

    if (normalizedBase.endsWith(suffix)) {
      candidates.add(normalizedBase);
    } else {
      candidates.add(`${normalizedBase}${suffix}`);
    }
  }

  return [...candidates];
}

async function postWorkerRequest<T>(url: string, task: string, payload: Record<string, unknown>): Promise<T> {
  const requestVariants = [
    { task, payload } satisfies WorkerRequest,
    { action: task, payload },
    { task, ...payload },
    { action: task, ...payload },
  ];

  let lastNon404Error = '';

  for (const body of requestVariants) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.status === 404) {
      continue;
    }

    const responseText = await res.text();

    if (!res.ok) {
      lastNon404Error = responseText || `HTTP ${res.status}`;
      continue;
    }

    let data: any = null;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        return responseText as T;
      }
    }

    if (data?.error) {
      throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
    }

    return (data?.result ?? data?.data ?? data) as T;
  }

  if (lastNon404Error) {
    throw new Error(lastNon404Error);
  }

  throw new Error('Not found.');
}

async function callWorker<T = any>(task: string, payload: Record<string, unknown>): Promise<T> {
  if (!WORKER_URL) {
    throw new Error('Missing VITE_WORKER_URL environment variable.');
  }

  const urls = buildCandidateUrls(WORKER_URL);
  const errors: string[] = [];

  for (const url of urls) {
    try {
      return await postWorkerRequest<T>(url, task, payload);
    } catch (error: any) {
      errors.push(`${url}: ${error?.message || String(error)}`);
    }
  }

  throw new Error(`AI worker request failed. Tried endpoints: ${errors.join(' | ')}`);
}

export async function generateBriefing(emails: any[], driveFiles: any[]) {
  return callWorker<string>('generateBriefing', { emails, driveFiles });
}

export async function summarizeThread(threadMessages: any[]) {
  return callWorker<string>('summarizeThread', { threadMessages });
}

export async function summarizeDocumentContent(content: string) {
  return callWorker<string>('summarizeDocumentContent', { content });
}

export async function rewriteDocument(content: string, tone: 'formal' | 'casual' | 'persuasive' = 'formal') {
  return callWorker<string>('rewriteDocument', { content, tone });
}

export async function askDocumentQuestion(content: string, question: string, history: { role: string, parts: { text: string }[] }[] = []) {
  return callWorker<string>('askDocumentQuestion', { content, question, history });
}

export async function draftEmailWithAI(prompt: string, context: string = '') {
  return callWorker<string>('draftEmailWithAI', { prompt, context });
}

export async function generateDatabaseSchema(description: string) {
  return callWorker('generateDatabaseSchema', { description });
}

export async function generateMeetingIntelligence(notes: any[], emails: any[]) {
  return callWorker<string>('generateMeetingIntelligence', { notes, emails });
}

export async function generateFormStructure(description: string) {
  return callWorker('generateFormStructure', { description });
}

export async function editFormStructureWithAI(currentStructure: any, prompt: string) {
  return callWorker('editFormStructureWithAI', { currentStructure, prompt });
}

export async function generatePresentationStructure(description: string) {
  return callWorker('generatePresentationStructure', { description });
}

export async function summarizePresentation(slides: any[]) {
  return callWorker<string>('summarizePresentation', { slides });
}

export async function askPresentationQuestion(slides: any[], question: string, history: any[] = []) {
  return callWorker<string>('askPresentationQuestion', { slides, question, history });
}

export async function editPresentationStructureWithAI(currentStructure: any, prompt: string) {
  return callWorker('editPresentationStructureWithAI', { currentStructure, prompt });
}
