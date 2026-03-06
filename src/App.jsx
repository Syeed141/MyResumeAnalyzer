import { useState, useEffect } from "react";
import constants, { METRIC_CONFIG, buildPresenceChecklist } from "../constants";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function App() {
  const [aiReady, setAiReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [presenceChecklist, setPresenceChecklist] = useState([]);

  // for chat functionality

  const [chatQuestion, setChatQuestion] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.puter?.ai?.chat) {
        setAiReady(true);
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const extractPDFText = async (file) => {
    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    const texts = await Promise.all(
      Array.from({ length: pdf.numPages }, (_, i) =>
        pdf
          .getPage(i + 1)
          .then((page) =>
            page
              .getTextContent()
              .then((tc) => tc.items.map((item) => item.str).join(" ")),
          ),
      ),
    );

    return texts.join("\n").trim();
  };

  const parseJSONResponse = (reply) => {
    try {
      const match = reply.match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : {};

      if (!parsed.overallScore && !parsed.error) {
        throw new Error("Invalid AI response");
      }

      return parsed;
    } catch (err) {
      throw new Error(`Failed to parse AI response: ${err.message}`);
    }
  };

  const analyzeResume = async (text) => {
    const prompt = constants.ANALYZE_RESUME_PROMPT.replace(
      "{{DOCUMENT_TEXT}}",
      text,
    );

    const response = await window.puter.ai.chat(
      [
        {
          role: "system",
          content:
            "You are an expert resume reviewer. Respond only with valid JSON matching the requested structure.",
        },
        { role: "user", content: prompt },
      ],
      {
        model: "gpt-4o",
      },
    );

    const result = parseJSONResponse(
      typeof response === "string"
        ? response
        : response?.message?.content || "",
    );

    if (result.error) throw new Error(result.error);

    return result;
  };

  const reset = () => {
    setUploadedFile(null);
    setAnalysis(null);
    setResumeText("");
    setPresenceChecklist([]);
    setIsLoading(false);
    setChatQuestion("");
    setChatMessages([]);
    setChatLoading(false);
    setShowChat(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];

    if (!file || file.type !== "application/pdf") {
      alert("Please upload a PDF file only.");
      return;
    }

    setUploadedFile(file);
    setIsLoading(true);
    setAnalysis(null);
    setResumeText("");
    setPresenceChecklist([]);

    try {
      const text = await extractPDFText(file);
      setResumeText(text);
      setPresenceChecklist(buildPresenceChecklist(text));
      const result = await analyzeResume(text);
      setAnalysis(result);
    } catch (err) {
      alert(`Error: ${err.message}`);
      reset();
    } finally {
      setIsLoading(false);
    }
  };

  const numericScore = parseInt(analysis?.overallScore || "7", 10);

  // chat functionality

  const askAboutResume = async () => {
    if (!chatQuestion.trim()) return;
    if (!resumeText.trim()) {
      alert("Please upload and analyze a resume first.");
      return;
    }

    const newUserMessage = {
      role: "user",
      content: chatQuestion,
    };

    const updatedMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const response = await window.puter.ai.chat(
        [
          {
            role: "system",
            content: `You are a professional resume coach name Jarvis.
Use only the resume below to answer questions.
If something is missing from the resume, say so clearly.

Resume:
"""
${resumeText}
"""`,
          },
          ...updatedMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        {
          model: "gpt-4o",
        },
      );

      const reply =
        typeof response === "string"
          ? response
          : response?.message?.content || "No response received.";

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
        },
      ]);

      setChatQuestion("");
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.message}`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-main-gradient p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center mb-6">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light bg-gradient-to-r from-cyan-300 via-teal-200 to-sky-300 bg-clip-text text-transparent mb-2">
            AI Resume Analyzer
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Upload your PDF resume and get instant AI feedback
          </p>
        </div>

        {!uploadedFile && (
          <div className="upload-area">
            <div className="upload-zone">
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">📄</div>

              <h3 className="text-xl sm:text-2xl text-slate-200 mb-2">
                Upload Your Resume
              </h3>

              <p className="text-slate-400 mb-4 sm:mb-6 text-sm sm:text-base">
                PDF files only • Get instant analysis
              </p>

              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={!aiReady}
                className="hidden"
                id="file-upload"
              />

              <label
                htmlFor="file-upload"
                className={`inline-block btn-primary ${
                  !aiReady ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Choose PDF File
              </label>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="p-6 sm:p-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="loading-spinner"></div>

              <h3 className="text-lg sm:text-xl text-slate-200 mb-2">
                Analyzing Your Resume
              </h3>

              <p className="text-slate-400 text-sm sm:text-base">
                Please wait while AI reviews your resume...
              </p>
            </div>
          </div>
        )}

        {analysis && uploadedFile && (
          <div className="space-y-6 p-4 sm:px-8 lg:px-16">
            <div className="file-info-card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="icon-container-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                    <span className="text-3xl">📄</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-green-500 mb-1">
                      Analysis Complete
                    </h3>

                    <p className="text-slate-300 text-sm break-all">
                      {uploadedFile.name}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 fade-up">
                  <button onClick={reset} className="btn-secondary">
                    🔄 New Analysis
                  </button>
                </div>
              </div>
            </div>

            <div className="score-card fade-up">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-2xl">🏆</span>

                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    Overall Score
                  </h2>
                </div>

                <div className="relative">
                  <p className="text-6xl sm:text-8xl font-extrabold text-cyan-400 drop-shadow-lg">
                    {analysis.overallScore || "7"}
                  </p>
                </div>

                <div
                  className={`inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full ${
                    numericScore >= 8
                      ? "score-status-excellent"
                      : numericScore >= 6
                        ? "score-status-good"
                        : "score-status-improvement"
                  }`}
                >
                  <span className="text-lg">
                    {numericScore >= 8 ? "🌟" : numericScore >= 6 ? "⭐" : "📈"}
                  </span>
                  <span className="font-medium">
                    {numericScore >= 8
                      ? "Excellent"
                      : numericScore >= 6
                        ? "Good"
                        : "Needs Improvement"}
                  </span>
                </div>

                <div className="progress-bar mt-4 fade-up">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                      numericScore >= 8
                        ? "progress-excellent"
                        : numericScore >= 6
                          ? "progress-good"
                          : "progress-improvement"
                    }`}
                    style={{
                      width: `${(numericScore / 10) * 100}%`,
                    }}
                  ></div>
                </div>

                <p className="text-slate-400 text-sm mt-3 text-center font-medium">
                  Score based on content quality, formatting, and keyword usage
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="feature-card-green group">
                <div className="bg-green-500/20 icon-container-lg mx-auto mb-3 group-hover:bg-green-400/30 transition-colors">
                  <span className="text-green-300 text-xl">✓</span>
                </div>

                <h4 className="text-green-300 text-sm font-semibold uppercase tracking-wide mb-3 fade-up">
                  Top Strengths
                </h4>

                <div className="space-y-2 text-left">
                  {(analysis.strengths || [])
                    .slice(0, 3)
                    .map((strength, index) => (
                      <div key={index} className="list-item-green">
                        <span className="text-green-400 text-sm mt-0.5">•</span>
                        <span className="text-slate-200 font-medium text-sm leading-relaxed">
                          {strength}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="feature-card-orange group">
                <div className="bg-orange-500/20 icon-container-lg mx-auto mb-3 group-hover:bg-orange-400/30 transition-colors">
                  <span className="text-orange-300 text-xl">⚡</span>
                </div>

                <h4 className="text-orange-300 text-sm font-semibold uppercase tracking-wide mb-3">
                  Main Improvements
                </h4>

                <div className="space-y-2 text-left">
                  {(analysis.improvements || [])
                    .slice(0, 3)
                    .map((improvement, index) => (
                      <div key={index} className="list-item-orange">
                        <span className="text-orange-400 text-sm mt-0.5">
                          •
                        </span>
                        <span className="text-slate-200 font-medium text-sm leading-relaxed">
                          {improvement}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="section-card group">
              <div className="flex items-center gap-3 mb-6">
                <div className="icon-container bg-purple-500/20">
                  <span className="text-purple-300 text-lg">📄</span>
                </div>

                <h4 className="text-xl font-bold text-white">
                  Executive Summary
                </h4>
              </div>

              <div className="summary-box">
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            </div>

            <div className="section-card group">
              <div className="flex items-center gap-3 mb-6">
                <div className="icon-container bg-cyan-500/20">
                  <span className="text-cyan-300 text-lg">📊</span>
                </div>

                <h4 className="text-xl font-bold text-white">
                  Performance Metrics
                </h4>
              </div>

              <div className="space-y-4">
                {METRIC_CONFIG.map((cfg, i) => {
                  const value =
                    analysis.performanceMetrics?.[cfg.key] ?? cfg.defaultValue;

                  return (
                    <div key={i} className="group/item">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cfg.icon}</span>
                          <p className="text-slate-200 font-medium">
                            {cfg.label}
                          </p>
                        </div>

                        <span className="text-slate-300 font-bold">
                          {value}/10
                        </span>
                      </div>

                      <div className="progress-bar-small">
                        <div
                          className={`h-full bg-gradient-to-r ${cfg.colorClass} rounded-full transition-all duration-1000 ease-out group-hover/item:shadow-lg ${cfg.shadowClass}`}
                          style={{ width: `${(value / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="section-card group">
              <div className="flex items-center gap-3 mb-6">
                <div className="icon-container bg-fuchsia-500/20">
                  <span className="text-fuchsia-300 text-lg">🧠</span>
                </div>

                <h2 className="text-xl font-bold text-fuchsia-400">
                  Resume Insights
                </h2>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
                    ATS Presence Checklist
                  </h3>

                  <div className="space-y-2">
                    {presenceChecklist.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                          item.present
                            ? "bg-green-500/10 border-green-500/20"
                            : "bg-red-500/10 border-red-500/20"
                        }`}
                      >
                        <span className="text-slate-200 text-sm">
                          {item.label}
                        </span>
                        <span className="text-lg">
                          {item.present ? "✅" : "❌"}
                        </span>
                      </div>

                      // test
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {!!analysis.keywords?.length && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
                        Suggested Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/20 text-cyan-200 text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!!analysis.actionItems?.length && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
                        Action Items
                      </h3>
                      <div className="space-y-2">
                        {analysis.actionItems.map((item, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3 text-slate-200 text-sm"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!!analysis.proTips?.length && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
                        Pro Tips
                      </h3>
                      <div className="space-y-2">
                        {analysis.proTips.map((tip, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-3 text-slate-200 text-sm"
                          >
                            {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!!analysis.atsChecklist?.length && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
                        ATS Checklist
                      </h3>
                      <div className="space-y-2">
                        {analysis.atsChecklist.map((item, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-slate-200 text-sm"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!!resumeText && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
                    Resume Snapshot
                  </h3>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-slate-900/60 border border-slate-700 p-4">
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">
                        Word Count in the resume
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {resumeText.trim().split(/\s+/).filter(Boolean).length}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-900/60 border border-slate-700 p-4">
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">
                        Character Count
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {resumeText.length}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-900/60 border border-slate-700 p-4">
                      <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">
                        Estimated Pages of Text
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {Math.max(1, Math.ceil(resumeText.length / 1800))}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-900/60 border border-slate-700 p-5">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-3">
                      Quick Extract Check
                    </p>

                    <div className="space-y-3">
                      {resumeText
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .slice(0, 6)
                        .map((line, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-slate-800/70 border border-slate-700 px-4 py-3 text-slate-200 text-sm"
                          >
                            {line}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {analysis && uploadedFile && (
        <button
          onClick={() => setShowChat((prev) => !prev)}
          className="fixed top-6 right-6 z-50 rounded-full px-5 py-3 shadow-lg border border-fuchsia-500/30 bg-fuchsia-600 text-white font-medium hover:bg-fuchsia-500 transition-all"
        >
          {showChat ? "Close Chat" : "Ask Jarvis, your personalized AI bud!"}
        </button>
      )}

      {analysis && uploadedFile && showChat && (
        <div className="fixed top-20 right-6 w-[360px] max-w-[calc(100vw-2rem)] z-50 rounded-2xl border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/80">
            <div>
              <h4 className="text-white font-semibold">
                Here for you, bud! Ask About Your Resume
              </h4>
              <p className="text-slate-400 text-xs">Jarvis powered by Puter</p>
            </div>

            <button
              onClick={() => setShowChat(false)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="h-72 overflow-y-auto space-y-3 rounded-xl bg-slate-950/60 border border-slate-800 p-3">
              {chatMessages.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-slate-400 text-sm">
                    Bud, you can ask questions like:
                  </p>

                  {[
                    "How can I improve my summary?",
                    "Is my resume ATS-friendly?",
                    "What skills are missing?",
                    "How can I improve my experience section?",
                  ].map((q, index) => (
                    <button
                      key={index}
                      onClick={() => setChatQuestion(q)}
                      className="block w-full text-left rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-300 text-sm hover:bg-slate-700"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-cyan-500/15 border border-cyan-500/20 text-cyan-100"
                        : "bg-slate-800 border border-slate-700 text-slate-200"
                    }`}
                  >
                    <p className="mb-1 font-semibold">
                      {msg.role === "user" ? "You" : "Jarvis"}
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                ))
              )}

              {chatLoading && (
                <div className="rounded-xl px-3 py-2 text-sm bg-slate-800 border border-slate-700 text-slate-300">
                  Your bud Jarvis is typing...
                </div>
              )}
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !chatLoading) {
                    askAboutResume();
                  }
                }}
                placeholder="Ask something about your resume..."
                className="w-full rounded-xl bg-slate-950/70 border border-slate-700 px-4 py-3 text-slate-200 placeholder:text-slate-500 outline-none"
              />

              <button
                onClick={askAboutResume}
                disabled={chatLoading || !chatQuestion.trim()}
                className={`w-full rounded-xl px-4 py-3 font-medium text-white transition ${
                  chatLoading || !chatQuestion.trim()
                    ? "bg-slate-700 cursor-not-allowed opacity-50"
                    : "bg-fuchsia-600 hover:bg-fuchsia-500"
                }`}
              >
                Ask Jarvis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
