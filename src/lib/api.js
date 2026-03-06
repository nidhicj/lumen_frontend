const BASE = process.env.REACT_APP_API_URL || "";

export async function ingestURL(sessionId, url) {
  const res = await fetch(`${BASE}/api/ingest/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, source_type: "url", url }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Ingest failed");
  }
  return res.json();
}

export async function ingestDriveFolder(sessionId, folderUrl) {
  const res = await fetch(`${BASE}/api/drive/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, folder_url: folderUrl }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Drive folder ingest failed");
  }
  return res.json();
}

export async function ingestPDF(sessionId, file) {
  const b64 = await fileToBase64(file);
  const res = await fetch(`${BASE}/api/ingest/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      source_type: "pdf",
      content: b64,
      filename: file.name,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "PDF ingest failed");
  }
  return res.json();
}

export async function ingestText(sessionId, text, filename = "pasted.txt") {
  const res = await fetch(`${BASE}/api/ingest/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, source_type: "text", content: text, filename }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Text ingest failed");
  }
  return res.json();
}

export async function sendChat(sessionId, question, model) {
  const res = await fetch(`${BASE}/api/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, question, model }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Chat failed");
  }
  return res.json();
}

export async function getSessions() {
  const res = await fetch(`${BASE}/api/sessions/`);
  return res.json();
}

export async function getSession(sessionId) {
  const res = await fetch(`${BASE}/api/sessions/${sessionId}`);
  return res.json();
}

export async function deleteSession(sessionId) {
  await fetch(`${BASE}/api/sessions/${sessionId}`, { method: "DELETE" });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
