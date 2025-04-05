
import React from "react";
import { Button } from "@/components/ui/button";

interface SettingsItem {
  name: string;
  icon: React.ReactNode;
  setting: string;
}

interface MobileSettingsMenuProps {
  settingsItems: SettingsItem[];
  onSettingSelect: (setting: string) => void;
}

const MobileSettingsMenu: React.FC<MobileSettingsMenuProps> = ({ 
  settingsItems, 
  onSettingSelect 
}) => {
  return (
    <div>
      <h3 className="font-medium text-sm text-orange-800 mb-3 mt-4">Settings</h3>
      <div className="grid gap-2">
        {settingsItems.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            className="w-full justify-start text-lg h-12 text-orange-900 hover:bg-orange-100/70 hover:text-orange-700 transition-all font-medium group"
            onClick={() => onSettingSelect(item.setting)}
          >
            <span className="mr-2 text-orange-500 group-hover:text-orange-600">{item.icon}</span>
            {item.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MobileSettingsMenu;
