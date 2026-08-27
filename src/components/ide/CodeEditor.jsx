import Editor from "@monaco-editor/react";

/**
 * Map canonical language identifier to Monaco editor language mode.
 */
function getMonacoLanguage(lang) {
  const norm = (lang || "").toLowerCase().trim();
  if (norm === "c") return "c";
  if (norm === "java") return "java";
  if (norm === "python") return "python";
  return "c";
}

const MONACO_OPTIONS = {
  fontSize: 13.5,
  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
  fontLigatures: true,
  minimap: { enabled: false },
  lineNumbers: "on",
  lineNumbersMinChars: 3,
  glyphMargin: false,
  folding: true,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 4,
  insertSpaces: true,
  wordWrap: "on",
  bracketPairColorization: { enabled: true },
  autoClosingBrackets: "always",
  autoClosingQuotes: "always",
  matchBrackets: "always",
  renderLineHighlight: "all",
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  padding: { top: 12, bottom: 12 },
  suggest: {
    showKeywords: true,
    showSnippets: true,
  },
};

export default function CodeEditor({
  code,
  language,
  onChange,
  onMount,
}) {
  const monacoLanguage = getMonacoLanguage(language);

  const handleEditorChange = (value) => {
    if (onChange) {
      onChange(value || "");
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    if (onMount) {
      onMount(editor, monaco);
    }
  };

  return (
    <div className="h-full w-full bg-[#1e1e1e] overflow-hidden relative">
      <Editor
        height="100%"
        width="100%"
        language={monacoLanguage}
        value={code}
        theme="vs-dark"
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex h-full w-full flex-col items-center justify-center bg-[#1e1e1e] text-slate-400 font-mono text-[12px] select-none">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#164a9c] animate-pulse" />
              <span className="text-slate-300">Loading editor ({monacoLanguage.toUpperCase()})...</span>
            </div>
          </div>
        }
        options={MONACO_OPTIONS}
      />
    </div>
  );
}
