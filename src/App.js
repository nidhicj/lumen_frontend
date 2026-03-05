import { useState } from "react";
import SourcePanel from "./components/SourcePanel";
import ChatPanel   from "./components/ChatPanel";
import { useSession } from "./hooks/useSession";
import "./App.css";

export default function App() {
  const [model, setModel] = useState("google/gemma-3-12b-it:free");
  const {
    sources, messages, loading, loadMsg, error,
    handleIngest, handleChat, clearError,
  } = useSession();

  return (
    <div className="app-layout">
      <SourcePanel
        onIngest={handleIngest}
        loading={loading}
        error={error}
        clearError={clearError}
        model={model}
        setModel={setModel}
      />
      <ChatPanel
        messages={messages}
        sources={sources}
        loading={loading}
        loadMsg={loadMsg}
        onSend={handleChat}
        model={model}
      />
    </div>
  );
}
