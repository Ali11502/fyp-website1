// src/components/SubtitleGenerator.jsx
import React, { useState, useEffect } from "react";
import { FileText, Sliders, Loader2, Play, Download, RefreshCw, Clock, Languages, ChevronRight } from "lucide-react";
import { useTask } from "../TaskContext";

const API_BASE = "http://localhost:8000";

export default function SubtitleGenerator() {
  const { taskId } = useTask();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [subtitleTaskId, setSubtitleTaskId] = useState(null);
  const [adjustedSubtitleTaskId, setAdjustedSubtitleTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  
  // Subtitle format selection
  const [subtitleFormat, setSubtitleFormat] = useState("srt");
  
  // Offset adjustment in seconds
  const [offsetSeconds, setOffsetSeconds] = useState(0);
  
  // UI state for adjustment mode
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  // Start subtitle generation
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
        subtitle_format: subtitleFormat
      };

      const res = await fetch(`${API_BASE}/api/subtitles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      
      const { subtitle_task_id } = await res.json();
      setSubtitleTaskId(subtitle_task_id);
      setStatus("processing");
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Adjust subtitle timing
  const handleAdjustTiming = async () => {
    if (!subtitleTaskId || !result) {
      setError("No subtitles available to adjust.");
      return;
    }
    
    setError("");
    setIsAdjusting(true);
    
    try {
      const body = {
        subtitle_task_id: subtitleTaskId,
        offset_seconds: offsetSeconds
      };

      const res = await fetch(`${API_BASE}/api/subtitles/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      
      const { subtitle_task_id } = await res.json();
      setAdjustedSubtitleTaskId(subtitle_task_id);
      // Keep original status while we wait for the new task
      setStatus("adjusting");
    } catch (e) {
      setError(e.message);
    } finally {
      setIsAdjusting(false);
    }
  };

  // Reset to create new subtitles
  const handleReset = () => {
    setSubtitleTaskId(null);
    setAdjustedSubtitleTaskId(null);
    setResult(null);
    setStatus(null);
    setOffsetSeconds(0);
  };

  // Poll for subtitle task status
  useEffect(() => {
    // Determine which task ID to poll
    const currentTaskId = adjustedSubtitleTaskId || subtitleTaskId;
    
    if (!currentTaskId) return;
    
    const iv = setInterval(async () => {
      try {
        const st = await fetch(
          `${API_BASE}/api/subtitles/status/${currentTaskId}`
        ).then((r) => r.json());
        
        setStatus(st.status);

        if (st.status === "completed") {
          clearInterval(iv);
          // If this was an adjustment, update the main subtitle task ID
          if (adjustedSubtitleTaskId === currentTaskId) {
            setSubtitleTaskId(adjustedSubtitleTaskId);
            setAdjustedSubtitleTaskId(null);
          }
          setResult(st.result);
        }
        
        if (st.status === "failed") {
          clearInterval(iv);
          setError(st.error || "Subtitle generation failed.");
          // If adjustment failed, clear adjusted ID but keep original
          if (adjustedSubtitleTaskId === currentTaskId) {
            setAdjustedSubtitleTaskId(null);
          }
        }
      } catch (e) {
        clearInterval(iv);
        setError(e.message);
      }
    }, 2000);
    
    return () => clearInterval(iv);
  }, [subtitleTaskId, adjustedSubtitleTaskId]);

  // Format time from seconds to MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.floor(Math.abs(seconds) % 60);
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Top Section: Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Video Subtitler</h1>
        
        {!subtitleTaskId && status !== "processing" && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <p className="text-gray-600 mb-6">
              Generate subtitles for your video content with our AI-powered transcription engine.
            </p>
            
            {/* Format Selection */}
            <div className="bg-gray-50 p-1 rounded-lg flex mb-6">
              <button
                onClick={() => setSubtitleFormat("srt")}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition flex items-center justify-center gap-2
                  ${subtitleFormat === "srt" 
                    ? "bg-white text-purple-700 shadow-sm" 
                    : "text-gray-600 hover:text-gray-800"}`}
              >
                <FileText className="w-5 h-5" />
                <span>SRT Format</span>
              </button>
              <button
                onClick={() => setSubtitleFormat("vtt")}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition flex items-center justify-center gap-2
                  ${subtitleFormat === "vtt" 
                    ? "bg-white text-purple-700 shadow-sm" 
                    : "text-gray-600 hover:text-gray-800"}`}
              >
                <Languages className="w-5 h-5" />
                <span>VTT Format</span>
              </button>
            </div>

            {/* Info Card */}
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="rounded-full p-2 mr-3 bg-purple-100 text-purple-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">
                    Automatic Subtitle Generation
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Our AI will transcribe your video's speech and create perfectly timed subtitles in {subtitleFormat.toUpperCase()} format.
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
                  <span>Generate Subtitles</span>
                </>
              )}
            </button>
            
            {!taskId && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                You need to process a video first before generating subtitles.
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
      {(status === "processing" || status === "adjusting") && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-purple-100 p-4">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            {status === "adjusting" ? "Adjusting Subtitles" : "Generating Subtitles"}
          </h3>
          <p className="text-gray-600">
            {status === "adjusting" 
              ? `Adjusting subtitle timing by ${offsetSeconds > 0 ? '+' : ''}${offsetSeconds} seconds...` 
              : "Our AI is transcribing your video and creating perfectly timed subtitles."}
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
                <FileText className="w-5 h-5 text-purple-600" />
                <span>Video Subtitles</span>
              </h2>
              <span className="bg-purple-100 text-purple-700 py-1 px-3 rounded-full text-sm font-medium">
                {result.subtitle_format.toUpperCase()}
              </span>
            </div>
            
            {/* Language Info */}
            {result.original_language && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="rounded-full p-2 mr-3 bg-blue-100 text-blue-600">
                    <Languages className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">
                      Detected Language
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {result.original_language.toUpperCase()} was detected as the primary language in your video.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Timing Adjustment (Only show if we have results) */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                <span>Adjust Subtitle Timing</span>
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Fine-tune the timing of your subtitles if they appear too early or too late.
              </p>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Current Offset: <span className="font-medium">{offsetSeconds > 0 ? '+' : ''}{offsetSeconds}s</span></span>
                  <span className="text-gray-500 text-sm">{formatTime(offsetSeconds)}</span>
                </div>
                
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="0.5"
                  value={offsetSeconds}
                  onChange={(e) => setOffsetSeconds(parseFloat(e.target.value))}
                  className="w-full accent-purple-600"
                />
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Earlier (-20s)</span>
                  <span>No Change</span>
                  <span>Later (+20s)</span>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="w-1/4">
                    <button
                      onClick={() => setOffsetSeconds(Math.max(-20, offsetSeconds - 0.5))}
                      className="w-full py-2 px-3 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center"
                    >
                      <span>-0.5s</span>
                    </button>
                  </div>
                  
                  <div className="w-2/4 px-2">
                    <button
                      onClick={handleAdjustTiming}
                      disabled={isAdjusting || offsetSeconds === 0}
                      className={`w-full py-2 px-3 rounded font-medium flex items-center justify-center gap-2 
                        ${offsetSeconds === 0 
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                          : "bg-purple-600 hover:bg-purple-700 text-white"}`}
                    >
                      {isAdjusting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Adjusting...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Apply Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="w-1/4">
                    <button
                      onClick={() => setOffsetSeconds(Math.min(20, offsetSeconds + 0.5))}
                      className="w-full py-2 px-3 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium flex items-center justify-center"
                    >
                      <span>+0.5s</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={handleReset}
                className="px-5 py-2 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 font-medium transition"
              >
                Create New
              </button>
              
              <div className="flex gap-3">
                {result.subtitle_url && (
                  <a
                    href={`${API_BASE}${result.subtitle_url}`}
                    download
                    className="px-5 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition flex items-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Download Subtitles
                  </a>
                )}
                
                {result.video_url && (
                  <a
                    href={`${API_BASE}${result.video_url}`}
                    download
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Video
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}