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
  const prompt = `
    You are a professional product manager and database architect.
    Your goal is to design a fully structured, detailed database system in JSON format based on the user's prompt: "${description}".

    STRICT GUIDELINES:
    1. UNDERSTAND INTENT: Think like a human expert. For a "diet plan", include timings, meal types, and nutrition. For a "startup tracker", include task owners, priorities, and deadlines.
    2. SMART DESIGN: Dynamically decide the best column structure for the specific use case.
    3. DEPTH & DETAIL: Provide at least 15-20 rows of highly realistic, varied, and detailed data. No generic placeholders like "Item 1".
    4. PREMIUM TONE: No emojis. Use professional, clean naming for columns (e.g., "Maturity Level" instead of "Growth").
    5. LOGICAL CONSISTENCY: Ensure internal logic. If it's a schedule, ensure times follow a sensible sequence. If it's a tracker, ensure status and priorities make sense relative to each other.
    6. NO EXPLANATIONS: Return ONLY the JSON object.

    OUTPUT STRUCTURE:
    {
      "databaseTitle": "A professional title for the database",
      "columns": [
        { "key": "string", "name": "string", "type": "text | number | date | select | checkbox", "options": ["option1", "option2"] (only for select) }
      ],
      "rows": [
        { "columnKey": "value", ... }
      ]
    }

    Note: The first column should always be the primary "title" or "name" field.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return data;
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return { databaseTitle: "Error", columns: [], rows: [] };
  }
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
