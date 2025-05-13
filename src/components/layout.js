import { useLocation } from 'react-router-dom';
import Sidebar from './sidebar';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // List of pages where the sidebar should be shown
  // List of pages where the sidebar should be shown
  const sidebarPages = [
    '/chatbot', 
    '/interactivechatbot', 
    '/transcript',
    '/englishdub', 
    '/englishsub', 
    '/highlights_reel', 
    '/meetingminutes', 
    '/podcasts', 
    '/studyguide',
    '/flashcard'
  ];
  
  // Check if the current route should have a sidebar
  const showSidebar = sidebarPages.includes(location.pathname);
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Render sidebar only on specific pages */}
      {showSidebar && <Sidebar />}
      
      {/* Main content area */}
      <div className={`flex-1 overflow-auto ${showSidebar ? 'ml-16 md:ml-60' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default Layout;



