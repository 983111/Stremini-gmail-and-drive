import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateBriefing(emails: any[], driveFiles: any[]) {
  const prompt = `
    You are a daily briefing AI. Analyze the following unread emails and recent drive activity and generate a concise morning briefing.
    Extract any urgent tasks, follow-ups, and financial alerts. Do not make up information that is not there.
    Emails: ${JSON.stringify(emails)}
    Drive Files: ${JSON.stringify(driveFiles)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text;
}

export async function summarizeDocumentContent(content: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: 'Summarize the following document and list action items / key takeaways:\n\n' + content,
  });
  return response.text;
}

export async function rewriteDocument(content: string, tone: 'formal' | 'casual' | 'persuasive' = 'formal') {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
        parts: [{ text: `You are an AI assistant helping a user with a document. Here is the document content for context:\n\n${content}` }]
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
    You are an AI assistant helping a user write an email. 
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

export async function generateDatabaseRecords(description: string, schema: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      You are a data architect. Generate a JSON array of 5 initial records for a database based on this schema: ${schema}.
      The description of the data is: "${description}".
      Follow the types strictly (text, number, select, date, checkbox).
      The output must be a pure JSON array of objects where keys match the field names in the schema.
      Example: [{"Task": "Complete report", "Status": "To Do", "Priority": "High"}]
    `,
  });

  try {
    const text = response.text.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI records:", e);
    return [];
  }
}
export async function generateDatabaseSchema(description: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      You are a database designer. Create a JSON schema array for a Notion-like database based on this description: "${description}".
      The output must be pure JSON array, like: [{"name": "Task", "type": "text"}, {"name": "Status", "type": "select"}]
      Valid types are text, number, select, date, checkbox.
    `,
    config: {
      responseMimeType: "application/json"
    }
  });
  return JSON.parse(response.text || '[]');
}

export async function generateMeetingIntelligence(notes: any[], emails: any[]) {
  const prompt = `You are a Meeting Intelligence assistant. You are given an array of Google Drive meeting notes and an array of Gmail threads potentially related to a meeting.
  
  Notes: ${JSON.stringify(notes)}
  Emails: ${JSON.stringify(emails)}
  
  Based on this combined source, please generate:
  1. A concise overview summary of what the meeting was about.
  2. Identified Key Decisions.
  3. Action Items (who needs to do what).
  4. A draft follow-up email.
  
  Output the result using markdown, with clear sections (e.g. ## Summary, ## Key Decisions, ## Action Items, ## Draft Follow-up).`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text;
}
