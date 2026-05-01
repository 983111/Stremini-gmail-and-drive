import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateBriefing(emails: any[], driveFiles: any[]) {
  const prompt = `
    You are a professional assistant. Analyze the following unread emails and recent drive activity and generate a concise morning briefing.
    Extract any urgent tasks, follow-ups, and financial alerts. Do not make up information that is not there.
    Emails: ${JSON.stringify(emails)}
    Drive Files: ${JSON.stringify(driveFiles)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text;
}

export async function summarizeThread(threadMessages: any[]) {
  const prompt = `
    Summarize this email thread. Provide:
    1. A short summary
    2. Key decisions
    3. Action Items

    Thread data: ${JSON.stringify(threadMessages)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text;
}

export async function summarizeDocumentContent(content: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Summarize the following document and list action items / key takeaways:\n\n' + content,
  });
  return response.text;
}

export async function rewriteDocument(content: string, tone: 'formal' | 'casual' | 'persuasive' = 'formal') {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Rewrite the following text to have a ${tone} tone:\n\n${content}`,
  });
  return response.text;
}

export async function askDocumentQuestion(content: string, question: string, history: {role: string, parts: {text: string}[]}[] = []) {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: [
      {
        role: 'user',
        parts: [{ text: `You are an automated assistant helping a user with a document. Here is the document content for context:\n\n${content}` }]
      },
      {
        role: 'model',
        parts: [{ text: "Understood. I have read the document and am ready to answer any questions or follow instructions regarding it." }]
      },
      ...history
    ]
  });

  const result = await chat.sendMessage({ message: question });
  return result.text;
}

export async function draftEmailWithAI(prompt: string, context: string = '') {
  const finalPrompt = `
    You are an automated assistant helping a user write an email. 
    ${context ? `Here is the context/previous thread:\n${context}` : ''}
    
    User prompt: ${prompt}
    
    Please draft a professional, concise email. Output only the email body text, no subject line or meta-commentary, just the content that should go into the email body.
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: finalPrompt,
  });
  return response.text;
}

export async function generateDatabaseSchema(description: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `
      You are a database designer. Create a JSON object for a Notion-like database based on this description: "${description}".
      The output must contain exactly two keys: "schema" and "records".
      "schema" must be a JSON array, like: [{"key": "status", "name": "Status", "type": "select", "options": ["Todo", "Done"]}]
      Valid types are text, number, select, date, checkbox.
      "records" must be a JSON array of objects representing initial rows, exactly matching the keys in the schema, PLUS a "title" key for the main field. For example: [{"title": "Buy milk", "status": "Todo"}]
      Provide 3 to 5 realistic records.
    `,
    config: {
      responseMimeType: "application/json"
    }
  });
  return JSON.parse(response.text || '{"schema":[], "records":[]}');
}

export async function generateMeetingIntelligence(notes: any[], emails: any[]) {
  const prompt = `You are a Meeting Synthesis assistant. You are given an array of Google Drive meeting notes and an array of Gmail threads potentially related to a meeting.
  
  Notes: ${JSON.stringify(notes)}
  Emails: ${JSON.stringify(emails)}
  
  Based on this combined source, please generate:
  1. A concise overview summary of what the meeting was about.
  2. Identified Key Decisions.
  3. Action Items (who needs to do what).
  4. A draft follow-up email.
  
  Output the result using markdown, with clear sections (e.g. ## Summary, ## Key Decisions, ## Action Items, ## Draft Follow-up).`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text;
}
