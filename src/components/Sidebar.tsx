
import React from 'react';
import { Home, FileText, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeItem: string;
  setActiveItem: (item: string) => void;
}

const Sidebar = ({ activeItem, setActiveItem }: SidebarProps) => {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'runs', label: 'Runs', icon: Play },
  ];

  return (
    <div className="h-screen w-[200px] border-r bg-white flex flex-col">
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg text-marketing-darkPurple">MarketGPT</h1>
      </div>
      <div className="flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium",
              activeItem === item.id 
                ? "bg-marketing-lightPurple text-marketing-darkPurple border-r-2 border-marketing-purple"
                : "text-gray-600 hover:bg-gray-100"
            )}
            onClick={() => setActiveItem(item.id)}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
