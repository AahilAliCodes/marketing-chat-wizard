
import React from 'react';
import { Rocket } from 'lucide-react';

const AnimatedRocket: React.FC = () => {
  return (
    <div className="absolute left-4 bottom-4 animate-bounce">
      <div className="relative">
        <Rocket className="h-6 w-6 text-purple-600 animate-pulse" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-600 rounded-full animate-ping" />
      </div>
    </div>
  );
};

export default AnimatedRocket;
