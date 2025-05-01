import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Loader2, PlayCircle } from 'lucide-react';
import { useTask } from '../TaskContext';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

const InteractiveChatBot = () => {
  const location = useLocation();
  const { taskId } = useTask(); // Get taskId from context instead of location state
  const [youtubeLink, setYoutubeLink] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoId, setVideoId] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [proMode, setProMode] = useState(false);

  // Suggested questions based on typical video content
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "Can you summarize the key ideas?",
    "What are the main points covered?",
    "How does this relate to real-world applications?"
  ]);

  useEffect(() => {
    // Get data from location state
    if (location.state) {
      // Set video title if available
      if (location.state.videoInfo?.title) {
        setVideoTitle(location.state.videoInfo.title);
      }

      // Set YouTube link if available
      if (location.state.youtubeLink) {
        setYoutubeLink(location.state.youtubeLink);
        
        // Extract video ID from YouTube link
        const extractVideoId = (url) => {
          const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
          const match = url.match(regExp);
          return (match && match[2].length === 11) ? match[2] : null;
        };
        
        const id = extractVideoId(location.state.youtubeLink);
        if (id) {
          setVideoId(id);
        }
      }
    }

    // Initialize chat with welcome message if taskId is available
    if (taskId) {
      setMessages([
        {
          type: 'system',
          content: `I've analyzed "${location.state?.videoInfo?.title || 'your video'}". Ask me any questions about it!`,
          timestamp: new Date().toISOString()
        }
      ]);
    } else {
      setError('No task ID available. Please process a video first.');
    }
  }, [location, taskId]);

  // Process Q&A request
  const processQuestion = async (question) => {
    if (!taskId) {
      setError('No task ID available. Please process a video first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Send the question to the interactive Q&A API
      const processResponse = await fetch(`${API_BASE_URL}/api/interactive-qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskId,
          question: question,
          generate_clip: true // Always true as per requirement
        }),
      });

      if (!processResponse.ok) {
        throw new Error(`Failed to process question: ${processResponse.status}`);
      }

      const processData = await processResponse.json();
      const qaTaskId = processData.qa_task_id;

      if (!qaTaskId) {
        throw new Error('No QA task ID returned from the server');
      }

      // Step 2: Poll for the Q&A result
      const result = await pollQAStatus(qaTaskId);
      
      // Step 3: Add the response to messages
      setMessages(prevMessages => [
        ...prevMessages,
        {
          type: 'user',
          content: question,
          timestamp: new Date().toISOString()
        },
        {
          type: 'assistant',
          content: result.answer,
          timestamp: new Date().toISOString(),
          timeStamps: result.timeStamps || [],
          clipPath: result.clip_url
        }
      ]);
    } catch (err) {
      console.error('Error processing question:', err);
      setError(err.message || 'Failed to get an answer. Please try again.');
      
      // Add error message to chat
      setMessages(prevMessages => [
        ...prevMessages,
        {
          type: 'user',
          content: question,
          timestamp: new Date().toISOString()
        },
        {
          type: 'error',
          content: err.message || 'Failed to get an answer. Please try again.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Poll for Q&A status with exponential backoff
  const pollQAStatus = async (qaTaskId, maxAttempts = 15) => {
    let attempts = 0;
    let interval = 1000; // Start with 1 second
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/interactive-qa/status/${qaTaskId}`);
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'completed') {
          // Format the result
          return {
            answer: data.answer || 'No answer available.',
            timeStamps: data.time_stamps || [],
            clip_url: data.clip_url || null
          };
        } else if (data.status === 'failed') {
          throw new Error(data.message || 'Processing failed');
        }
        
        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, interval));
        
        // Increase interval with each attempt (exponential backoff)
        interval = Math.min(interval * 1.5, 5000); // Cap at 5 seconds
        attempts++;
      } catch (err) {
        console.error('Polling error:', err);
        attempts++;
        
        // If max attempts reached, throw error
        if (attempts >= maxAttempts) {
          throw err;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, interval));
        
        // Increase interval with each failed attempt
        interval = Math.min(interval * 2, 5000); // Cap at 5 seconds
      }
    }
    
    throw new Error('Processing timed out. Please try again.');
  };

  const handleSendMessage = () => {
    if (userMessage.trim()) {
      processQuestion(userMessage.trim());
      setUserMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question) => {
    setUserMessage(question);
    processQuestion(question);
    setUserMessage('');
  };

  const handlePlayClip = (clipPath) => {
    if (clipPath) {
      // Logic to play the clip - could open in a new window or modal
      window.open(clipPath, '_blank');
    }
  };

  // Function to format messages in chat
  const renderMessages = () => {
    return messages.map((message, index) => {
      if (message.type === 'system') {
        return (
          <div key={index} className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-gray-700">{message.content}</p>
          </div>
        );
      } else if (message.type === 'user') {
        return (
          <div key={index} className="bg-purple-100 p-4 rounded-lg mb-4 ml-auto max-w-[80%]">
            <p className="text-purple-900">{message.content}</p>
          </div>
        );
      } else if (message.type === 'assistant') {
        return (
          <div key={index} className="bg-white p-4 rounded-lg mb-4 border border-gray-200 max-w-[80%]">
            <p className="text-gray-800 mb-3">{message.content}</p>
            
            {message.timeStamps && message.timeStamps.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Relevant timestamps:</p>
                <div className="flex flex-wrap gap-2">
                  {message.timeStamps.map((timestamp, idx) => (
                    <button 
                      key={idx}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded"
                      onClick={() => {
                        // Logic to jump to timestamp
                        console.log(`Jump to timestamp: ${timestamp}`);
                      }}
                    >
                      {timestamp}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {message.clipPath && (
              <button 
                className="mt-3 flex items-center text-sm text-purple-600 hover:text-purple-800"
                onClick={() => handlePlayClip(message.clipPath)}
              >
                <PlayCircle size={16} className="mr-1" /> Play relevant clip
              </button>
            )}
          </div>
        );
      } else if (message.type === 'error') {
        return (
          <div key={index} className="bg-red-50 p-4 rounded-lg mb-4 border border-red-200 max-w-[80%]">
            <p className="text-red-600">{message.content}</p>
          </div>
        );
      }
      return null;
    });
  };

  return (
    <div className="flex flex-col h-screen p-4 max-w-7xl mx-auto">
      <div className="flex flex-1 gap-4">
        {/* Video display - would be embedded in a real app */}
        {videoId && (
          <div className="w-1/2 hidden md:block">
            <div className="bg-black rounded-lg overflow-hidden aspect-video mb-4">
              <iframe
                title="YouTube video player"
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">{videoTitle}</h2>
            <p className="text-sm text-gray-500 mb-4">
              Ask questions about this video using the chat interface
            </p>
          </div>
        )}
        
        {/* Right panel with chat interface */}
        <div className={`${videoId ? 'w-1/2 md:block' : 'w-full'} flex flex-col`}>
          {/* Mobile view video title */}
          {videoId && (
            <div className="md:hidden mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{videoTitle}</h2>
            </div>
          )}
          
          {/* Chat messages area */}
          <div className="flex-1 mb-4 overflow-auto p-2 bg-gray-50 rounded-lg">
            {renderMessages()}
            {loading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin mr-2" />
                <p className="text-gray-600">Thinking...</p>
              </div>
            )}
          </div>
          
          {/* Error message */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <p>{error}</p>
            </div>
          )}
          
          {/* Suggested questions */}
          {!loading && suggestedQuestions.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600 mb-1">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Input area */}
          <div className="relative">
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a question about the video..."
              className="w-full bg-white border border-gray-300 rounded-lg py-3 pl-4 pr-12 focus:outline-none focus:border-purple-500 resize-none h-12"
              disabled={loading}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
              <button 
                onClick={handleSendMessage}
                disabled={loading || !userMessage.trim()}
                className={`${
                  loading || !userMessage.trim() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white p-2 rounded-full`}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
          
          {/* Pro mode toggle */}
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="proMode"
              checked={proMode}
              onChange={() => setProMode(!proMode)}
              className="mr-2"
            />
            <label htmlFor="proMode" className="text-gray-700 text-sm">Pro Mode</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveChatBot;