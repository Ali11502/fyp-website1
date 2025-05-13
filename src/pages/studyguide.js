import React, { useState, useEffect } from "react";
import { BookOpen, Loader2, Download, Clock, Check, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTask } from "../TaskContext";

const API_BASE = "http://localhost:8000";

export default function EnhancedStudyGuide() {
  const { taskId } = useTask();
  const [sgTaskId, setSgTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [mdContent, setMdContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const handleGenerate = async () => {
    if (!taskId) {
      setError("Please process a video before generating a study guide.");
      return;
    }
    setError("");
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/study-guide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `HTTP ${res.status}`);
      }
      const { study_guide_task_id } = await res.json();
      setSgTaskId(study_guide_task_id);
      setStatus("processing");
    } catch (e) {
      setError(e.message);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!sgTaskId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/study-guide/status/${sgTaskId}`
        );
        const data = await res.json();
        setStatus(data.status);

        if (data.status === "completed") {
          clearInterval(interval);
          const mdRes = await fetch(
            `${API_BASE}${data.result.download_url}`
          );
          if (!mdRes.ok) throw new Error(`HTTP ${mdRes.status}`);
          setMdContent(await mdRes.text());
        }

        if (data.status === "failed") {
          clearInterval(interval);
          setError(data.error || "Study guide generation failed.");
        }
      } catch (e) {
        clearInterval(interval);
        setError(e.message);
      } finally {
        setIsGenerating(false);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [sgTaskId]);

  // Custom renderer for markdown sections
  const renderStudyGuide = () => {
    if (!mdContent) return null;

    // Parse the content to find sections
    const sections = {
      overview: "",
      objectives: "",
      summaries: "",
      quiz: "",
      answers: "",
      essay: "",
      glossary: ""
    };

    // Simple parser to identify sections
    const lines = mdContent.split('\n');
    let currentSection = "overview";
    
    lines.forEach(line => {
      if (line.startsWith('# ') || line.startsWith('## ')) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('overview')) currentSection = "overview";
        else if (lowerLine.includes('learning objectives')) currentSection = "objectives";
        else if (lowerLine.includes('section') && lowerLine.includes('summar')) currentSection = "summaries";
        else if (lowerLine.includes('quiz question')) currentSection = "quiz";
        else if (lowerLine.includes('quiz answer')) currentSection = "answers";
        else if (lowerLine.includes('essay question')) currentSection = "essay";
        else if (lowerLine.includes('glossary')) currentSection = "glossary";
      }
      
      sections[currentSection] += line + '\n';
    });
    
    // Title mapping for custom header display
    const sectionTitles = {
      overview: "Overview",
      objectives: "Learning Objectives",
      summaries: "Video Summaries",
      quiz: "Quiz Questions",
      answers: "Answer Key",
      essay: "Essay Questions",
      glossary: "Glossary of Key Terms"
    };
    
    return (
      <div className="space-y-6">
        {/* Tabs for navigating sections */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          <TabButton name="overview" label="Overview" active={activeTab} onClick={setActiveTab} />
          <TabButton name="objectives" label="Learning Objectives" active={activeTab} onClick={setActiveTab} />
          <TabButton name="summaries" label="Video Summaries" active={activeTab} onClick={setActiveTab} />
          <TabButton name="quiz" label="Quiz Questions" active={activeTab} onClick={setActiveTab} />
          <TabButton name="answers" label="Answer Key" active={activeTab} onClick={setActiveTab} />
          <TabButton name="essay" label="Essay Questions" active={activeTab} onClick={setActiveTab} />
          <TabButton name="glossary" label="Glossary" active={activeTab} onClick={setActiveTab} />
        </div>
        
        {/* Content area */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          {/* Custom section header */}
          <div className="mb-6">
            <h2 className="font-serif font-extrabold text-4xl text-purple-900 border-b-2 border-purple-200 pb-2 mb-2">
              {sectionTitles[activeTab]}
            </h2>
          </div>
          
          <div className="prose prose-headings:font-serif prose-headings:text-purple-900 prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-p:text-gray-700 prose-strong:text-purple-800 prose-strong:font-bold prose-ul:list-disc prose-ol:list-decimal max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {sections[activeTab]}
            </ReactMarkdown>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <a
            href={`${API_BASE}/api/study-guide/download/${sgTaskId}`}
            className="inline-flex items-center gap-2 py-3 px-6 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow-md font-bold text-lg"
          >
            <Download className="w-5 h-5" /> Download Study Guide
          </a>
          
          <div className="text-md text-gray-600 font-medium bg-gray-100 px-4 py-2 rounded-lg">
            Generated on {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 font-sans">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-purple-100 p-3 rounded-full">
          <BookOpen className="h-8 w-8 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 font-serif">Study Guide</h1>
          <p className="text-gray-600">Generate comprehensive learning materials from your video content</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!sgTaskId && (
        <div className="text-center py-16 bg-gradient-to-b from-purple-50 to-white rounded-xl border border-purple-100 mb-6">
          <h2 className="text-3xl font-extrabold text-purple-900 mb-4 font-serif">Ready to Enhance Your Learning?</h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
            Our AI-powered system will create a comprehensive study guide with learning objectives, 
            summaries, quiz questions, and more from your processed video.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-10 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-70 text-lg"
          >
            {isGenerating ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" /> Generating Study Guide...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <BookOpen className="w-6 h-6" /> Generate Study Guide
              </span>
            )}
          </button>
        </div>
      )}

      {status === "processing" && sgTaskId && (
        <div className="bg-white border-2 border-purple-200 rounded-lg p-8 text-center mb-6 shadow-lg">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-purple-600 rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-purple-900">Generating Your Study Guide</h3>
            <p className="text-gray-600 max-w-md text-lg">
              We're analyzing your video content and creating comprehensive study materials. 
              This may take a few minutes.
            </p>
            <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-4 py-2 rounded-full">
              <Clock className="w-5 h-5 animate-pulse" />
              <span className="font-bold">Processing...</span>
            </div>
          </div>
        </div>
      )}

      {mdContent && renderStudyGuide()}
    </div>
  );
}

// Tab button component
const TabButton = ({ name, label, active, onClick }) => (
  <button
    onClick={() => onClick(name)}
    className={`px-4 py-3 font-bold text-sm rounded-t-lg transition-colors ${
      active === name
        ? "text-purple-700 border-b-3 border-purple-600 bg-white"
        : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
    }`}
  >
    {label}
  </button>
);