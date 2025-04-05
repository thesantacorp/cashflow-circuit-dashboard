
import React from "react";
import { Button } from "@/components/ui/button";

interface NavigationItem {
  name: string;
  path: string;
}

interface MobileNavMenuProps {
  navigationItems: NavigationItem[];
  onNavigation: (path: string) => void;
}

const MobileNavMenu: React.FC<MobileNavMenuProps> = ({ 
  navigationItems, 
  onNavigation 
}) => {
  return (
    <div>
      <h3 className="font-medium text-sm text-orange-800 mb-3">Navigation</h3>
      <div className="grid gap-2 mb-6">
        {navigationItems.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            className="w-full justify-start text-lg h-12 text-orange-900 hover:bg-orange-100/70 hover:text-orange-700 transition-all font-medium"
            onClick={() => onNavigation(item.path)}
          >
            {item.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MobileNavMenu;
