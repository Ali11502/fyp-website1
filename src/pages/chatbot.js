// // src/components/ChatBot.js
// import { useEffect, useState, useRef } from 'react';
// import { useLocation } from 'react-router-dom';
// import { Send, ThumbsUp, ThumbsDown, Copy } from 'lucide-react';
// import { useTask } from '../TaskContext';

// const ChatBot = () => {
//   // Get location and task context
//   const location = useLocation();
//   const { taskId } = useTask(); // Get taskId from context but don't display it
  
//   // State management
//   const [youtubeLink, setYoutubeLink] = useState('');
//   const [userMessage, setUserMessage] = useState('');
//   const [videoTitle, setVideoTitle] = useState('A simple way to break a bad habit | Judson Brewer | TED');
//   const [proMode, setProMode] = useState(false);
//   const [videoId, setVideoId] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [suggestedQuestions, setSuggestedQuestions] = useState([]);
//   const [loadingQuestions, setLoadingQuestions] = useState(false);
//   const messagesEndRef = useRef(null);
//   const inputRef = useRef(null);

//   const videoData = location.state;

//   // Transcript text from the example
//   const transcriptText = `When I was first learning to meditate, the instruction was to simply pay attention to my breath, and when my mind wandered, to bring it back. Sounded simple enough. Yet I'd sit on these silent retreats, sweating through T-shirts in the middle of winter. I'd take naps every chance I got because it was really hard work. Actually, it was exhausting. The instruction was simple enough but I was missing something really important. So why is it so hard to pay attention? Well, studies show that even when we're really trying to pay attention to something -- like maybe this talk -- at some point, about half of us will drift off into a daydream, or have this urge to check our Twitter feed. So what's going on here? It turns out that we're fighting one of the most evolutionarily-conserved learning processes currently known in science, one that's conserved back to the most basic nervous systems known to man. This reward-based learning process is called positive and negative reinforcement, and basically goes like this. We see some food that looks good, our brain says, "Calories! ... Survival!" ...`;
  
//   // Embedded chat API service functions
//   const chatApiService = {
//     async sendMessage(payload) {
//       try {
//         // Ensure taskId exists
//         if (!payload.taskId) {
//           throw new Error('Task ID is required but not provided');
//         }
  
//         const requestBody = {
//           "type_id": "chat",
//           "task_id": payload.taskId,
//           "message": payload.message,
//           ...(payload.videoId && { "video_id": payload.videoId }),
//           ...(payload.transcript && { "transcript": payload.transcript }),
//           ...(payload.proMode !== undefined && { "pro_mode": payload.proMode })
//         };
  
//         const response = await fetch('http://127.0.0.1:8000/api/chat', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(requestBody),
//         });
  
//         if (!response.ok) {
//           throw new Error(`API call failed with status: ${response.status}`);
//         }
  
//         const data = await response.json();
//         return data.response;
//       } catch (error) {
//         console.error('Error calling chat API:', error);
//         throw error;
//       }
//     },
    
//     // New function to fetch suggested questions
//     async fetchSuggestedQuestions(taskId) {
//       try {
//         if (!taskId) {
//           throw new Error('Task ID is required but not provided');
//         }
        
//         const response = await fetch('http://127.0.0.1:8000/api/suggested-questions', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             task_id: taskId
//           }),
//         });
        
//         if (!response.ok) {
//           throw new Error(`API call failed with status: ${response.status}`);
//         }
        
//         const data = await response.json();
//         return data.questions;
//       } catch (error) {
//         console.error('Error fetching suggested questions:', error);
//         throw error;
//       }
//     }
//   };

//   // Enhanced Error Message Component
//   const ErrorMessage = ({ message, onDismiss, duration = 5000 }) => {
//     const [visible, setVisible] = useState(true);
  
//     useEffect(() => {
//       if (!message) return;
      
//       const timer = setTimeout(() => {
//         setVisible(false);
//         onDismiss();
//       }, duration);
      
//       return () => clearTimeout(timer);
//     }, [message, duration, onDismiss]);
  
//     if (!visible || !message) return null;
  
//     return (
//       <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg max-w-md animate-fadeIn">
//         <div className="flex justify-between items-start">
//           <div className="flex-1">
//             <p className="font-semibold">Error</p>
//             <p className="text-sm">{message}</p>
//           </div>
//           <button 
//             onClick={() => {
//               setVisible(false);
//               onDismiss();
//             }}
//             className="ml-4 text-red-500 hover:text-red-700 transition-colors"
//           >
//             ×
//           </button>
//         </div>
//       </div>
//     );
//   };
  
//   // Function to scroll to the bottom of the messages
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   // Effect to scroll to bottom when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);
  
//   // Focus input when component mounts
//   useEffect(() => {
//     inputRef.current?.focus();
//   }, []);
  
//   useEffect(() => {
//     // Get the YouTube link from location state
//     const linkFromState = location.state?.youtubeLink;
    
//     if (linkFromState) {
//       setYoutubeLink(linkFromState);
      
//       // Extract video ID from YouTube link
//       const extractVideoId = (url) => {
//         const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
//         const match = url.match(regExp);
//         return (match && match[2].length === 11) ? match[2] : null;
//       };
      
//       const id = extractVideoId(linkFromState);
//       if (id) {
//         setVideoId(id);
//       } else {
//         console.error('Invalid YouTube URL');
//       }
//     }
//   }, [location]);
  
//   // New effect to fetch suggested questions when taskId is available
//   useEffect(() => {
//     const fetchQuestions = async () => {
//       if (!taskId) return;
      
//       try {
//         setLoadingQuestions(true);
//         const questions = await chatApiService.fetchSuggestedQuestions(taskId);
//         setSuggestedQuestions(questions);
//       } catch (err) {
//         console.error('Failed to fetch suggested questions:', err);
//         setError('Failed to load suggested questions. Using defaults instead.');
//         // Fallback questions if API fails
//         setSuggestedQuestions([
//           "What is this video about?",
//           "Can you summarize the key points?",
//           "What are the main takeaways?"
//         ]);
//       } finally {
//         setLoadingQuestions(false);
//       }
//     };
    
//     fetchQuestions();
//   }, [taskId]);

//   // Function to call the chat API
//   const callChatAPI = async (message) => {
//     try {
//       setLoading(true);
//       setError('');
      
//       // Check if taskId exists
//       if (!taskId) {
//         setError('Please start a new conversation before sending messages.');
//         return "I can't process your request right now. Please try again in a moment.";
//       }
      
//       // Use the embedded chat API service
//       const response = await chatApiService.sendMessage({
//         message,
//         taskId,
//         videoId,
//         transcript: transcriptText,
//         proMode
//       });
      
//       return response;
//     } catch (error) {
//       console.error('Error calling chat API:', error);
//       setError('Failed to connect to the chat server. Please try again later.');
//       return "Sorry, I encountered an error processing your request.";
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSendMessage = async () => {
//     if (userMessage.trim()) {
//       // Add user message to chat
//       const newUserMessage = {
//         id: Date.now(),
//         text: userMessage,
//         sender: 'user'
//       };
      
//       setMessages(prevMessages => [...prevMessages, newUserMessage]);
      
//       // Store the message and clear input
//       const messageToSend = userMessage;
//       setUserMessage('');
      
//       // Call API and get response
//       const botResponse = await callChatAPI(messageToSend);
      
//       // Add bot response to chat
//       const newBotMessage = {
//         id: Date.now() + 1,
//         text: botResponse,
//         sender: 'bot'
//       };
      
//       setMessages(prevMessages => [...prevMessages, newBotMessage]);
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter') {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   const handleSuggestedQuestion = (question) => {
//     setUserMessage(question);
//     // Focus the input after selecting a question
//     inputRef.current?.focus();
//   };
  
//   // Copy message content to clipboard
//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text)
//       .then(() => {
//         // Could show a small notification here
//       })
//       .catch(err => {
//         console.error('Failed to copy text: ', err);
//       });
//   };

//   return (
//     <div className="flex flex-col h-screen max-w-6xl mx-auto bg-gray-50 p-6">
//       {/* Main content area with centered video on top and chat below */}
//       <div className="flex flex-col flex-1 gap-6">
//         {/* Video section - Centered at the top */}
//         <div className="w-full bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
//           <div className="p-4">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
//               <span className="w-2 h-8 bg-purple-600 rounded mr-2"></span>
//               {videoTitle}
//             </h2>
//             <div className="relative pb-9/16 h-96 w-full max-w-3xl mx-auto">
//               {videoId ? (
//                 <iframe 
//                   className="absolute inset-0 w-full h-full rounded-lg"
//                   src={`https://www.youtube.com/embed/${videoId}`}
//                   title="YouTube video player"
//                   frameBorder="0"
//                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                   allowFullScreen
//                 ></iframe>
//               ) : (
//                 <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg">
//                   <div className="text-center p-6">
//                     <div className="mb-4 text-purple-500">
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
//                       </svg>
//                     </div>
//                     <p className="font-medium">No video loaded</p>
//                     <p className="text-sm mt-2">Please enter a valid YouTube URL to get started</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
          
//         {/* Chat interface - Full width below video */}
//         <div className="flex flex-col flex-1 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
//           {/* Introduction banner */}
//           <div className="p-4 bg-gradient-to-r from-purple-700 to-purple-500 text-white">
//             <div className="flex items-center">
//               <div className="mr-4">
//                 <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
//                   </svg>
//                 </div>
//               </div>
//               <div>
//                 <h3 className="font-medium">Video Assistant</h3>
//                 <p className="text-sm text-purple-100">Ask me any question about the video content!</p>
//               </div>
//             </div>
//           </div>
          
//           {/* Chat messages area */}
//           <div className="flex-1 overflow-auto p-4 bg-gray-50 min-h-96">
//             {messages.length === 0 ? (
//               <div className="flex flex-col items-center justify-center h-full text-gray-400">
//                 <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                   </svg>
//                 </div>
//                 <p className="text-center font-medium">Start a conversation</p>
//                 <p className="text-center text-sm mt-2">Ask questions about the video or select a suggestion below</p>
//               </div>
//             ) : (
//               <div className="space-y-6">
//                 {messages.map((msg) => (
//                   <div 
//                     key={msg.id} 
//                     className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
//                   >
//                     <div className={`
//                       ${msg.sender === 'user' 
//                         ? 'bg-purple-100 border-purple-200 text-purple-900' 
//                         : 'bg-white border-gray-200 text-gray-800'
//                       } 
//                       border rounded-2xl py-3 px-4 max-w-[80%] shadow-sm
//                     `}>
//                       <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      
//                       {/* Message actions for bot messages */}
//                       {msg.sender === 'bot' && (
//                         <div className="flex items-center justify-end mt-2 text-gray-400 text-xs">
//                           <button 
//                             onClick={() => copyToClipboard(msg.text)}
//                             className="flex items-center hover:text-purple-600 mr-3 transition-colors"
//                           >
//                             <Copy size={14} className="mr-1" />
//                             <span>Copy</span>
//                           </button>
//                           <div className="flex items-center space-x-2">
//                             <button className="hover:text-green-600 transition-colors">
//                               <ThumbsUp size={14} />
//                             </button>
//                             <button className="hover:text-red-600 transition-colors">
//                               <ThumbsDown size={14} />
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//                 {loading && (
//                   <div className="flex justify-start">
//                     <div className="bg-white border border-gray-200 rounded-2xl py-4 px-5 max-w-[80%] shadow-sm">
//                       <div className="flex space-x-2 items-center">
//                         <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"></div>
//                         <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce delay-100"></div>
//                         <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce delay-200"></div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//                 <div ref={messagesEndRef} />
//               </div>
//             )}
//           </div>
          
//           {/* Suggested questions - scrollable horizontal row */}
//           <div className="p-3 border-t border-gray-200 overflow-x-auto whitespace-nowrap">
//             <div className="flex gap-2">
//               {loadingQuestions ? (
//                 <div className="text-sm text-gray-500 py-2 px-4">Loading suggested questions...</div>
//               ) : suggestedQuestions.length > 0 ? (
//                 suggestedQuestions.map((question, index) => (
//                   <button
//                     key={index}
//                     className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-full text-sm flex-shrink-0 transition-colors border border-gray-200"
//                     onClick={() => handleSuggestedQuestion(question)}
//                   >
//                     {question}
//                   </button>
//                 ))
//               ) : (
//                 <div className="text-sm text-gray-500 py-2 px-4">No suggested questions available</div>
//               )}
//             </div>
//           </div>
          
//           {/* Input area with Pro Mode toggle */}
//           <div className="p-4 bg-white border-t border-gray-200">
//             <div className="flex items-center">
//               <div className="relative flex-1">
//                 <input
//                   ref={inputRef}
//                   type="text"
//                   value={userMessage}
//                   onChange={(e) => setUserMessage(e.target.value)}
//                   onKeyDown={handleKeyDown}
//                   placeholder="Type your question here..."
//                   className="w-full bg-gray-100 border border-gray-200 rounded-full py-3 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
//                   disabled={loading}
//                 />
//                 <button 
//                   onClick={handleSendMessage}
//                   className={`absolute right-2 top-1/2 transform -translate-y-1/2
//                     ${loading 
//                       ? 'bg-gray-400 cursor-not-allowed' 
//                       : 'bg-purple-600 hover:bg-purple-700'
//                     } text-white p-2.5 rounded-full transition-colors`}
//                   disabled={loading}
//                 >
//                   <Send size={18} />
//                 </button>
//               </div>
//             </div>
            
//             {/* Pro mode toggle */}
//             <div className="mt-3 flex items-center justify-between">
//               <div className="inline-flex items-center">
//                 <div className="relative inline-block w-10 mr-2 align-middle select-none">
//                   <input 
//                     type="checkbox" 
//                     id="proMode" 
//                     checked={proMode}
//                     onChange={() => setProMode(!proMode)}
//                     className="opacity-0 absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
//                   />
//                   <label 
//                     htmlFor="proMode" 
//                     className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${proMode ? 'bg-purple-600' : ''}`}
//                   >
//                     <span className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${proMode ? 'translate-x-4' : 'translate-x-0'}`}></span>
//                   </label>
//                 </div>
//                 <label htmlFor="proMode" className="text-sm font-medium text-gray-700">Pro Mode</label>
//                 <div className="ml-2 text-gray-500 text-xs">
//                   <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 text-purple-800">
//                     BETA
//                   </span>
//                 </div>
//               </div>
              
//               <div className="text-xs text-gray-500">
//                 Powered by AI
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
      
//       {/* Error message */}
//       {error && (
//         <ErrorMessage 
//           message={error} 
//           onDismiss={() => setError('')} 
//         />
//       )}
//     </div>
//   );
// };

// export default ChatBot;

// src/components/ChatBot.js
import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, ThumbsUp, ThumbsDown, Copy, MessageSquare } from 'lucide-react';
import { useTask } from '../TaskContext';

const ChatBot = () => {
  // Get location and task context
  const location = useLocation();
  const { taskId } = useTask();
  
  // State management
  const [youtubeLink, setYoutubeLink] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoId, setVideoId] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [displayedQuestions, setDisplayedQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const videoData = location.state;

  // Transcript text from the example
  const transcriptText = `When I was first learning to meditate, the instruction was to simply pay attention to my breath, and when my mind wandered, to bring it back. Sounded simple enough. Yet I'd sit on these silent retreats, sweating through T-shirts in the middle of winter. I'd take naps every chance I got because it was really hard work. Actually, it was exhausting. The instruction was simple enough but I was missing something really important. So why is it so hard to pay attention? Well, studies show that even when we're really trying to pay attention to something -- like maybe this talk -- at some point, about half of us will drift off into a daydream, or have this urge to check our Twitter feed. So what's going on here? It turns out that we're fighting one of the most evolutionarily-conserved learning processes currently known in science, one that's conserved back to the most basic nervous systems known to man. This reward-based learning process is called positive and negative reinforcement, and basically goes like this. We see some food that looks good, our brain says, "Calories! ... Survival!" ...`;
  
  // Embedded chat API service functions
  const chatApiService = {
    async sendMessage(payload) {
      try {
        // Ensure taskId exists
        if (!payload.taskId) {
          throw new Error('Task ID is required but not provided');
        }
  
        const requestBody = {
          "type_id": "chat",
          "task_id": payload.taskId,
          "message": payload.message,
          ...(payload.videoId && { "video_id": payload.videoId }),
          ...(payload.transcript && { "transcript": payload.transcript })
        };
  
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
        return data.response;
      } catch (error) {
        console.error('Error calling chat API:', error);
        throw error;
      }
    },
    
    // Function to fetch suggested questions
    async fetchSuggestedQuestions(taskId) {
      try {
        if (!taskId) {
          throw new Error('Task ID is required but not provided');
        }
        
        const response = await fetch('http://127.0.0.1:8000/api/suggested-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            task_id: taskId
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.questions;
      } catch (error) {
        console.error('Error fetching suggested questions:', error);
        throw error;
      }
    }
  };

  // Enhanced Error Message Component
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
      <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-lg max-w-md animate-fadeIn">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{message}</p>
          </div>
          <button 
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="ml-4 text-red-500 hover:text-red-700 transition-colors"
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
  
  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  useEffect(() => {
    // Get data from location state
    const linkFromState = location.state?.youtubeLink;
    const titleFromState = location.state?.videoTitle;
    
    if (titleFromState) {
      setVideoTitle(titleFromState);
    }
    
    if (linkFromState) {
      setYoutubeLink(linkFromState);
      
      // Extract video ID from YouTube link
      const extractVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
      };
      
      const id = extractVideoId(linkFromState);
      if (id) {
        setVideoId(id);
        
        // If no title was provided, use the video ID as a fallback for API requests
        if (!titleFromState) {
          // You could implement a function to fetch the video title from YouTube API here
          setVideoTitle('Video ' + id);
        }
      } else {
        console.error('Invalid YouTube URL');
      }
    }
  }, [location]);
  
  // Effect to fetch suggested questions when taskId is available
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!taskId) return;
      
      try {
        setLoadingQuestions(true);
        const questions = await chatApiService.fetchSuggestedQuestions(taskId);
        setSuggestedQuestions(questions);
        
        // Initially show only the first two questions
        setDisplayedQuestions(questions.slice(0, 2));
      } catch (err) {
        console.error('Failed to fetch suggested questions:', err);
        setError('Failed to load suggested questions. Using defaults instead.');
        // Fallback questions if API fails
        const fallbackQuestions = [
          "What is this video about?",
          "Can you summarize the key points?",
          "What are the main takeaways?",
          "What does the speaker say about habits?",
          "How can I apply these concepts in my life?"
        ];
        setSuggestedQuestions(fallbackQuestions);
        setDisplayedQuestions(fallbackQuestions.slice(0, 2));
      } finally {
        setLoadingQuestions(false);
      }
    };
    
    fetchQuestions();
  }, [taskId]);

  // Function to call the chat API
  const callChatAPI = async (message) => {
    try {
      setLoading(true);
      setError('');
      
      // Check if taskId exists
      if (!taskId) {
        setError('Please start a new conversation before sending messages.');
        return "I can't process your request right now. Please try again in a moment.";
      }
      
      // Use the embedded chat API service
      const response = await chatApiService.sendMessage({
        message,
        taskId,
        videoId,
        transcript: transcriptText
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

  const handleSuggestedQuestion = (question, index) => {
    // Set the clicked question as the user message
    setUserMessage(question);
    
    // Replace the clicked question with a new one from the list
    setDisplayedQuestions(prevQuestions => {
      const newQuestions = [...prevQuestions];
      
      // Find questions that aren't currently displayed
      const unusedQuestions = suggestedQuestions.filter(
        q => !prevQuestions.includes(q) && q !== question
      );
      
      // If we have unused questions, replace the clicked one
      if (unusedQuestions.length > 0) {
        newQuestions[index] = unusedQuestions[0];
      }
      
      return newQuestions;
    });
    
    // Focus the input after selecting a question
    inputRef.current?.focus();
  };
  
  // Copy message content to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Could add a notification here
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left panel - Video */}
      <div className="w-1/2 p-4 flex flex-col overflow-hidden">
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 h-full flex flex-col">
          <div className="p-4 border-l-4 border-purple-600">
            <h2 className="text-xl font-bold mb-4">
              {videoTitle || 'Load a video to get started'}
            </h2>
          </div>
          <div className="flex-1 relative">
            {videoId ? (
              <iframe 
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={videoTitle || "YouTube video player"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-900 text-gray-400">
                <div className="text-center p-6">
                  <div className="mb-4 text-purple-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="font-medium text-xl">No video loaded</p>
                  <p className="text-sm mt-4">Please enter a valid YouTube URL to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Right panel - Chat */}
      <div className="w-1/2 flex flex-col h-full">
        {/* Chat container */}
        <div className="h-full p-4 flex flex-col">
          <div className="bg-purple-900 rounded-t-lg shadow-lg overflow-hidden h-20 flex items-center px-6">
            <div className="w-12 h-12 bg-purple-800 rounded-full flex items-center justify-center mr-4">
              <MessageSquare size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Video Assistant</h3>
              <p className="text-sm text-purple-200">Ask me anything about the video!</p>
            </div>
          </div>
          
          {/* Messages area */}
          <div className="flex-1 overflow-auto bg-gray-800 px-6 py-4 border-x border-gray-700 min-h-0 relative">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col">
                {/* Empty state with vertical list of suggested questions */}
                <div className="flex flex-col items-center justify-center text-center my-8">
                  <div className="w-24 h-24 bg-purple-900 bg-opacity-30 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare size={36} className="text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Start a conversation</h3>
                  <p className="text-gray-400 max-w-md mb-8">Ask me questions about the video or choose from the suggestions below</p>
                </div>
                
                {/* Vertical suggested questions - ONLY showing the first two */}
                <div className="w-full max-w-md mx-auto space-y-4">
                  {loadingQuestions ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-16 bg-gray-700 rounded-lg"></div>
                      <div className="h-16 bg-gray-700 rounded-lg"></div>
                    </div>
                  ) : (
                    // Only display the first two questions from displayedQuestions array
                    displayedQuestions.slice(0, 2).map((question, index) => (
                      <button
                        key={index}
                        className="w-full text-left p-4 bg-gray-700 hover:bg-purple-800 rounded-xl transition-all duration-200 border border-gray-600 hover:border-purple-500 shadow-md flex items-center group"
                        onClick={() => handleSuggestedQuestion(question, index)}
                      >
                        <span className="w-8 h-8 flex items-center justify-center bg-purple-900 text-white rounded-full mr-4 group-hover:bg-purple-700 transition-colors font-bold">
                          {index + 1}
                        </span>
                        <span className="text-gray-100 group-hover:text-white text-base">{question}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      ${msg.sender === 'user' 
                        ? 'bg-purple-700 text-white border-purple-600' 
                        : 'bg-gray-700 text-gray-100 border-gray-600'
                      } 
                      rounded-xl py-3 px-4 max-w-[85%] shadow-md border
                    `}>
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      
                      {/* Message actions for bot messages */}
                      {msg.sender === 'bot' && (
                        <div className="flex items-center justify-end mt-3 text-gray-400 text-xs gap-4">
                          <button 
                            onClick={() => copyToClipboard(msg.text)}
                            className="flex items-center hover:text-purple-300 transition-colors"
                          >
                            <Copy size={14} className="mr-1" />
                            <span>Copy</span>
                          </button>
                          <div className="flex items-center gap-3">
                            <button className="hover:text-green-400 transition-colors">
                              <ThumbsUp size={14} />
                            </button>
                            <button className="hover:text-red-400 transition-colors">
                              <ThumbsDown size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 border border-gray-600 rounded-xl py-4 px-5 max-w-[85%] shadow-md">
                      <div className="flex space-x-2 items-center">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-100"></div>
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Input area */}
          <div className="bg-gray-800 rounded-b-lg p-4 border-x border-b border-gray-700 shadow-lg">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about the video..."
                className="w-full bg-gray-700 border border-gray-600 rounded-full py-3.5 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                disabled={loading}
              />
              <button 
                onClick={handleSendMessage}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2
                  ${loading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-500'
                  } text-white p-2.5 rounded-full transition-colors`}
                disabled={loading}
              >
                <Send size={18} />
              </button>
            </div>
            <div className="mt-3 text-center">
              <span className="text-xs text-gray-500">
                Powered by advanced AI | Video Intelligence
              </span>
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