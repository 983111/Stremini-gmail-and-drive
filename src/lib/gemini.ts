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

export async function generateFormStructure(description: string) {
  const prompt = `
    You are a professional form designer. Create a detailed Google Form structure in JSON format based on the user's request: "${description}".
    
    STRICT GUIDELINES:
    1. RETURN ONLY JSON.
    2. The structure should include a title, description, and an array of items.
    3. THE DEFAULT DESCRIPTION SHOULD BE: "Please fill out this form to help us understand your needs better." unless the user specifies otherwise in their request.
    4. Each item should have a title, and a question definition.
    5. Support types: TEXT (paragraph), CHOICE (multiple choice), CHECKBOX (checkboxes), SCALE (linear scale).
    
    OUTPUT STRUCTURE:
    {
      "title": "Form Title",
      "description": "Form Description",
      "items": [
        {
          "title": "Question Text",
          "type": "TEXT" | "CHOICE" | "CHECKBOX" | "SCALE",
          "options": ["Option 1", "Option 2"] (only for CHOICE and CHECKBOX),
          "required": true | false
        }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return { title: "Error", description: "Failed to generate form", items: [] };
  }
}

export async function editFormStructureWithAI(currentStructure: any, prompt: string) {
  const instruction = `
    You are a professional form designer. I will give you an existing Google Form structure in JSON and an edit request.
    Your job is to apply the requested edits and return the updated JSON structure.
    
    STRICT GUIDELINES:
    1. RETURN ONLY JSON.
    2. Maintain the structure: { "title": string, "description": string, "items": array }.
    3. Modify existing items or add new ones based ONLY on the user's request. Keep everything else intact.
    4. Keep the "id" properties for existing items if they exist. Generate a short string id for any newly added items.
    
    CURRENT STRUCTURE:
    ${JSON.stringify(currentStructure)}
    
    EDIT REQUEST:
    ${prompt}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: instruction,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return currentStructure;
  }
}

export async function generatePresentationStructure(description: string) {
  const prompt = `
    You are a professional principal consultant at a top-tier global strategy firm (MBB style).
    Create a highly professional, detailed, and visually consistent Google Slides structure for: "${description}".
    
    STRICT CONTENT GUIDELINES:
    1. RETURN ONLY JSON.
    2. DEPTH: Provide substantial, insight-driven content. Every bullet point must be a complete thought (15-25 words). No generic phrases like "Increased efficiency". Use "Optimize operational workflows through AI-driven automation to reduce overhead by 15-20%".
    3. NARRATIVE: The deck must follow a professional story arc (e.g., Executive Summary -> Problem Statement -> Market Analysis -> Solution -> Strategic Roadmap -> Financial Impact).
    4. INTELLIGENT LAYOUTS:
       - TITLE: Impactful opening.
       - TITLE_AND_BODY: Rich content slide.
       - MAIN_POINT: High-impact single statement.
       - MARKET_ANALYSIS: Two-column specialized layout for data-heavy strategic insights.
    5. VISUALS: Provide an extremely detailed "imagePrompt" for EVERY slide that describes a high-end, minimalistic, professional visual.
    6. THEMING: Suggest a "primaryColor" (hex) and a "secondaryColor" (hex) that matches the brand or topic context.
    
    OUTPUT STRUCTURE:
    {
      "title": "Professional Presentation Title",
      "theme": {
        "primaryColor": "#1a365d",
        "secondaryColor": "#2b6cb0",
        "accentColor": "#ed8936"
      },
      "slides": [
        {
          "title": "Strategic Slide Title",
          "content": ["Complex Insight 1...", "Complex Insight 2...", "Complex Insight 3...", "Complex Insight 4..."],
          "layout": "TITLE_AND_BODY" | "TITLE" | "MAIN_POINT" | "MARKET_ANALYSIS",
          "imagePrompt": "Detailed aesthetic description..."
        }
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return { title: "Error", slides: [] };
  }
}

export async function summarizePresentation(slides: any[]) {
  const prompt = `
    You are an executive assistant. Summarize the following presentation deck and provide key takeaways.
    Keep it professional and concise.
    
    DECK CONTENT:
    ${JSON.stringify(slides)}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
}

export async function askPresentationQuestion(slides: any[], question: string, history: any[] = []) {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: [
      {
        role: 'user',
        parts: [{ text: `You are an expert on this presentation deck. Here is the deck data for your reference:\n\n${JSON.stringify(slides)}` }]
      },
      {
        role: 'model',
        parts: [{ text: "I have analyzed the presentation deck. I am ready to answer any questions or provide specific insights based on its content." }]
      },
      ...history
    ]
  });

  const result = await chat.sendMessage({ message: question });
  return result.text;
}

export async function editPresentationStructureWithAI(currentStructure: any, prompt: string) {
  const instruction = `
    You are a professional presentation designer at a top-tier consulting firm.
    I will give you an existing Google Slides structure in JSON and an edit request.
    
    STRICT GUIDELINES:
    1. RETURN ONLY JSON.
    2. DEPTH: Maintain high content density in any added or modified slides.
    3. Maintain the integrity of the JSON structure.
    4. Suggest a themes updates if requested.
    
    CURRENT STRUCTURE:
    ${JSON.stringify(currentStructure)}
    
    EDIT REQUEST:
    ${prompt}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: instruction,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return currentStructure;
  }
}
