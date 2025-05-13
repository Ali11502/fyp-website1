import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Transcript = () => {
  const location = useLocation();
  const [videoTitle, setVideoTitle] = useState('Transcript');
  const [transcript, setTranscript] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTranscript() {
      setLoading(true);
      setError(null);

      try {
        // Get video info from location state (passed from YouTubeCardWithModal)
        if (location.state?.videoInfo) {
          setVideoTitle(location.state.videoInfo.title || 'YouTube Transcript');
        }

        // Get transcript from location state if available
        if (location.state?.transcriptInfo?.full_text) {
          setTranscript(location.state.transcriptInfo.full_text);
          setLoading(false);
          return;
        }

        // Get task ID from location state
        const taskId = location.state?.taskId;
        
        if (!taskId) {
          throw new Error('No task ID provided. Please process a YouTube video first.');
        }

        // Read the transcript file directly using the window.fs API
        try {
          // Path to the transcript file based on the provided information
          const filePath = `downloads/full_transcript.txt`;
          const fileContent = await window.fs.readFile(filePath, { encoding: 'utf8' });
          setTranscript(fileContent);
        } catch (fileErr) {
          console.error('Error reading transcript file:', fileErr);
          
          // Try alternative file path with task ID
          try {
            const altFilePath = `downloads/${taskId}_transcript.txt`;
            const altFileContent = await window.fs.readFile(altFilePath, { encoding: 'utf8' });
            setTranscript(altFileContent);
          } catch (altFileErr) {
            throw new Error('Could not read transcript file. The file may not exist or is inaccessible.');
          }
        }
      } catch (err) {
        console.error('Error loading transcript:', err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadTranscript();
  }, [location]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        <p className="ml-4">Loading transcript…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-medium">Error loading transcript</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{videoTitle}</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        {transcript
          .split('\n\n')
          .map((para, idx) => (
            <p key={idx} className="mb-4 leading-relaxed">
              {para}
            </p>
          ))}
      </div>
    </div>
  );
}
