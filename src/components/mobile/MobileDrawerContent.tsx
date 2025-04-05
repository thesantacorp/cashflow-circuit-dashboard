
import React from "react";
import MobileNavMenu from "./MobileNavMenu";
import MobileSettingsMenu from "./MobileSettingsMenu";

interface NavigationItem {
  name: string;
  path: string;
}

interface SettingsItem {
  name: string;
  icon: React.ReactNode;
  setting: string;
}

interface MobileDrawerContentProps {
  navigationItems: NavigationItem[];
  settingsItems: SettingsItem[];
  onNavigation: (path: string) => void;
  onSettingSelect: (setting: string) => void;
}

const MobileDrawerContent: React.FC<MobileDrawerContentProps> = ({
  navigationItems,
  settingsItems,
  onNavigation,
  onSettingSelect,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <MobileNavMenu 
        navigationItems={navigationItems} 
        onNavigation={onNavigation} 
      />
      
      <MobileSettingsMenu 
        settingsItems={settingsItems} 
        onSettingSelect={onSettingSelect} 
      />
    </div>
  );
};

export default MobileDrawerContent;
