import { useState, useCallback } from "react";
import { v4 as uuid } from "uuid";
import { ingestURL, ingestPDF, ingestText, sendChat } from "../lib/api";

export function useSession() {
  const [sessionId]   = useState(() => uuid());
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
    setLoadMsg(type === "url" ? `Fetching ${payload.url}…` : `Reading ${payload.file?.name || "document"}…`);
    try {
      let result;
      if (type === "url")  result = await ingestURL(sessionId, payload.url);
      if (type === "pdf")  result = await ingestPDF(sessionId, payload.file);
      if (type === "text") result = await ingestText(sessionId, payload.text, payload.filename);

      setSources(prev => [...prev, result.source]);
      addMessage("assistant",
        `✓ **${result.source}** indexed — ${result.chunks} chunks ready.\n\nAsk me anything about it.`,
        []
      );
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
