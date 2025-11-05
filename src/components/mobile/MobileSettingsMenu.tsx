
import React from "react";
import { Button } from "@/components/ui/button";

interface SettingsItem {
  name: string;
  icon: React.ReactNode;
  setting: string;
  description?: string;
  action?: () => void;
}

interface MobileSettingsMenuProps {
  settingsItems: SettingsItem[];
  onSettingSelect: (setting: string) => void;
}

const MobileSettingsMenu: React.FC<MobileSettingsMenuProps> = ({
  settingsItems,
  onSettingSelect,
}) => {
  return (
    <div className="mt-6">
      <h3 className="text-orange-800 font-medium mb-3">Settings</h3>
      <div className="space-y-2">
        {settingsItems.map((item) => (
          <div key={item.setting} className="w-full">
            <Button
              variant="outline"
              className="w-full justify-start bg-white text-black border-orange-200 hover:bg-orange-50 hover:text-black"
              onClick={() => item.action ? item.action() : onSettingSelect(item.setting)}
            >
              {item.icon}
              <span>{item.name}</span>
            </Button>
            {item.description && (
              <p className="text-xs text-gray-600 mt-1 px-2">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileSettingsMenu;
