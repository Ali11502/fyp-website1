// src/components/ChatBot.js
import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useTask } from '../TaskContext';

const ChatBot = () => {
  // Get location and task context
  const location = useLocation();
  const { taskId } = useTask(); // Get taskId from context
  
  // State management
  const [youtubeLink, setYoutubeLink] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [videoTitle, setVideoTitle] = useState('A simple way to break a bad habit | Judson Brewer | TED');
  const [proMode, setProMode] = useState(false);
  const [videoId, setVideoId] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const videoData = location.state;

  // Transcript text from the example
  const transcriptText = `When I was first learning to meditate, the instruction was to simply pay attention to my breath, and when my mind wandered, to bring it back. Sounded simple enough. Yet I'd sit on these silent retreats, sweating through T-shirts in the middle of winter. I'd take naps every chance I got because it was really hard work. Actually, it was exhausting. The instruction was simple enough but I was missing something really important. So why is it so hard to pay attention? Well, studies show that even when we're really trying to pay attention to something -- like maybe this talk -- at some point, about half of us will drift off into a daydream, or have this urge to check our Twitter feed. So what's going on here? It turns out that we're fighting one of the most evolutionarily-conserved learning processes currently known in science, one that's conserved back to the most basic nervous systems known to man. This reward-based learning process is called positive and negative reinforcement, and basically goes like this. We see some food that looks good, our brain says, "Calories! ... Survival!" ...`;
  
  // Suggested questions based on the example
  const suggestedQuestions = [
    "Can you summarize the key ideas?",
    "Explain reward-based learning simply.",
    "How does mindfulness break habits?"
  ];
  
  // Embedded chat API service functions
  const chatApiService = {
    /**
     * Send a message to the chat API and get a response
     * @param {Object} payload - The chat request payload
     * @returns {Promise<string>} - The AI's response message
     */
    async sendMessage(payload) {
      try {
        // Ensure taskId exists
        if (!payload.taskId) {
          throw new Error('Task ID is required but not provided');
        }
  
        // Prepare the request body based on the API schema
        const requestBody = {
          "type_id": "chat", // This remains as 'chat'
          "task_id": payload.taskId, // Task ID passed from context
          "message": payload.message, // The user's message to be sent to the chat API
          // Commenting out optional fields for now
          // ...(payload.videoId && { "video_id": payload.videoId }),  // Optional field: videoId, if it exists
          // ...(payload.transcript && { "transcript": payload.transcript }),  // Optional field: transcript, if it exists
          // ...(payload.proMode !== undefined && { "pro_mode": payload.proMode })  // Optional field: proMode, if it exists
        };
  
        // Make the API call
        const response = await fetch('http://127.0.0.1:8000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
  
        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }
  
        const data = await response.json();
        return data.response; // Based on the API response structure
      } catch (error) {
        console.error('Error calling chat API:', error);
        throw error;
      }
    }
  };

  // Embedded error message component
  const ErrorMessage = ({ message, onDismiss, duration = 5000 }) => {
    const [visible, setVisible] = useState(true);
  
    useEffect(() => {
      if (!message) return;
      
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }, [message, duration, onDismiss]);
  
    if (!visible || !message) return null;
  
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md max-w-md">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium">Error</p>
            <p className="text-sm">{message}</p>
          </div>
          <button 
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="ml-4 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      </div>
    );
  };
  
  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    // Get the YouTube link from location state
    const linkFromState = location.state?.youtubeLink;
    
    if (linkFromState) {
      setYoutubeLink(linkFromState);
      
      // Extract video ID from YouTube link
      const extractVideoId = (url) => {
        // Handle different YouTube URL formats
        const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
      };
      
      const id = extractVideoId(linkFromState);
      if (id) {
        setVideoId(id);
      } else {
        console.error('Invalid YouTube URL');
      }
    }
  }, [location]);

  // Function to call the chat API
  const callChatAPI = async (message) => {
    try {
      setLoading(true);
      setError('');
      
      // Check if taskId exists
      if (!taskId) {
        setError('No task ID available. Please create a task first.');
        return "Sorry, I can't process your request without an active task.";
      }
      
      // Use the embedded chat API service
      const response = await chatApiService.sendMessage({
        message,
        taskId, // Include the taskId from context
        videoId, // Use state variable directly
        transcript: transcriptText,
        proMode // Use state variable directly
      });
      
      return response;
    } catch (error) {
      console.error('Error calling chat API:', error);
      setError('Failed to connect to the chat server. Please try again later.');
      return "Sorry, I encountered an error processing your request.";
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (userMessage.trim()) {
      // Add user message to chat
      const newUserMessage = {
        id: Date.now(),
        text: userMessage,
        sender: 'user'
      };
      
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
      
      // Store the message and clear input
      const messageToSend = userMessage;
      setUserMessage('');
      
      // Call API and get response
      const botResponse = await callChatAPI(messageToSend);
      
      // Add bot response to chat
      const newBotMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot'
      };
      
      setMessages(prevMessages => [...prevMessages, newBotMessage]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question) => {
    setUserMessage(question);
  };

  return (
    <div className="flex flex-col h-screen p-4 max-w-screen-2xl mx-auto">
      <div className="flex flex-1 gap-6">
        {/* Left panel with video */}
        <div className="w-2/5 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          {/* Video section */}
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Your Uploaded Video</h2>
            <div className="relative pb-9/16 h-80">
              {videoId ? (
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                  No video loaded or invalid YouTube URL
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right panel with chat interface - WIDENED from 1/3 to 3/5 */}
        <div className="w-3/5 flex flex-col">
          {/* Task status indicator */}
          <div className={`p-2 mb-2 rounded-lg text-sm ${taskId ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${taskId ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <p>{taskId ? `Task ID: ${taskId}` : 'No active task - Create a task first'}</p>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-gray-700">Ask me any question about your notes or content!</p>
          </div>
          
          {/* Chat area - Make taller with more space for messages */}
          <div className="flex-1 mb-4 overflow-auto bg-white rounded-lg shadow-sm border p-4 min-h-96">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 italic mt-4">
                Start a conversation by asking a question
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`${
                      msg.sender === 'user' 
                        ? 'bg-purple-100 ml-auto' 
                        : 'bg-gray-100 mr-auto'
                    } p-4 rounded-lg max-w-[85%]`}
                  >
                    <p className="text-gray-800">{msg.text}</p>
                  </div>
                ))}
                {loading && (
                  <div className="bg-gray-100 p-3 rounded-lg max-w-[85%] mr-auto">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Suggested questions in a horizontal row */}
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm flex-grow"
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>
          
          {/* Improved input area */}
          <div className="relative">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a question here..."
              className="w-full bg-gray-100 border-gray-200 rounded-full py-3 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
              disabled={loading}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <button 
                onClick={handleSendMessage}
                className={`${
                  loading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'
                } text-white p-3 rounded-full transition-colors`}
                disabled={loading}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          
          {/* Pro mode toggle with improved layout */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="proMode"
                checked={proMode}
                onChange={() => setProMode(!proMode)}
                className="mr-2 h-4 w-4 text-purple-600 rounded"
              />
              <label htmlFor="proMode" className="text-gray-700">Pro Mode</label>
            </div>
            
            
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <ErrorMessage 
          message={error} 
          onDismiss={() => setError('')} 
        />
      )}
    </div>
  );
};

export default ChatBot;