
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Check if the path looks like a shared chat link with wrong format
  const isSharedChatAttempt = location.pathname.includes('shared-chat') || 
    location.pathname.includes('chat') || 
    location.pathname.includes('share');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-sm max-w-md">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
        
        {isSharedChatAttempt && (
          <div className="mb-6 p-4 bg-blue-50 rounded-md text-blue-800 text-sm">
            <p className="mb-2">
              It looks like you might be trying to access a shared chat.
            </p>
            <p>
              Please check that the URL is correct and in the format:<br/>
              <code className="bg-blue-100 px-2 py-1 rounded">https://example.com/shared-chat/[chat-id]</code>
            </p>
          </div>
        )}
        
        <Link to="/">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
