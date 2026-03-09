import { useRef, useEffect, useState } from "react";

// Add this helper at the top of the file
const MODEL_LABELS = {
  "meta-llama/llama-3.2-3b-instruct:free":          "Llama 3.2 3B",
  "google/gemma-3-4b-it:free":                       "Gemma 3 4B",
  "mistralai/mistral-small-3.1-24b-instruct:free":   "Mistral Small",
  "arcee-ai/trinity-large-preview:free":             "Trinity 400B",
};

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:3px;font-family:monospace;font-size:0.88em">$1</code>')
    .replace(/\[(\d+)\]/g,
      '<span style="display:inline-flex;align-items:center;background:rgba(232,213,176,0.12);border:1px solid rgba(232,213,176,0.28);color:#e8d5b0;border-radius:3px;font-size:10px;padding:0 5px;font-family:monospace;margin:0 2px">[$1]</span>'
    )
    .replace(/\n\n/g, '</p><p style="margin:0.5em 0">')
    .replace(/\n/g, "<br/>");
}

const Spinner = () => (
  <span style={{
    display: "inline-block", width: 14, height: 14,
    border: "2px solid rgba(255,255,255,0.1)",
    borderTop: "2px solid rgba(232,213,176,0.6)",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
  }} />
);

export default function ChatPanel({ messages, sources, loading, loadMsg, onSend, model }) {
  const [input, setInput] = useState("");
  const endRef  = useRef();
  const inputRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    onSend(q, model);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={styles.wrap}>
      {/* Source pills */}
      {sources.length > 0 && (
        <div style={styles.sourceBar}>
          {sources.map((s, i) => (
            <span key={i} style={styles.pill} title={s}>
              {s.length > 32 ? s.slice(0, 30) + "…" : s}
            </span>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={styles.messages}>
        {isEmpty && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>✦</div>
            <div style={styles.emptyTitle}>Add a source to begin</div>
            <div style={styles.emptySub}>Drop a PDF or paste a URL in the panel on the left</div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} style={styles.msgWrap}>
            {m.role === "user" ? (
              <div style={styles.userMsg}>{m.content}</div>
            ) : (
              <div style={styles.botOuter}>
                <div style={styles.botMsg}>
                  <p style={{ margin: 0 }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                </div>
                {m.sources?.length > 0 && (
                  <div style={styles.chips}>
                    {m.sources.map((s, i) => (
                      <span key={i} style={styles.chip} title={s.snippet}>
                        [{s.index}] {s.source_name.length > 30 ? s.source_name.slice(0,28)+"…" : s.source_name}
                      </span>
                    ))}
                  </div>
                )}
                {/* Model badge */}
                {m.model_used && (
                  <div style={{
                    marginTop: "0.4rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem"
                  }}>
                    <span style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: m.model_used !== m.requestedModel
                        ? "rgba(255,180,80,0.7)"   // amber if fallback
                        : "rgba(232,213,176,0.3)", // dim if expected
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 4,
                      padding: "2px 7px",
                    }}>
                      ✦ {MODEL_LABELS[m.model_used] || m.model_used}
                      {m.model_used !== m.requestedModel && " (fallback)"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={styles.thinking}>
            <Spinner />
            <span>{loadMsg || "Searching documents…"}</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <div style={styles.inputRow}>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={sources.length === 0 ? "Add a source first…" : "Ask anything about your documents…"}
            disabled={sources.length === 0 || loading}
            style={styles.textarea}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim() || sources.length === 0}
            style={{ ...styles.sendBtn, opacity: (loading || !input.trim() || sources.length === 0) ? 0.4 : 1 }}
          >
            {loading ? <Spinner /> : "↑"}
          </button>
        </div>
        <div style={styles.hint}>Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    flex: 1, display: "flex", flexDirection: "column",
    height: "100vh", overflow: "hidden",
    background: "#121110",
  },
  sourceBar: {
    padding: "0.7rem 1.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex", gap: "0.4rem", flexWrap: "wrap",
    background: "rgba(15,14,12,0.8)",
  },
  pill: {
    background: "rgba(232,213,176,0.07)",
    border: "1px solid rgba(232,213,176,0.18)",
    borderRadius: 20, padding: "2px 10px",
    fontSize: 11, color: "rgba(232,213,176,0.55)",
    fontFamily: "monospace",
  },
  messages: {
    flex: 1, overflowY: "auto",
    padding: "1.5rem",
    display: "flex", flexDirection: "column",
    gap: "1.25rem",
    maxWidth: 800, width: "100%", margin: "0 auto",
    alignSelf: "stretch",
  },
  empty: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    textAlign: "center", padding: "4rem 2rem",
    color: "rgba(232,224,208,0.2)",
  },
  emptyIcon: { fontSize: "2rem", marginBottom: "1rem", opacity: 0.4 },
  emptyTitle: { fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "1.2rem", marginBottom: "0.5rem" },
  emptySub: { fontFamily: "monospace", fontSize: "0.78rem", letterSpacing: "0.05em" },
  msgWrap: { animation: "fadeUp 0.2s ease" },
  userMsg: {
    alignSelf: "flex-end", float: "right", clear: "both",
    maxWidth: "75%", background: "rgba(232,213,176,0.08)",
    border: "1px solid rgba(232,213,176,0.16)",
    borderRadius: "14px 14px 4px 14px",
    padding: "0.7rem 1rem", fontSize: "0.92rem", lineHeight: 1.6,
  },
  botOuter: { clear: "both", maxWidth: "88%" },
  botMsg: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "4px 14px 14px 14px",
    padding: "0.85rem 1.1rem",
    fontSize: "0.92rem", lineHeight: 1.75,
    color: "#ddd8cc",
  },
  chips: { marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.35rem" },
  chip: {
    background: "rgba(232,213,176,0.05)",
    border: "1px solid rgba(232,213,176,0.12)",
    borderRadius: 5, padding: "2px 8px",
    fontSize: 10, color: "rgba(232,213,176,0.38)",
    fontFamily: "monospace", cursor: "default",
    maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  thinking: {
    display: "flex", alignItems: "center", gap: "0.6rem",
    color: "rgba(232,213,176,0.3)", fontSize: "0.8rem",
    fontFamily: "monospace", padding: "0.25rem 0",
  },
  inputArea: {
    borderTop: "1px solid rgba(255,255,255,0.07)",
    padding: "0.9rem 1.5rem 1rem",
    background: "rgba(15,14,12,0.95)",
  },
  inputRow: {
    display: "flex", gap: "0.5rem",
    maxWidth: 800, margin: "0 auto",
  },
  textarea: {
    flex: 1, background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 9, padding: "0.7rem 0.9rem",
    color: "#e8e0d0", fontSize: "0.92rem",
    outline: "none", fontFamily: "Georgia, serif",
    resize: "none", lineHeight: 1.5,
    transition: "border-color 0.15s",
  },
  sendBtn: {
    background: "rgba(232,213,176,0.1)",
    border: "1px solid rgba(232,213,176,0.25)",
    color: "#e8d5b0", borderRadius: 9,
    padding: "0.7rem 1.1rem", cursor: "pointer",
    fontSize: "1rem", display: "flex",
    alignItems: "center", justifyContent: "center",
    minWidth: 50, transition: "all 0.15s",
  },
  hint: {
    textAlign: "center", fontSize: 10,
    color: "rgba(232,224,208,0.15)", fontFamily: "monospace",
    marginTop: "0.4rem", letterSpacing: "0.05em",
  },
};
