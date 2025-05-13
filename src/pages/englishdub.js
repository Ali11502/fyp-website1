// src/components/Dubbing.jsx
import React, { useState, useEffect } from "react";
import { useTask } from "../TaskContext";
import { Video, Globe, Loader2, DownloadCloud, Info, Play, ChevronRight } from "lucide-react";

const API_BASE = "http://localhost:8000";

export default function Dubbing() {
  const { taskId } = useTask();

  const [dubbingTaskId, setDubbingTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // 1) Start dubbing
  const handleGenerate = async () => {
    if (!taskId) {
      setError("Please process a video first.");
      return;
    }
    setError("");
    setIsGenerating(true);
    setDubbingTaskId(null);
    setStatus(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/dub`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const { dubbing_task_id } = await res.json();
      setDubbingTaskId(dubbing_task_id);
      setStatus("processing");
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2) Poll status, then fetch download info
  useEffect(() => {
    if (!dubbingTaskId) return;
    const iv = setInterval(async () => {
      try {
        const st = await fetch(
          `${API_BASE}/api/dub/status/${dubbingTaskId}`
        ).then((r) => r.json());
        setStatus(st.status);

        if (st.status === "completed") {
          clearInterval(iv);
          const res = await fetch(
            `${API_BASE}/api/dub/download/${dubbingTaskId}`, 
            { method: "HEAD" }
          );
          // HEAD just checks existence; we'll build url from task ID
          setResult({ 
            downloadUrl: `/api/dub/download/${dubbingTaskId}`,
            stats: st.result?.stats || null,
            originalLang: st.result?.original_language || null
          });
        }
        if (st.status === "failed") {
          clearInterval(iv);
          setError(st.error || "Dubbing failed.");
        }
      } catch (e) {
        clearInterval(iv);
        setError(e.message);
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [dubbingTaskId]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Top Section: Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Video Dubbing</h1>
        
        {!dubbingTaskId && status !== "processing" && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <p className="text-gray-600 mb-6">
              Automatically dub your non-English videos into English with our AI-powered translation system.
            </p>
            
            {/* Info Card */}
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="rounded-full p-2 mr-3 bg-blue-100 text-blue-600">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">English Dubbing</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Our AI will detect the original language, translate the content, and generate 
                    natural-sounding English speech synced with the video.
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
                  <span>Generate English Dub</span>
                </>
              )}
            </button>
            
            {!taskId && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                You need to process a video first before dubbing.
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
            Generating English Dub
          </h3>
          <p className="text-gray-600">
            Our AI is translating and dubbing your video into English. This may take a few minutes.
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Video Player */}
          {result.downloadUrl && (
            <div className="relative aspect-video bg-black">
              <video
                src={`${API_BASE}${result.downloadUrl}`}
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
                <Globe className="w-5 h-5 text-blue-600" />
                <span>English Dubbed Video</span>
              </h2>
              <span className="bg-purple-100 text-purple-700 py-1 px-3 rounded-full text-sm font-medium">
                {result.originalLang?.toUpperCase() || "Auto-detected"} → EN
              </span>
            </div>
            
            {/* Stats */}
            {result.stats && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Segments Translated</div>
                  <div className="text-xl font-semibold text-gray-800 mt-1">
                    {result.stats.segments_translated}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="text-xl font-semibold text-gray-800 mt-1">
                    {Math.round(result.stats.duration)} seconds
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Processing Time</div>
                  <div className="text-xl font-semibold text-gray-800 mt-1">
                    {result.stats.processing_time}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">File Size</div>
                  <div className="text-xl font-semibold text-gray-800 mt-1">
                    {result.stats.file_size}
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => {
                  setDubbingTaskId(null);
                  setResult(null);
                  setStatus(null);
                  setError("");
                }}
                className="px-5 py-2 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 font-medium transition"
              >
                Create New
              </button>
              
              {result.downloadUrl && (
                <a
                  href={`${API_BASE}${result.downloadUrl}`}
                  download
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  <DownloadCloud className="h-5 w-5" />
                  Download Video
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}