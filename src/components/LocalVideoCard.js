import React, { useState, useRef } from 'react';
import { Video, ChevronRight, X, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Note: For actual implementation

const LocalVideoCard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    // Remove setTaskId if you don't have a task context
    // const { setTaskId } = useTask();
  
    // Define API base URL - can be moved to environment variables
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';
  
    const openModal = () => setIsModalOpen(true);
  
    const closeModal = () => {
      setIsModalOpen(false);
      setSelectedFile(null);
      setFileName('');
      setPreviewUrl('');
      setError(null);
      setProgress(0);
    };
  
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('video/')) {
        setSelectedFile(file);
        setFileName(file.name);
        
        // Create a preview URL for the video
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    };
  
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
  
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('video/')) {
          setSelectedFile(file);
          setFileName(file.name);
          
          // Create a preview URL for the video
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }
      }
    };
  
    const triggerFileInput = () => {
      fileInputRef.current.click();
    };
  
    // Upload the video and get taskId
    const uploadVideo = async (file) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/api/upload-video`, {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Server error: ${response.status}`);
        }
  
        const data = await response.json();
        
        // Validate response structure
        if (!data.task_id) {
          throw new Error('Invalid response: missing task ID');
        }
        
        return data;
      } catch (err) {
        console.error('Error uploading video:', err);
        setError(err.message || 'Failed to upload video');
        throw err;
      } finally {
        setIsLoading(false);
      }
    };
  
    // Poll for status
    const pollStatus = async (taskId) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/status/${taskId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Status check failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update progress if available
        if (data.progress) {
          setProgress(data.progress);
        }
        
        // Validate response
        if (!data.status) {
          throw new Error('Invalid status response: missing status');
        }
        
        // Validate complete response
        if (data.status === 'completed' && (!data.video_info || !data.transcript_info)) {
          throw new Error('Invalid complete response: missing video or transcript info');
        }
        
        return data;
      } catch (err) {
        console.error('Error polling status:', err);
        throw err;
      }
    };
  
    // Poll with exponential backoff
    const pollWithBackoff = async (taskId, maxAttempts = 10, initialInterval = 1000) => {
      let attempts = 0;
      let interval = initialInterval;
      
      while (attempts < maxAttempts) {
        try {
          const status = await pollStatus(taskId);
          
          if (status.status === 'completed') {
            // Additional check to make sure we have all required data
            if (!status.video_info || !status.transcript_info) {
              console.error('Response marked as completed but missing required data', status);
              throw new Error('Server returned incomplete data. Please try again.');
            }
            return status;
          } else if (status.status === 'failed') {
            throw new Error(status.message || 'Video processing failed');
          } else {
            // Still processing, wait and try again
            await new Promise(resolve => setTimeout(resolve, interval));
            // Increase interval with each attempt (exponential backoff)
            interval = Math.min(interval * 1.5, 10000); // Cap at 10 seconds
            attempts++;
          }
        } catch (err) {
          console.error('Polling error:', err);
          attempts++;
          if (attempts >= maxAttempts) throw err;
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, interval));
          // Increase interval with each failed attempt
          interval = Math.min(interval * 2, 10000); // Cap at 10 seconds
        }
      }
  
      throw new Error('Video processing timed out. Please try again later.');
    };
  
    const handleSubmit = async () => {
      if (!selectedFile) {
        setError('Please select a video file first');
        return;
      }
    
      try {
        // 1. Upload the video
        const uploadData = await uploadVideo(selectedFile);
        const taskId = uploadData.task_id;
        
        /* If you have a context for taskId, uncomment this
        if (setTaskId) {
          setTaskId(taskId);
        }
        */
        
        console.log('Upload complete, task ID:', taskId);
        
        // 2. Poll for completion with exponential backoff
        const result = await pollWithBackoff(taskId);
        
        console.log('Processing complete, navigating to chatbot');
        
        // 3. Navigate to chatbot with the full result
        // Important: Navigate BEFORE closing modal
        navigate('/chatbot', {
          state: {
            localVideo: true,
            videoName: fileName,
            videoUrl: previewUrl,
            taskId,
            videoInfo: result.video_info,
            transcriptInfo: result.transcript_info,
            message: result.message,
            progress: result.progress || 100, // Default to 100% if progress not provided
          }
        });
        
        // Add a small delay to ensure navigation happens before modal closes
        setTimeout(() => {
          closeModal();
        }, 100);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message || 'Something went wrong');
      }
    };
    
    

  return (
    <div className="font-sans">
      {/* Local Video card */}
      <div 
        className="bg-white rounded-xl p-4 shadow-sm border flex items-center justify-between hover:scale-105 transition-transform duration-300 cursor-pointer"
        onClick={openModal}
      >
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Video size={20} className="text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="font-medium">Local Video</h3>
            <p className="text-sm text-gray-500">Upload from your device</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-gray-400" />
      </div>

      {/* Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          {/* Modal content */}
          <div className="bg-gray-900 rounded-lg w-full max-w-md p-6 relative">
            {/* Close button */}
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            {/* Modal header */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
                <Video size={28} className="text-white" />
              </div>
              <h2 className="text-white text-xl font-semibold">Upload Video</h2>
            </div>
            
            {/* File upload area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-6 mb-4 transition-colors ${
                previewUrl ? 'border-blue-500' : 'border-gray-600 hover:border-gray-400'
              } flex flex-col items-center justify-center text-center`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="video/*"
                onChange={handleFileChange}
              />
              
              {previewUrl ? (
                <div className="w-full">
                  <video 
                    src={previewUrl} 
                    className="w-full h-48 object-cover rounded mb-2" 
                    controls
                  />
                  <p className="text-gray-300 text-sm truncate">{fileName}</p>
                </div>
              ) : (
                <>
                  <Upload size={40} className="text-gray-500 mb-2" />
                  <p className="text-gray-300 mb-1">
                    <span className="text-blue-400 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-gray-500 text-sm">MP4 format</p>
                </>
              )}
            </div>
            
            {/* Process Video button */}
            <button
              onClick={handleSubmit}
              disabled={!selectedFile}
              className={`w-full font-medium py-3 px-4 rounded-lg transition ${
                selectedFile 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Process Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalVideoCard;