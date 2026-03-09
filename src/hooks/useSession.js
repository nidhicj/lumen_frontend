import { useState, useCallback } from "react";
import { v4 as uuid } from "uuid";
import { ingestURL, ingestPDF, ingestText, ingestDriveFolder, sendChat } from "../lib/api";

const isDriveFolderURL = (url) =>
  url.includes("drive.google.com/drive/folders") ||
  url.includes("drive.google.com/drive/u/") ||
  url.includes("drive.google.com/open");

export function useSession() {
  const [sessionId]             = useState(() => uuid());
  const [sources, setSources]   = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [loadMsg, setLoadMsg]   = useState("");
  const [error, setError]       = useState("");

  const addMessage = (role, content, sources = []) =>
    setMessages(prev => [...prev, { role, content, sources, id: uuid() }]);

  const handleIngest = useCallback(async (type, payload) => {
    setLoading(true);
    setError("");

    try {
      // ── Google Drive folder ──────────────────────────────────────────
      if (type === "url" && isDriveFolderURL(payload.url)) {
        setLoadMsg("Connecting to Google Drive folder…");
        const result = await ingestDriveFolder(sessionId, payload.url);

        const fileList = result.ingested
          .map(f => `\`${f.file}\` — ${f.chunks} chunks`)
          .join("\n- ");

        const errorNote = result.errors.length
          ? `\n\n⚠ Skipped ${result.errors.length} file(s): ${result.errors.map(e => e.file).join(", ")}`
          : "";

        addMessage("assistant",
          `✓ Google Drive folder indexed.\n\n` +
          `**${result.files_ingested} files · ${result.total_chunks} chunks total**\n\n` +
          // `- ${fileList}` +
          errorNote +
          `\n\nAll documents are now your corpora — ask me anything across all of them.`,
          []
        );

        setSources(prev => [...prev, ...result.ingested.map(f => f.file)]);
        return;
      }

      // ── Regular URL ──────────────────────────────────────────────────
      if (type === "url") {
        setLoadMsg(`Fetching ${payload.url}…`);
        const result = await ingestURL(sessionId, payload.url);
        setSources(prev => [...prev, result.source]);
        addMessage("assistant",
          `✓ **${result.source}** indexed — ${result.chunks} chunks ready.\n\nAsk me anything about it.`,
          []
        );
        return;
      }

      // ── PDF ──────────────────────────────────────────────────────────
      if (type === "pdf") {
        setLoadMsg(`Reading ${payload.file?.name || "document"}…`);
        const result = await ingestPDF(sessionId, payload.file);
        setSources(prev => [...prev, result.source]);
        addMessage("assistant",
          `✓ **${result.source}** indexed — ${result.chunks} chunks ready.\n\nAsk me anything about it.`,
          []
        );
        return;
      }

      // ── Plain text ───────────────────────────────────────────────────
      if (type === "text") {
        setLoadMsg(`Reading ${payload.filename || "document"}…`);
        const result = await ingestText(sessionId, payload.text, payload.filename);
        setSources(prev => [...prev, result.source]);
        addMessage("assistant",
          `✓ **${result.source}** indexed — ${result.chunks} chunks ready.\n\nAsk me anything about it.`,
          []
        );
        return;
      }

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadMsg("");
    }
  }, [sessionId]);

  const handleChat = useCallback(async (question, model) => {
    addMessage("user", question);
    setLoading(true);
    setError("");
    try {
      const data = await sendChat(sessionId, question, model);
      addMessage("assistant", data.answer, data.sources);
    } catch (e) {
      setError(e.message);
      addMessage("assistant", `⚠️ ${e.message}`, []);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  return {
    sessionId, sources, messages,
    loading, loadMsg, error,
    handleIngest, handleChat,
    clearError: () => setError(""),
  };
}