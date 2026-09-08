import React, { useState } from "react";
import { Sparkles, Send, Bot, User, Copy, Check, Info } from "lucide-react";
import { LLM_PRESET_PROMPTS } from "@/lib/mockData";
import { toast } from "sonner";

import { useScreening } from "@/contexts/ScreeningContext";

export const LLMAssistant: React.FC = () => {
  const { currentCase } = useScreening();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Hello! I am the Vision Care AI Clinical Assistant (LLaMA-3-Med / Gemma-2B clinical explainability layer). I translate convolutional neural network logits, referable triage signals, and Grad-CAM attention heatmaps into grounded clinical summaries for rural frontline health workers and tele-ophthalmologists. How can I assist with this screening session?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSendPrompt = async (promptText: string, presetResponse?: string) => {
    if (!promptText.trim()) return;

    const userMsg = promptText;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsGenerating(true);

    let targetAnswer = presetResponse || "";

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: promptText,
          case_id: currentCase?.id,
          grade: currentCase?.grading.predictedGrade,
          is_referable: currentCase?.grading.isReferable,
          findings: currentCase?.grading.clinicalFindings,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.explanation) {
          targetAnswer = data.explanation;
        }
      }
    } catch (e) {
      console.warn("LLM API endpoint unavailable, using local synthesis:", e);
    }

    if (!targetAnswer) {
      targetAnswer = `Based on the EfficientNet-B0 visual evidence, the model evaluated ${currentCase.name} (${currentCase.id}) as ${currentCase.grading.gradeName}. P(referable) is calculated at ${((currentCase.grading.referableProbability ?? currentCase.grading.probabilities.slice(2).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}% against the 0.24 threshold. Clinical Recommendation: ${currentCase.grading.recommendation}`;
    }

    // Stream out response for clinical realism
    let currentIdx = 0;
    const streamInterval = setInterval(() => {
      currentIdx += 12;
      if (currentIdx >= targetAnswer.length) {
        clearInterval(streamInterval);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: targetAnswer },
        ]);
        setIsGenerating(false);
      }
    }, 25);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Clinical note copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#dce9f0] bg-white shadow-sm overflow-hidden">
      {/* Assistant Header */}
      <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-gradient-to-r from-[#f0fdf4]/50 via-[#f8fafc] to-[#eff6ff]/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2563eb] to-[#38bdf8] text-white shadow-xs">
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-[#0f2d4a]">Ask Vision Care AI</span>
              <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-[9px] font-extrabold text-[#1d4ed8]">
                LLaMA / Gemma Preview
              </span>
            </div>
            <div className="text-[10px] text-[#64748b]">Natural Language Explainability Layer</div>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="border-b border-[#f1f5f9] bg-[#f8fafc] p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] mb-2 flex items-center gap-1">
          <Sparkles size={11} className="text-[#2563eb]" /> Suggested Clinical Queries:
        </div>
        <div className="flex flex-col gap-1.5">
          {LLM_PRESET_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(item.prompt, item.response)}
              disabled={isGenerating}
              className="text-left rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#334155] hover:border-[#93c5fd] hover:bg-[#eff6ff] transition-all disabled:opacity-50"
            >
              👉 {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* Message Chat Flow */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[360px]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb] mt-0.5">
                <Bot size={14} />
              </div>
            )}
            <div
              className={`relative max-w-[85%] rounded-2xl p-3 text-[12px] leading-relaxed shadow-xs ${
                m.role === "user"
                  ? "bg-[#2563eb] text-white rounded-br-none"
                  : "border border-[#e2e8f0] bg-[#f8fafc] text-[#1e293b] rounded-bl-none whitespace-pre-line"
              }`}
            >
              {m.text}
              {m.role === "assistant" && (
                <button
                  onClick={() => copyToClipboard(m.text, idx)}
                  className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#64748b] hover:text-[#2563eb]"
                >
                  {copiedIndex === idx ? <Check size={12} className="text-[#16a34a]" /> : <Copy size={12} />}
                  {copiedIndex === idx ? "Copied" : "Copy Note"}
                </button>
              )}
            </div>
            {m.role === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563eb]/20 text-[#2563eb] mt-0.5">
                <User size={14} />
              </div>
            )}
          </div>
        ))}
        {isGenerating && (
          <div className="flex items-center gap-2 text-[11px] text-[#64748b] pl-9">
            <span className="h-2 w-2 animate-ping rounded-full bg-[#2563eb]" />
            Generating clinical rationale from model activations...
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPrompt(input);
        }}
        className="border-t border-[#e2e8f0] p-3 flex gap-2 bg-white"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about lesions, Grad-CAM rationale, or referral protocol..."
          disabled={isGenerating}
          className="flex-1 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 py-2 text-[12px] text-[#0f2d4a] placeholder-[#94a3b8] outline-none focus:border-[#2563eb] focus:bg-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || isGenerating}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:bg-[#cbd5e1] transition-colors"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
