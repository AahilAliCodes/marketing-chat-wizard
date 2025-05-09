
import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';

const Runs = () => {
  const [activeItem, setActiveItem] = useState<string>('runs');

  return (
    <div className="flex h-screen w-full">
      <Sidebar activeItem={activeItem} setActiveItem={setActiveItem} />
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-bold text-marketing-darkPurple mb-6">Runs</h1>
        <p className="text-gray-600 mb-4">
          This page shows the history of prompts you've run and their results.
        </p>
        <div className="bg-white rounded-lg shadow p-5">
          <div className="text-sm text-gray-500">No runs yet</div>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default Runs;
