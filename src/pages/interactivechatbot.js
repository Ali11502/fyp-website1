import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send } from 'lucide-react';

const InteractiveChatBot = () => {
  const location = useLocation();
  const [youtubeLink, setYoutubeLink] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [videoTitle, setVideoTitle] = useState('A simple way to break a bad habit | Judson Brewer | TED');
  const [proMode, setProMode] = useState(false);
    const [videoId, setVideoId] = useState('');

    const videoData = location.state;

    // Then check if it's a local video
    if (videoData?.localVideo) {
      // Use videoData.videoUrl for displaying the video
    }

  // Transcript text from the example
  const transcriptText = `When I was first learning to meditate, the instruction was to simply pay attention to my breath, and when my mind wandered, to bring it back. Sounded simple enough. Yet I'd sit on these silent retreats, sweating through T-shirts in the middle of winter. I'd take naps every chance I got because it was really hard work. Actually, it was exhausting. The instruction was simple enough but I was missing something really important. So why is it so hard to pay attention? Well, studies show that even when we're really trying to pay attention to something -- like maybe this talk -- at some point, about half of us will drift off into a daydream, or have this urge to check our Twitter feed. So what's going on here? It turns out that we're fighting one of the most evolutionarily-conserved learning processes currently known in science, one that's conserved back to the most basic nervous systems known to man. This reward-based learning process is called positive and negative reinforcement, and basically goes like this. We see some food that looks good, our brain says, "Calories! ... Survival!" ...`;
  
  // Suggested questions based on the example
  const suggestedQuestions = [
    "Can you summarize the key ideas?",
    "Explain reward-based learning simply.",
    "How does mindfulness break habits?"
  ];
  
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
  const handleSendMessage = () => {
    if (userMessage.trim()) {
      // Here you would handle sending the message to your backend
      console.log('Sending message:', userMessage);
      setUserMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question) => {
    // Set the question in the input field or directly send it
    setUserMessage(question);
  };

  return (
    <div className="flex flex-col h-screen p-4 max-w-7xl mx-auto">
      <div className="flex flex-1 gap-4">
        
        
        {/* Right panel with chat interface */}
        <div className="w-full flex flex-col">
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-gray-700">Ask me any question about your notes or content!</p>
          </div>
          
          {/* Chat area (would show messages) */}
          <div className="flex-1 mb-4 overflow-auto">
            {/* Chat messages would be mapped here */}
          </div>
          
          {/* Suggested questions */}
          <div className="space-y-2 mb-4">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm text-left"
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>
          
          {/* Input area */}
          <div className="relative">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a question here..."
              className="w-full bg-gray-100 border-gray-200 rounded-full py-3 pl-4 pr-12 focus:outline-none"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center">
              <button 
                onClick={handleSendMessage}
                className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full"
              >
                <Send size={18} />
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
            
            <div className="ml-auto text-gray-400 text-xs">
              Activate Windows
              <div className="text-xs text-gray-300">Go to Settings to activate Windows</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}