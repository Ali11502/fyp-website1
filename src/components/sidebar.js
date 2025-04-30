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
  Star
} from 'lucide-react';

const Sidebar = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // List of pages where the sidebar should be shown
  const sidebarPages = [
    '/chatbot', 
    '/transcript', 
    '/englishdub', 
    '/englishsub', 
    '/highlights_reel', 
    '/meetingminutes', 
    '/podcasts', 
    '/studyguide'
  ];

  useEffect(() => {
    // Check if the current route is in the list of sidebar pages
    setShowSidebar(sidebarPages.includes(location.pathname));
  }, [location]);

  // Define navigation links
  const navLinks = [
    { path: '/chatbot', icon: <MessageSquare size={20} />, label: 'Chat Bot' },
    { path: '/transcript', icon: <FileText size={20} />, label: 'Transcript' },
    { path: '/englishdub', icon: <Youtube size={20} />, label: 'English Dub' },
    { path: '/englishsub', icon: <File size={20} />, label: 'English Sub' },
    { path: '/highlights_reel', icon: <Highlighter size={20} />, label: 'Highlights Reel' },
    { path: '/meetingminutes', icon: <Calendar size={20} />, label: 'Meeting Minutes' },
    { path: '/podcasts', icon: <Headphones size={20} />, label: 'Podcasts' },
    { path: '/studyguide', icon: <BookOpen size={20} />, label: 'Study Guide' },
  ];

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Don't render the sidebar at all if it shouldn't be shown
  if (!showSidebar) return null;

  return (
    <div className={`bg-white shadow-sm flex flex-col fixed h-screen ${sidebarCollapsed ? 'w-16' : 'w-60'} transition-all duration-300 z-40`}>
      {/* Logo */}
      <div className="p-4 flex items-center border-b">
        <div className="font-bold text-gray-800 flex items-center">
          {!sidebarCollapsed && <span>/</span>}
          <span className={sidebarCollapsed ? 'text-xs' : 'ml-1'}>turbolearn ai</span>
        </div>
        <button 
          className="ml-auto text-gray-500"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
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
                } rounded-lg mx-2`}
              >
                {link.icon}
                {!sidebarCollapsed && <span className="ml-3">{link.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
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