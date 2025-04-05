
import React from "react";
import { Button } from "@/components/ui/button";
import { Bell, Banknote, CreditCard, Cloud, Link2 } from "lucide-react";

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
      <h3 className="font-medium text-sm text-muted-foreground mb-2 mt-4">Settings</h3>
      <div className="grid gap-2">
        {settingsItems.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            className="w-full justify-start text-lg h-12"
            onClick={() => onSettingSelect(item.setting)}
          >
            {item.icon}
            {item.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MobileSettingsMenu;
