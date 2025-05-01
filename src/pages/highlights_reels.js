import { useState, useEffect } from 'react';
import { Highlighter, Video, Film, Clock, Download, RefreshCw } from 'lucide-react';
import { useParams, useLocation } from 'react-router-dom';

const HighlightsReel = () => {
  const { state } = useLocation();
  const { taskId } = useParams();
  
  // States
  const [selectedOption, setSelectedOption] = useState('highlights');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [duration, setDuration] = useState('60');
  const [highlightsTaskId, setHighlightsTaskId] = useState(null);
  const [highlightsStatus, setHighlightsStatus] = useState(null);
  const [highlightsResult, setHighlightsResult] = useState(null);
  const [error, setError] = useState(null);
  const [isAlgorithmic, setIsAlgorithmic] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [pollInterval, setPollInterval] = useState(null);

  // Video data from state or default values
  const videoData = state?.videoInfo || {
    title: "Video Title",
    duration: "00:00",
    thumbnailUrl: "/api/placeholder/400/320"
  };

  // Initial task ID from navigation state
  useEffect(() => {
    if (state?.taskId) {
      // We have a processed video task ID from navigation
      console.log('Video processing task ID:', state.taskId);
    }
  }, [state]);

  // Status polling effect
  useEffect(() => {
    if (highlightsTaskId && !highlightsResult) {
      // Start polling for status
      const interval = setInterval(checkHighlightsStatus, 5000);
      setPollInterval(interval);
      return () => clearInterval(interval);
    }
    return () => {};
  }, [highlightsTaskId]);

  // Check highlights status
  const checkHighlightsStatus = async () => {
    if (!highlightsTaskId) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/highlights/status/${highlightsTaskId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch highlights status');
      }
      
      const statusData = await response.json();
      setHighlightsStatus(statusData);
      
      console.log('Highlights status:', statusData);
      
      if (statusData.status === 'completed') {
        // Clear interval and fetch results
        if (pollInterval) clearInterval(pollInterval);
        await fetchHighlightsResult();
      } else if (statusData.status === 'failed') {
        if (pollInterval) clearInterval(pollInterval);
        setError('Highlights generation failed: ' + (statusData.error || 'Unknown error'));
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Error checking highlights status:', error);
      setError(error.message || 'Failed to check highlights status');
      setIsGenerating(false);
    }
  };

  // Fetch highlights result
  const fetchHighlightsResult = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/highlights/result/${highlightsTaskId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch highlights result');
      }
      
      const resultData = await response.json();
      setHighlightsResult(resultData);
      setGeneratedContent(selectedOption);
      setIsGenerating(false);
      
      console.log('Highlights result:', resultData);
    } catch (error) {
      console.error('Error fetching highlights result:', error);
      setError(error.message || 'Failed to fetch highlights result');
      setIsGenerating(false);
    }
  };

  // Generate highlights
  const handleGenerate = async () => {
    if (!state?.taskId) {
      setError('No video task ID available. Please upload a video first.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setHighlightsResult(null);
    
    try {
      const requestBody = {
        task_id: state.taskId,
        duration_seconds: parseInt(duration, 10),
        custom_prompt: customPrompt || undefined,
        use_algorithmic: isAlgorithmic,
        is_reel: selectedOption === 'reels'
      };
      
      console.log('Sending highlights request:', requestBody);
      
      const response = await fetch('http://127.0.0.1:8000/api/highlights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error('Failed to start highlights generation');
      }
      
      const data = await response.json();
      setHighlightsTaskId(data.highlights_task_id);
      
      console.log('Highlights generation started, task ID:', data.highlights_task_id);
    } catch (error) {
      console.error('Error generating highlights:', error);
      setError(error.message || 'Failed to generate highlights');
      setIsGenerating(false);
    }
  };

  // Download highlights
  const handleDownload = () => {
    if (!highlightsTaskId) return;
    
    window.location.href = `http://127.0.0.1:8000/api/highlights/download/${highlightsTaskId}`;
  };

  // Reset and create new highlights
  const handleReset = () => {
    setGeneratedContent(null);
    setHighlightsTaskId(null);
    setHighlightsStatus(null);
    setHighlightsResult(null);
    setError(null);
    if (pollInterval) clearInterval(pollInterval);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        {selectedOption === 'highlights' ? (
          <Highlighter className="h-10 w-10 text-yellow-500" />
        ) : (
          <Film className="h-10 w-10 text-blue-500" />
        )}
        <h1 className="text-3xl font-bold text-gray-800">
          {selectedOption === 'highlights' ? 'Highlights' : 'Reels'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {!generatedContent ? (
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="mb-8">
            <p className="text-gray-700 mb-4">Generate concise video highlights or a dynamic reel from your content</p>
            
            {/* Video information */}
            <div className="bg-gray-100 rounded-lg p-4 flex items-start mb-8">
              <div className="mr-4 w-1/4">
                <div className="aspect-video bg-gray-300 rounded-lg flex items-center justify-center">
                  {state?.videoUrl ? (
                    <video 
                      src={state.videoUrl} 
                      className="h-full w-full object-cover rounded-lg"
                      preload="metadata"
                    />
                  ) : (
                    <Video className="h-8 w-8 text-gray-500" />
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">{state?.videoName || videoData.title}</h3>
                <div className="flex items-center text-gray-600 text-sm mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{videoData.duration}</span>
                </div>
                {state?.taskId ? (
                  <span className="text-xs text-green-600 mt-2 block">
                    ✓ Video processed successfully
                  </span>
                ) : (
                  <span className="text-xs text-red-600 mt-2 block">
                    No video selected or processed
                  </span>
                )}
              </div>
            </div>
            
            {/* Option selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to generate?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className={`flex flex-col items-center p-4 rounded-lg border transition ${
                    selectedOption === 'highlights'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedOption('highlights')}
                >
                  <Highlighter className="h-6 w-6 mb-2" />
                  <span className="font-medium">Highlights</span>
                  <span className="text-xs text-gray-500 mt-1">Key moments from your video</span>
                </button>
                
                <button
                  className={`flex flex-col items-center p-4 rounded-lg border transition ${
                    selectedOption === 'reels'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedOption('reels')}
                >
                  <Film className="h-6 w-6 mb-2" />
                  <span className="font-medium">Reels</span>
                  <span className="text-xs text-gray-500 mt-1">Short, engaging video clips</span>
                </button>
              </div>
            </div>
            
            {/* Duration selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="15"
                max="300"
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Algorithmic toggle */}
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  id="algorithmic"
                  type="checkbox"
                  checked={isAlgorithmic}
                  onChange={(e) => setIsAlgorithmic(e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="algorithmic" className="ml-2 block text-sm text-gray-700">
                  Use fast algorithmic method
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Faster processing but may be less semantically accurate
              </p>
            </div>

            {/* Custom prompt */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom instructions (optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="E.g., Focus on technical explanations, or only include parts about specific topics"
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
              />
            </div>
            
            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !state?.taskId}
              className={`w-full ${
                isGenerating || !state?.taskId
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </span>
              ) : (
                `Generate ${selectedOption === 'highlights' ? 'Highlights' : 'Reel'}`
              )}
            </button>
            {!state?.taskId && (
              <p className="text-xs text-red-500 mt-2 text-center">
                Please upload and process a video first
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-6 animate-fade-in">
          {/* Show different content based on what was generated */}
          {selectedOption === 'highlights' ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Video Highlights</h2>
              
              {highlightsResult?.segments && (
                <div className="space-y-4">
                  {highlightsResult.segments.map((segment, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="bg-yellow-50 border-b px-4 py-2 flex justify-between items-center">
                        <span className="font-medium">Key Moment {index + 1}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(segment.start_time * 1000).toISOString().substr(14, 5)} - 
                          {new Date(segment.end_time * 1000).toISOString().substr(14, 5)}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-gray-700">{segment.description || 'No description available'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!highlightsResult?.segments && (
                <div className="flex flex-col items-center justify-center py-8">
                  <RefreshCw className="h-10 w-10 text-purple-500 animate-spin mb-4" />
                  <p className="text-gray-600">Processing your highlights...</p>
                  {highlightsStatus && (
                    <p className="text-sm text-gray-500 mt-2">
                      Status: {highlightsStatus.status}
                      {highlightsStatus.progress && ` (${Math.round(highlightsStatus.progress * 100)}%)`}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex space-x-4 mt-6">
                {highlightsResult?.download_url && (
                  <button
                    onClick={handleDownload}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none flex items-center justify-center"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Highlights
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg focus:outline-none"
                >
                  Generate New Highlights
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Video Reel Generated</h2>
              
              {highlightsResult?.download_url ? (
                <div>
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-6">
                    {/* In production, this would be a video player with the actual reel */}
                    <video
                      controls
                      className="w-full h-full object-contain"
                      src={`http://127.0.0.1:8000${highlightsResult.download_url}`}
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-gray-800 mb-2">Reel Details</h3>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li><span className="font-medium">Duration:</span> {highlightsResult.duration_seconds} seconds</li>
                      <li><span className="font-medium">Clips included:</span> {highlightsResult.segments?.length || 0}</li>
                      <li><span className="font-medium">Generated:</span> {new Date(highlightsResult.created_at).toLocaleString()}</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <RefreshCw className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-600">Processing your reel...</p>
                  {highlightsStatus && (
                    <p className="text-sm text-gray-500 mt-2">
                      Status: {highlightsStatus.status}
                      {highlightsStatus.progress && ` (${Math.round(highlightsStatus.progress * 100)}%)`}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex space-x-4">
                {highlightsResult?.download_url && (
                  <button 
                    onClick={handleDownload}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none flex items-center justify-center"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Reel
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg focus:outline-none"
                >
                  Create New Reel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HighlightsReel;