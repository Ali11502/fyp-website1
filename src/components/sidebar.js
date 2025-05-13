import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Youtube,
  MessageSquare,
  FileText,
  Highlighter,
  Calendar,
  Headphones,
  BookOpen,
  File,
  ChevronLeft,
  ChevronRight,
  Star,
  Menu,
  MessageSquareCodeIcon,
  Bookmark
} from 'lucide-react';

const Sidebar = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
    '/flashcard',
    '/studyguide'
    
  ];

  useEffect(() => {
    // Check if the current route is in the list of sidebar pages
    setShowSidebar(sidebarPages.includes(location.pathname));
  }, [location]);

  // Define navigation links
  const navLinks = [
    { path: '/chatbot', icon: <MessageSquare size={20} />, label: 'Chat Bot' },
    { path: '/interactivechatbot', icon: <MessageSquareCodeIcon size={20} />, label: 'Interactive Chat Bot' },
    { path: '/transcript', icon: <FileText size={20} />, label: 'Transcript' },
    { path: '/englishdub', icon: <Youtube size={20} />, label: 'English Dub' },
    { path: '/englishsub', icon: <File size={20} />, label: 'English Sub' },
    { path: '/highlights_reel', icon: <Highlighter size={20} />, label: 'Highlights Reel' },
    { path: '/meetingminutes', icon: <Calendar size={20} />, label: 'Meeting Minutes' },
    { path: '/podcasts', icon: <Headphones size={20} />, label: 'Podcasts' },
    { path: '/studyguide', icon: <BookOpen size={20} />, label: 'Study Guide' },
    { path: '/flashcard',     icon: <Bookmark size={20} />, label: 'Flashcards' },
  ];

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Don't render the sidebar at all if it shouldn't be shown
  if (!showSidebar) return null;

  return (
    <div className={`bg-white shadow-sm flex flex-col fixed left-0 top-0 h-screen ${sidebarCollapsed ? 'w-16' : 'w-60'} transition-all duration-300 z-40`}>
      {/* Header with logo or hamburger */}
      <div className="p-4 flex items-center border-b">
        {sidebarCollapsed ? (
          // Hamburger menu when collapsed - clickable to expand
          <button 
            className="w-full flex justify-center focus:outline-none"
            onClick={toggleSidebar}
          >
            <Menu size={22} className="text-gray-700 hover:text-gray-900" />
          </button>
        ) : (
          // Logo when expanded
          <div className="font-bold text-gray-800 flex items-center">
            <span>/</span>
            <span className="ml-1">VidSense</span>
          </div>
        )}
        
        {/* Toggle button - moved to the right side when expanded, hidden when collapsed */}
        {!sidebarCollapsed && (
          <button
            className="ml-auto text-gray-500"
            onClick={toggleSidebar}
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>
     
      {/* Navigation */}
      <nav className="flex-1">
        <ul className="py-2">
          {navLinks.map((link) => (
            <li key={link.path}>
              <button
                onClick={() => handleNavigation(link.path)}
                className={`flex items-center px-4 py-3 w-full text-left ${
                  location.pathname === link.path
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-600 hover:bg-gray-100'
                } rounded-lg mx-2 ${sidebarCollapsed ? 'justify-center' : ''}`}
              >
                {link.icon}
                {!sidebarCollapsed && <span className="ml-3">{link.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
     
      {/* Removed the extra expand button at the bottom since we can now click the hamburger */}
     
      {/* Upgrade button */}
      <div className="p-4">
        <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center">
          <Star size={18} />
          {!sidebarCollapsed && <span className="ml-2">Upgrade to Premium</span>}
        </button>
      </div>
     
      {/* User */}
      <div className="p-4 border-t flex items-center">
        <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center text-white">
          M
        </div>
        {!sidebarCollapsed && <span className="ml-3 text-sm">Maaz Arif</span>}
      </div>
    </div>
  );
};

export default Sidebar;