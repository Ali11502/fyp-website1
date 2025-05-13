// import { useState } from 'react';

// const MeetingMinutes = () => {
//   const [podcastLanguage, setPodcastLanguage] = useState('English');
//   const [podcastLength, setPodcastLength] = useState('');
//   const [specialInstructions, setSpecialInstructions] = useState('');
//   const [isGenerating, setIsGenerating] = useState(false);

//   const handleGeneratePodcast = () => {
//     setIsGenerating(true);
//     // Simulate API call
//     setTimeout(() => {
//       setIsGenerating(false);
//       // Handle success
//     }, 2000);
//   };

//   return (
//     <div className="max-w-3xl mx-auto px-6 py-8">
//       <div className="text-center mb-6">
//         <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
//           <span className="text-2xl">⭐</span> 
//           Welcome to MeetingMinutes 
//           <span className="text-2xl">⭐</span>
//         </h1>
//         <p className="text-gray-600 mt-2">Meeting Minutes for your meetings in seconds</p>
//       </div>

//       <div className="space-y-6">
//         {/* Podcast Language */}
//         {/* <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Podcast Language:
//           </label>
//           <select
//             value={podcastLanguage}
//             onChange={(e) => setPodcastLanguage(e.target.value)}
//             className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
//           >
//             <option value="English">English</option>
//             <option value="Spanish">Spanish</option>
//             <option value="French">French</option>
//             <option value="German">German</option>
//             <option value="Chinese">Chinese</option>
//             <option value="Japanese">Japanese</option>
//           </select>
//         </div> */}

//         {/* Speaker Selection
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-4 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
//               Choose Speaker 1
//             </button>
//           </div>
//           <div>
//             <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-4 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
//               Choose Speaker 2
//             </button>
//           </div>
//         </div> */}

//         {/* Podcast Length
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Podcast Length
//           </label>
//           <select
//             value={podcastLength}
//             onChange={(e) => setPodcastLength(e.target.value)}
//             className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
//           >
//             <option value="" disabled>Select length</option>
//             <option value="short">Short (5-10 minutes)</option>
//             <option value="medium">Medium (10-20 minutes)</option>
//             <option value="long">Long (20-30 minutes)</option>
//           </select>
//         </div> */}

//         {/* Special Instructions
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Special Instructions (Optional)
//           </label>
//           <textarea
//             value={specialInstructions}
//             onChange={(e) => setSpecialInstructions(e.target.value)}
//             placeholder="Describe what you want your podcast to focus on, or leave blank to cover the full notes..."
//             className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[120px] resize-none"
//           />
//         </div> */}

//         {/* Generate Button */}
//         <button
//           onClick={handleGeneratePodcast}
//           disabled={isGenerating}
//           className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition duration-200"
//         >
//           {isGenerating ? 'Generating...' : 'Generate Minutes'}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default MeetingMinutes;

// src/components/MeetingMinutes.jsx
import React, { useState, useEffect } from "react";
import { useTask } from "../TaskContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Calendar, User, Loader2 } from "lucide-react";

const API_BASE = "http://localhost:8000";

export default function MeetingMinutes() {
  const { taskId } = useTask();

  const [format, setFormat] = useState("md");            // output format
  const [isGenerating, setIsGenerating] = useState(false);
  const [mmTaskId, setMmTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Kick off generation
  const handleGenerate = async () => {
    if (!taskId) {
      setError("Please process a video before generating minutes.");
      return;
    }
    setError("");
    setIsGenerating(true);
    setMmTaskId(null);
    setStatus(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/meeting-minutes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, format }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `HTTP ${res.status}`);
      }
      const { meeting_minutes_task_id } = await res.json();
      setMmTaskId(meeting_minutes_task_id);
      setStatus("processing");
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Poll for status and fetch result
  useEffect(() => {
    if (!mmTaskId) return;
    const iv = setInterval(async () => {
      try {
        const st = await fetch(
          `${API_BASE}/api/meeting-minutes/status/${mmTaskId}`
        ).then((r) => r.json());
        setStatus(st.status);

        if (st.status === "completed") {
          clearInterval(iv);
          const res = await fetch(
            `${API_BASE}/api/meeting-minutes/result/${mmTaskId}`
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setResult(await res.json());
        }
        if (st.status === "failed") {
          clearInterval(iv);
          setError(st.error || "Failed to generate minutes.");
        }
      } catch (e) {
        clearInterval(iv);
        setError(e.message);
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [mmTaskId]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <FileText className="h-8 w-8 text-purple-600" />
          Meeting Minutes
          <FileText className="h-8 w-8 text-purple-600" />
        </h1>
        <p className="text-gray-600">Generate structured meeting minutes in seconds</p>
      </div>

      {/* initial form */}
      {!mmTaskId && status !== "processing" && (
        <div className="space-y-4">
          {!taskId && (
            <p className="text-red-600 text-center">
              Please process a video first.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Output Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={!taskId}
            >
              <option value="md">Markdown (.md)</option>
              <option value="txt">Plain Text (.txt)</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !taskId}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg disabled:opacity-50 transition"
          >
            {isGenerating ? (
              <span className="inline-flex items-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Generating…
              </span>
            ) : (
              "Generate Minutes"
            )}
          </button>

          {error && (
            <p className="text-red-600 text-center">
              <strong>Error:</strong> {error}
            </p>
          )}
        </div>
      )}

      {/* processing state */}
      {status === "processing" && mmTaskId && (
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Loader2 className="animate-spin" />
          <span>Generating meeting minutes…</span>
        </div>
      )}

      {/* result display */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6 animate-fade-in">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-800">{result.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {result.date}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" /> {result.participants.join(", ")}
              </span>
            </div>
          </div>

          <div className="prose max-w-none">
            {format === "md" ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result.preview}
              </ReactMarkdown>
            ) : (
              <pre className="whitespace-pre-wrap text-gray-700">{result.preview}</pre>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <a
              href={`${API_BASE}${result.file_url}`}
              className="flex-1 inline-block text-purple-600 hover:underline"
            >
              📥 Download {format === "md" ? "Markdown" : "Text"} File
            </a>
            <button
              onClick={() => {
                setMmTaskId(null);
                setStatus(null);
                setResult(null);
                setError("");
              }}
              className="flex-1 mt-4 sm:mt-0 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg"
            >
              Generate New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
