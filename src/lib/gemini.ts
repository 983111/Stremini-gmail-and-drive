const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined;

type WorkerRequest = {
  task: string;
  payload: Record<string, unknown>;
};

async function callWorker<T = any>(task: string, payload: Record<string, unknown>): Promise<T> {
  if (!WORKER_URL) {
    throw new Error('Missing VITE_WORKER_URL environment variable.');
  }

  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ task, payload } satisfies WorkerRequest),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`AI worker request failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return (data?.result ?? data) as T;
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

export async function askDocumentQuestion(content: string, question: string, history: {role: string, parts: {text: string}[]}[] = []) {
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
