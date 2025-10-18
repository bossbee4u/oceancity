import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export const FloatingMenuButton = () => {
  const { toggleSidebar, open } = useSidebar();

  return (
    <Button
      onClick={toggleSidebar}
      size="icon"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 ease-out bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 md:hidden group active:scale-95 hover:scale-105"
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        {/* Menu Icon */}
        <Menu 
          className={`h-5 w-5 text-gray-700 dark:text-gray-300 transition-all duration-200 ease-out ${
            open 
              ? 'opacity-0 rotate-90 scale-75' 
              : 'opacity-100 rotate-0 scale-100'
          }`} 
        />
        
        {/* Close Icon */}
        <X 
          className={`absolute h-5 w-5 text-gray-700 dark:text-gray-300 transition-all duration-200 ease-out ${
            open 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-75'
          }`} 
        />
      </div>
    </Button>
  );
};