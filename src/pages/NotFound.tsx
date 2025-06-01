
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

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

  // Check for other common route patterns
  const isRedditGeneratorAttempt = location.pathname.includes('reddit') || 
    location.pathname.includes('generator');

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-sm max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 bg-marketing-purple rounded-md mr-3">
            <span className="text-white font-bold text-lg">B.</span>
          </div>
          <span className="text-2xl font-bold">BLASTari</span>
        </div>

        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
        
        {isSharedChatAttempt && (
          <div className="mb-6 p-4 bg-blue-50 rounded-md text-blue-800 text-sm">
            <p className="mb-2">
              It looks like you might be trying to access a shared chat.
            </p>
            <p>
              Please check that the URL is correct and in the format:<br/>
              <code className="bg-blue-100 px-2 py-1 rounded">
                /shared-chat/[chat-id]
              </code>
            </p>
          </div>
        )}

        {isRedditGeneratorAttempt && (
          <div className="mb-6 p-4 bg-blue-50 rounded-md text-blue-800 text-sm">
            <p className="mb-2">
              Looking for Reddit post generation? That feature is now available in the Research section.
            </p>
            <Link to="/research" className="text-blue-600 hover:text-blue-800 underline">
              Go to Research →
            </Link>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleGoBack} variant="outline" className="flex-1">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Link to="/" className="flex-1">
            <Button className="bg-marketing-purple hover:bg-marketing-purple/90 w-full">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          If you think this is an error, please contact support.
        </div>
      </div>
    </div>
  );
};

export default NotFound;
