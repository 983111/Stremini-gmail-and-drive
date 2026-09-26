export async function fetchRecentEmails(accessToken: string, query = '') {
  const qStr = query ? `&q=${encodeURIComponent(query)}` : '';
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100${qStr}`;
  let data;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gmail fetch error:", errorText);
      if (errorText.includes('API has not been used') || errorText.includes('forbidden')) {
        throw new Error(`Gmail API is not enabled in your Google Cloud Project. Please enable it in the GCP console and try logging in again.`);
      }
      throw new Error(`Failed to fetch Gmail: ${res.status} ${res.statusText}`);
    }
    data = await res.json();
  } catch (e: any) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Network error or CORS issue. If you are in a preview iframe, try opening the app in a new tab.');
    }
    throw e;
  }
  if (!data.messages) return [];
  
  // Fetch details for each message in batches to avoid 429 Too Many Requests
  const messages = [];
  for (let i = 0; i < data.messages.length; i += 10) {
    const batch = data.messages.slice(i, i + 10);
    const batchResults = await Promise.all(batch.map(async (m: any) => {
      try {
        const mRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!mRes.ok) {
           console.warn(`Failed to fetch details for message ${m.id}: ${mRes.status}`);
           return null;
        }
        return await mRes.json();
      } catch (e) {
        console.error(`Error fetching message ${m.id}:`, e);
        return null;
      }
    }));
    messages.push(...batchResults.filter(Boolean));
  }
  return messages.map((m: any) => ({
    id: m.id,
    snippet: m.snippet,
    subject: m.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject',
    from: m.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown sender',
    date: m.payload?.headers?.find((h: any) => h.name === 'Date')?.value || 'Unknown date'
  }));
}

export async function fetchEmailThread(accessToken: string, threadId: string) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch Thread: ${res.status} ${text}`);
    }
    return await res.json();
  } catch (e: any) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Network error or CORS issue. If you are in a preview iframe, try opening the app in a new tab.');
    }
    throw e;
  }
}

export async function uploadDriveFile(accessToken: string, file: File, parentId: string = 'root') {
  const metadata = {
    name: file.name,
    parents: [parentId]
  };

  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  try {
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: formData
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to upload file: ${res.status} ${text}`);
    }
    return await res.json();
  } catch (e: any) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Network error or CORS issue. If you are in a preview iframe, try opening the app in a new tab.');
    }
    throw e;
  }
}

export async function createDriveFolder(accessToken: string, name: string, parentId: string = 'root') {
  const metadata = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId]
  };
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create folder: ${res.status} ${text}`);
    }
    return await res.json();
  } catch (e: any) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Network error or CORS issue. If you are in a preview iframe, try opening the app in a new tab.');
    }
    throw e;
  }
}

export async function deleteDriveFile(accessToken: string, fileId: string) {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to delete file: ${res.status} ${text}`);
    }
    return true;
  } catch (e: any) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Network error or CORS issue. If you are in a preview iframe, try opening the app in a new tab.');
    }
    throw e;
  }
}

export async function fetchRecentDriveFiles(accessToken: string, query = '', orderBy = 'modifiedTime desc') {
  const qStr = query ? `&q=${encodeURIComponent(query)}` : '';
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=100&orderBy=${encodeURIComponent(orderBy)}&fields=files(id,name,mimeType,modifiedTime,createdTime,webViewLink,owners,size)${qStr}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Drive fetch error:", errorText);
      if (errorText.includes('API has not been used') || errorText.includes('forbidden')) {
         throw new Error(`Google Drive API is not enabled in your Google Cloud Project. Please enable it in the GCP console and try logging in again.`);
      }
      throw new Error(`Failed to fetch Drive: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data.files || [];
  } catch (e: any) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Network error or CORS issue. If you are in a preview iframe, try opening the app in a new tab.');
    }
    throw e;
  }
}

export async function sendEmail(accessToken: string, to: string, subject: string, body: string, attachments: {name: string, mimeType: string, content: string}[] = []) {
  const boundary = 'foo_bar_baz_boundary_' + Math.random().toString(36).substring(2);
  let emailLines: string[] = [];

  emailLines.push(`To: ${to}`);
  emailLines.push(`Subject: ${subject}`);
  emailLines.push('MIME-Version: 1.0');

  if (attachments && attachments.length > 0) {
    emailLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    emailLines.push('');
    emailLines.push(`--${boundary}`);
    emailLines.push('Content-Type: text/plain; charset="UTF-8"');
    emailLines.push('');
    emailLines.push(body);

    for (const att of attachments) {
      emailLines.push('');
      emailLines.push(`--${boundary}`);
      emailLines.push(`Content-Type: ${att.mimeType}; name="${att.name}"`);
      emailLines.push('Content-Transfer-Encoding: base64');
      emailLines.push(`Content-Disposition: attachment; filename="${att.name}"`);
      emailLines.push('');
      // Wrap base64 into 76 chars per line just in case, though Gmail might handle single line
      const base64Str = att.content.match(/.{1,76}/g)?.join('\r\n') || att.content;
      emailLines.push(base64Str);
    }
    emailLines.push('');
    emailLines.push(`--${boundary}--`);
  } else {
    emailLines.push('Content-Type: text/plain; charset="UTF-8"');
    emailLines.push('');
    emailLines.push(body);
  }

  const emailMessage = emailLines.join('\r\n');
  const encodedEmail = btoa(unescape(encodeURIComponent(emailMessage)))
     .replace(/\+/g, '-')
     .replace(/\//g, '_')
     .replace(/=+$/, '');
     
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedEmail }),
  });
  
  if (!res.ok) {
     const text = await res.text();
     throw new Error(`Failed to send email: ${text}`);
  }
  return res.json();
}

export async function fetchEmailBody(accessToken: string, messageId: string) {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch message body: ${res.status} ${text}`);
    }
    const data = await res.json();
    
    const getBody = (payload: any): string => {
      if (payload.body?.data) {
        return b64DecodeUnicode(payload.body.data);
      }
      if (payload.parts) {
        // Prefer html if available, otherwise plain text
        const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
        if (htmlPart && htmlPart.body?.data) return b64DecodeUnicode(htmlPart.body.data);
        
        const plainPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
        if (plainPart && plainPart.body?.data) return b64DecodeUnicode(plainPart.body.data);

        // Check sub-parts recursively
        for (const part of payload.parts) {
          const body = getBody(part);
          if (body) return body;
        }
      }
      return '';
    };

    return getBody(data.payload);
  } catch (e: any) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Network error or CORS issue. If you are in a preview iframe, try opening the app in a new tab.');
    }
    throw e;
  }
}

function b64DecodeUnicode(str: string) {
  // Convert base64url to base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Decode base64
  return decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

export async function fetchDriveFileContent(accessToken: string, fileId: string, mimeType: string) {
  if (mimeType.includes('pdf')) {
    return '[PDF Document - Raw binary view is suppressed. Click the "Analyze" button below to perform an interactive document summarization, key takeaways extraction, and action item mapping powered by Gemini AI.]';
  }

  let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  // If it's a Google Doc, export it as text
  if (mimeType === 'application/vnd.google-apps.document') {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
  }

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error('Failed to fetch file content');
  return await res.text();
}

export async function fetchDriveFileBlob(accessToken: string, fileId: string, mimeType: string): Promise<Blob> {
  let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  if (mimeType.includes('application/vnd.google-apps.')) {
     let exportMime = 'application/pdf';
     if (mimeType === 'application/vnd.google-apps.document') exportMime = 'application/pdf';
     else if (mimeType === 'application/vnd.google-apps.spreadsheet') exportMime = 'application/x-vnd.oasis.opendocument.spreadsheet';
     else if (mimeType === 'application/vnd.google-apps.presentation') exportMime = 'application/pdf';
     url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${exportMime}`;
  }

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
     const errorText = await res.text();
     throw new Error(`Failed to fetch file blob: ${errorText}`);
  }
  return await res.blob();
}

export async function fetchGoogleForm(accessToken: string, formId: string) {
  const url = `https://forms.googleapis.com/v1/forms/${formId}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch form: ${res.status} ${text}`);
    }
    return await res.json();
  } catch (e: any) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Network error or CORS issue. If you are in a preview iframe, try opening the app in a new tab.');
    }
    throw e;
  }
}

export async function uploadBase64ImageToDrive(accessToken: string, base64Data: string, fileName: string) {
  // Extract the actual base64 content
  const base64Content = base64Data.split(',')[1] || base64Data;
  const mimeType = base64Data.split(',')[0].split(':')[1]?.split(';')[0] || 'image/png';
  
  // Convert base64 to binary
  const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
  const blob = new Blob([bytes], { type: mimeType });
  const file = new File([blob], fileName, { type: mimeType });

  // Upload to Drive
  const uploadResult = await uploadDriveFile(accessToken, file);
  const fileId = uploadResult.id;

  // Set permissions to anyone with link (needed for Slides fetch)
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });

  // Get the webContentLink
  const fileInfoRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const fileInfo = await fileInfoRes.json();
  
  // Return direct download link for Drive files
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export async function createGooglePresentation(accessToken: string, title: string) {
  const url = 'https://slides.googleapis.com/v1/presentations';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create presentation: ${res.status} ${text}`);
    }
    return await res.json();
  } catch (e: any) {
    throw e;
  }
}

export async function updatePresentationBatch(accessToken: string, presentationId: string, requests: any[]) {
  const url = `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to update presentation: ${res.status} ${text}`);
    }
    return await res.json();
  } catch (e: any) {
    throw e;
  }
}
export async function createGoogleForm(accessToken: string, title: string) {
  const url = 'https://forms.googleapis.com/v1/forms';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ info: { title } })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create form: ${res.status} ${text}`);
    }
    return await res.json();
  } catch (e: any) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Network error or CORS issue. If you are in a preview iframe, try opening the app in a new tab.');
    }
    throw e;
  }
}

export async function updateFormBatch(accessToken: string, formId: string, requests: any[]) {
  const url = `https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to update form: ${res.status} ${text}`);
    }
    return await res.json();
  } catch (e: any) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Network error or CORS issue. If you are in a preview iframe, try opening the app in a new tab.');
    }
    throw e;
  }
}

export async function fetchGoogleFormResponses(accessToken: string, formId: string) {
  const url = `https://forms.googleapis.com/v1/forms/${formId}/responses`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 404) {
        return { responses: [] };
      }
      throw new Error(`Failed to fetch form responses: ${res.status} ${text}`);
    }
    return await res.json();
  } catch (e: any) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Network error or CORS issue. If you are in a preview iframe, try opening the app in a new tab.');
    }
    throw e;
  }
}
