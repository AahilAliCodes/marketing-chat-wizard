
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AnalysisError = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 px-4">
      <div className="text-center max-w-md">
        {/* BLASTari Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 bg-marketing-purple rounded-md mr-3">
            <span className="text-white font-bold text-lg">B.</span>
          </div>
          <span className="text-2xl font-bold">BLASTari</span>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          We can't analyze that site yet, sorry!
        </h1>
        
        <p className="text-gray-600 mb-8 text-lg">
          The website you entered might be blocking our analysis or using technologies we don't support yet. Please try a different website.
        </p>

        {/* Return Home Button */}
        <Button 
          onClick={handleGoHome}
          className="bg-marketing-purple hover:bg-marketing-purple/90 text-white px-8 py-3 text-lg"
        >
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default AnalysisError;
