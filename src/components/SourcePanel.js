import { useRef, useState } from "react";

const FREE_MODELS = [
  { id: "arcee-ai/trinity-large-preview:free",            label: "Trinity Large 400B (best)" },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free",  label: "Mistral Small 3.1 24B" },
  { id: "meta-llama/llama-3.2-3b-instruct:free",          label: "Llama 3.2 3B (fastest)" },
  { id: "google/gemma-3-4b-it:free",                      label: "Gemma 3 4B" },
];

export default function SourcePanel({ onIngest, loading, error, clearError, model, setModel }) {
  const [url, setUrl]       = useState("");
  const [drag, setDrag]     = useState(false);
  const fileRef             = useRef();

  const submit = () => {
    if (!url.trim()) return;
    clearError();
    onIngest("url", { url: url.trim() });
    setUrl("");
  };

  const handleFile = (file) => {
    if (!file) return;
    clearError();
    if (file.type === "application/pdf")
      onIngest("pdf", { file });
    else if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt"))
      onIngest("text", { text: "", file }); // server reads it, but we send raw text
    else
      onIngest("pdf", { file }); // try anyway
  };

  return (
    <div style={styles.panel}>
      <div style={styles.logo}>Lumen</div>
      <div style={styles.tagline}>Document Intelligence</div>

      {/* Dropzone */}
      <div
        style={{ ...styles.drop, ...(drag ? styles.dropActive : {}) }}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
      >
        <span style={styles.dropIcon}>⬆</span>
        <div style={styles.dropText}>Drop a PDF or text file</div>
        <div style={styles.dropSub}>PDF · TXT · MD — or click to browse</div>
        <input ref={fileRef} type="file" accept=".pdf,.txt,.md" style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      {/* OR */}
      <div style={styles.or}>
        <div style={styles.orLine} />
        <span style={styles.orText}>or paste a URL</span>
        <div style={styles.orLine} />
      </div>

      {/* URL row */}
      <div style={styles.urlRow}>
        <input
          value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="https://…"
          style={styles.urlInput}
          disabled={loading}
        />
        <button style={styles.fetchBtn} onClick={submit} disabled={loading || !url.trim()}>
          {loading ? "…" : "Fetch →"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.error}>⚠ {error}</div>
      )}

      {/* Model selector */}
      <div style={styles.modelSection}>
        <div style={styles.modelLabel}>Model</div>
        <select value={model} onChange={e => setModel(e.target.value)} style={styles.modelSelect}>
          {FREE_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label} (free)</option>
          ))}
        </select>
      </div>

      <div style={styles.footnote}>
        Powered by OpenRouter free models.<br />
        Documents processed server-side, not stored.
      </div>
    </div>
  );
}

const styles = {
  panel: {
    width: 300, minWidth: 280,
    background: "#0f0e0c",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    padding: "2rem 1.5rem",
    display: "flex", flexDirection: "column",
    gap: "1rem",
    height: "100vh", overflowY: "auto",
  },
  logo: {
    fontFamily: "Georgia, serif", fontStyle: "italic",
    fontSize: "1.6rem", color: "#e8d5b0",
    letterSpacing: "-0.02em",
  },
  tagline: {
    fontFamily: "monospace", fontSize: 11,
    color: "rgba(232,213,176,0.3)",
    letterSpacing: "0.15em", textTransform: "uppercase",
    marginTop: "-0.5rem", marginBottom: "0.5rem",
  },
  drop: {
    border: "2px dashed rgba(232,213,176,0.18)",
    borderRadius: 10, padding: "1.5rem 1rem",
    textAlign: "center", cursor: "pointer",
    transition: "all 0.2s",
  },
  dropActive: {
    border: "2px dashed rgba(232,213,176,0.55)",
    background: "rgba(232,213,176,0.04)",
  },
  dropIcon: { fontSize: "1.4rem", display: "block", marginBottom: 6, opacity: 0.5 },
  dropText: { fontSize: "0.88rem", color: "rgba(232,224,208,0.55)" },
  dropSub: { fontSize: "0.73rem", color: "rgba(232,224,208,0.28)", fontFamily: "monospace", marginTop: 4 },
  or: { display: "flex", alignItems: "center", gap: "0.75rem" },
  orLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.07)" },
  orText: { fontSize: 11, color: "rgba(232,224,208,0.25)", fontFamily: "monospace" },
  urlRow: { display: "flex", gap: "0.4rem" },
  urlInput: {
    flex: 1, background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(232,213,176,0.18)",
    borderRadius: 7, padding: "0.55rem 0.75rem",
    color: "#e8e0d0", fontSize: "0.82rem",
    outline: "none", fontFamily: "monospace",
    minWidth: 0,
  },
  fetchBtn: {
    background: "rgba(232,213,176,0.1)",
    border: "1px solid rgba(232,213,176,0.28)",
    color: "#e8d5b0", borderRadius: 7,
    padding: "0.55rem 0.75rem", cursor: "pointer",
    fontSize: "0.78rem", fontFamily: "monospace",
    whiteSpace: "nowrap",
  },
  error: {
    background: "rgba(200,60,40,0.1)",
    border: "1px solid rgba(200,60,40,0.3)",
    borderRadius: 6, padding: "0.6rem 0.8rem",
    color: "#f08070", fontSize: "0.8rem", fontFamily: "monospace",
  },
  modelSection: { marginTop: "0.5rem" },
  modelLabel: {
    fontSize: 10, fontFamily: "monospace",
    color: "rgba(232,224,208,0.3)",
    textTransform: "uppercase", letterSpacing: "0.12em",
    marginBottom: 5,
  },
  modelSelect: {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(232,213,176,0.18)",
    borderRadius: 7, padding: "0.5rem 0.75rem",
    color: "#e8d5b0", fontSize: "0.82rem",
    fontFamily: "monospace", outline: "none", cursor: "pointer",
  },
  footnote: {
    marginTop: "auto", fontSize: 10, fontFamily: "monospace",
    color: "rgba(232,224,208,0.18)", lineHeight: 1.7,
    paddingTop: "1rem",
  },
};
