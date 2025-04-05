
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
      <h3 className="font-medium text-sm text-muted-foreground mb-2">Navigation</h3>
      <div className="grid gap-2 mb-6">
        {navigationItems.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            className="w-full justify-start text-lg h-12"
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
