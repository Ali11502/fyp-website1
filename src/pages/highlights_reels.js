// src/components/HighlightsReel.jsx
import React, { useState, useEffect } from "react";
import { Highlighter, Film, Clock, Loader2, Play, ChevronRight } from "lucide-react";
import { useTask } from "../TaskContext";

const API_BASE = "http://localhost:8000";

export default function HighlightsReel() {
  const { taskId } = useTask();

  const [isGenerating, setIsGenerating] = useState(false);
  const [hlTaskId, setHlTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Simplified approach - only one toggle for highlights vs reels
  const [isReel, setIsReel] = useState(false);
  
  // Fixed duration of 90 seconds (1.5 minutes)
  const targetSeconds = 90;

  // 1) Start generation
  const handleGenerate = async () => {
    if (!taskId) {
      setError("Please process a video first.");
      return;
    }
    setError("");
    setIsGenerating(true);
    try {
      const body = {
        task_id: taskId,
        duration_seconds: targetSeconds,
        custom_prompt: undefined,
        use_algorithmic: true,
        is_reel: isReel,
      };

      const res = await fetch(`${API_BASE}/api/highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const { highlights_task_id } = await res.json();
      setHlTaskId(highlights_task_id);
      setStatus("processing");
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2) Poll status, then fetch result
  useEffect(() => {
    if (!hlTaskId) return;
    const iv = setInterval(async () => {
      try {
        const st = await fetch(
          `${API_BASE}/api/highlights/status/${hlTaskId}`
        ).then((r) => r.json());
        setStatus(st.status);

        if (st.status === "completed") {
          clearInterval(iv);
          const r = await fetch(
            `${API_BASE}/api/highlights/result/${hlTaskId}`
          );
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          setResult(await r.json());
        }
        if (st.status === "failed") {
          clearInterval(iv);
          setError(st.error || "Highlights generation failed.");
        }
      } catch (e) {
        clearInterval(iv);
        setError(e.message);
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [hlTaskId]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Top Section: Header + Toggle */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Video Summarizer</h1>
        
        {!hlTaskId && status !== "processing" && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <p className="text-gray-600 mb-6">
              Create a compact summary of your video content with our AI-powered generator.
            </p>
            
            {/* Simple Toggle */}
            <div className="bg-gray-50 p-1 rounded-lg flex mb-6">
              <button
                onClick={() => setIsReel(false)}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition flex items-center justify-center gap-2
                  ${!isReel 
                    ? "bg-white text-purple-700 shadow-sm" 
                    : "text-gray-600 hover:text-gray-800"}`}
              >
                <Highlighter className="w-5 h-5" />
                <span>Highlights</span>
              </button>
              <button
                onClick={() => setIsReel(true)}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition flex items-center justify-center gap-2
                  ${isReel 
                    ? "bg-white text-purple-700 shadow-sm" 
                    : "text-gray-600 hover:text-gray-800"}`}
              >
                <Film className="w-5 h-5" />
                <span>Reel</span>
              </button>
            </div>

            {/* Info Card */}
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className={`rounded-full p-2 mr-3 ${isReel ? "bg-blue-100 text-blue-600" : "bg-yellow-100 text-yellow-600"}`}>
                  {isReel ? <Film className="w-5 h-5" /> : <Highlighter className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">
                    {isReel ? "Social Media Ready" : "Key Moments"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isReel 
                      ? "A dynamic video optimized for social sharing with transitions and effects." 
                      : "A collection of important moments from your video with context."
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !taskId}
              className={`w-full py-4 px-6 rounded-lg font-medium text-white flex items-center justify-center gap-2
                ${!taskId
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 transition"
                }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Generate {isReel ? "Reel" : "Highlights"}</span>
                </>
              )}
            </button>
            
            {!taskId && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                You need to process a video first before generating highlights.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2 border border-red-100">
          <div className="rounded-full bg-red-100 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <span>{error}</span>
        </div>
      )}

      {/* Processing State */}
      {status === "processing" && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-purple-100 p-4">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            Generating {isReel ? "Reel" : "Highlights"}
          </h3>
          <p className="text-gray-600">
            Our AI is analyzing your video and creating a compelling 90-second {isReel ? "reel" : "highlight"}.
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Video Player */}
          {result.video_url && (
            <div className="relative aspect-video bg-black">
              <video
                src={`${API_BASE}${result.video_url}`}
                controls
                className="absolute inset-0 w-full h-full"
                poster="/video-poster.jpg" 
              />
            </div>
          )}
          
          {/* Details */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {isReel ? (
                  <>
                    <Film className="w-5 h-5 text-blue-600" />
                    <span>Video Reel</span>
                  </>
                ) : (
                  <>
                    <Highlighter className="w-5 h-5 text-yellow-600" />
                    <span>Video Highlights</span>
                  </>
                )}
              </h2>
              <span className="bg-purple-100 text-purple-700 py-1 px-3 rounded-full text-sm font-medium">
                {Math.round(result.total_duration)} seconds
              </span>
            </div>
            
            {/* Segments */}
            {result.segments && result.segments.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Included Segments
                </h3>
                <div className="space-y-2">
                  {result.segments.map((seg, i) => (
                    <div
                      key={i}
                      className="flex items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="bg-purple-100 text-purple-600 rounded-md p-2 mr-3">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {seg.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(seg.start * 1000).toISOString().substr(14, 5)} – 
                          {new Date(seg.end * 1000).toISOString().substr(14, 5)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => {
                  setHlTaskId(null);
                  setResult(null);
                  setStatus(null);
                }}
                className="px-5 py-2 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 font-medium transition"
              >
                Create New
              </button>
              
              {result.video_url && (
                <a
                  href={`${API_BASE}${result.video_url}`}
                  download
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}