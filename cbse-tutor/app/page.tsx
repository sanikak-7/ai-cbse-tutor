"use client";

import { FormEvent, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type DifficultyLevel = "easy" | "medium" | "advanced";
type Subject = "biology" | "chemistry";

const getDefaultPrompt = (subject: Subject) => `You are an experienced CBSE Class 11-12 ${subject.charAt(0).toUpperCase() + subject.slice(1)} tutor. 
- Explain ideas using precise scientific language, but keep sentences approachable for a 16-year-old.
- Cite the chapter or unit number when you reference material from the NCERT textbook.
- Encourage retrieval practice by ending longer answers with a reflective follow-up question.
- Use plaintext only. Do not apply markdown formatting, asterisks, etc.`;

export default function Home() {
  const [subject, setSubject] = useState<Subject>("biology");
  const [prompt, setPrompt] = useState(getDefaultPrompt("biology"));
  const [question, setQuestion] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubjectChange = (newSubject: Subject) => {
    setSubject(newSubject);
    setPrompt(getDefaultPrompt(newSubject));
  };

  const handleAsk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) {
      return;
    }

    const pendingQuestion = question.trim();
    setQuestion("");
    setError(null);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: pendingQuestion,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, question: pendingQuestion, difficulty, subject }),
      });

      if (!response.ok) {
        throw new Error("The tutor could not respond right now. Try again in a moment.");
      }

      const data: { answer?: string } = await response.json();
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer?.trim() || "I could not find an answer this time.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something unexpected got in the way.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 text-white">
      <header className="rounded-3xl border border-sky-300/20 bg-white/95 p-8 shadow-[0_30px_80px_rgba(37,150,255,0.18)] backdrop-blur-lg">
        <p className="font-serif text-sm uppercase tracking-[0.3em] text-sky-700">
          Your AI Biology Coach
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
          Master CBSE Biology with an AI tutor powered by your textbook
        </h1>
        <p className="mt-4 max-w-3xl text-base text-slate-700">
          Ask questions at any difficulty level and get answers grounded in the official NCERT curriculum. Perfect for CBSE Grade 11-12 students.
        </p>
      </header>

      <section className="w-full">
        <article
          className="flex flex-col rounded-3xl border border-sky-400/20 bg-slate-950/85 p-6 shadow-[0_20px_50px_rgba(2,6,13,0.7)] backdrop-blur-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sky-200/10 pb-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Chat Session</p>
              <h2 className="text-2xl font-semibold text-white">Ask Your Questions</h2>
            </div>
            <button
              type="button"
              onClick={resetConversation}
              className="rounded-full border border-sky-200/15 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-sky-300/40 hover:bg-sky-400/10 hover:text-white"
            >
              Reset thread
            </button>
          </div>

          <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-sky-200/10 bg-slate-900/80 p-4 text-sm leading-relaxed">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-sky-200/15 bg-slate-950/40 p-4 text-slate-300">
                <p className="font-semibold text-white">Demo prompt</p>
                <p>
                  Ask things like &quot;Explain photophosphorylation pathways&quot; or
                  &quot;How is transpiration pull maintained as per Chapter 6?&quot;
                </p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl border px-4 py-3 shadow-sm ${
                  message.role === "assistant"
                    ? "border-sky-400/25 bg-sky-500/12"
                    : "border-white/8 bg-white/5"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                  {message.role === "assistant" ? "Tutor" : "You"}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-base text-slate-50">
                  {message.content}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAsk} className="mt-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.35em] text-sky-300">
                Subject
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSubjectChange("biology")}
                  className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    subject === "biology"
                      ? "border-sky-400 bg-sky-500/20 text-sky-200"
                      : "border-sky-200/10 bg-white/5 text-slate-300 hover:border-sky-300/40 hover:text-white"
                  }`}
                >
                  Biology
                </button>
                <button
                  type="button"
                  onClick={() => handleSubjectChange("chemistry")}
                  className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    subject === "chemistry"
                      ? "border-sky-400 bg-sky-500/20 text-sky-200"
                      : "border-sky-200/10 bg-white/5 text-slate-300 hover:border-sky-300/40 hover:text-white"
                  }`}
                >
                  Chemistry
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.35em] text-sky-300">
                Difficulty level
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDifficulty("easy")}
                  className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    difficulty === "easy"
                      ? "border-sky-400 bg-sky-500/20 text-sky-200"
                      : "border-sky-200/10 bg-white/5 text-slate-300 hover:border-sky-300/40 hover:text-white"
                  }`}
                >
                  Easy
                  <span className="ml-1 text-xs opacity-70">(Grade 5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDifficulty("medium")}
                  className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    difficulty === "medium"
                      ? "border-sky-400 bg-sky-500/20 text-sky-200"
                      : "border-sky-200/10 bg-white/5 text-slate-300 hover:border-sky-300/40 hover:text-white"
                  }`}
                >
                  Medium
                  <span className="ml-1 text-xs opacity-70">(Grade 8)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDifficulty("advanced")}
                  className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    difficulty === "advanced"
                      ? "border-sky-400 bg-sky-500/20 text-sky-200"
                      : "border-sky-200/10 bg-white/5 text-slate-300 hover:border-sky-300/40 hover:text-white"
                  }`}
                >
                  Advanced
                  <span className="ml-1 text-xs opacity-70">(Grade 11-12)</span>
                </button>
              </div>
            </div>
            <label className="text-xs uppercase tracking-[0.35em] text-sky-300">
              Ask about a chapter
            </label>
            <textarea
              rows={3}
              placeholder="How does photorespiration differ from aerobic respiration in Chapter 11?"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="w-full rounded-2xl border border-sky-200/15 bg-slate-900/90 p-4 text-base text-white placeholder:text-slate-400 focus:border-sky-400/60 focus:outline-none"
            />
            {error && <p className="text-sm text-blue-200">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-500/40 disabled:text-slate-800"
            >
              {isSubmitting ? "Thinking..." : "Send to tutor"}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
