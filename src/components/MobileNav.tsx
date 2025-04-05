
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
} from "@/components/ui/drawer";
import MobileNavDrawer from "./mobile-nav/MobileNavDrawer";
import SettingsSheet from "./mobile-nav/SettingsSheet";

const MobileNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeSettingSheet, setActiveSettingSheet] = useState<string | null>(null);
  const [menuDisabled, setMenuDisabled] = useState(false);

  const closeSettingSheet = () => {
    setActiveSettingSheet(null);
    // Re-enable the menu button after a short delay
    setMenuDisabled(true);
    setTimeout(() => {
      setMenuDisabled(false);
    }, 300);
  };

  const openSettingSheet = (setting: string) => {
    // Close drawer first
    setOpen(false);
    
    // Add a longer delay before opening the settings sheet to ensure drawer is fully closed
    setTimeout(() => {
      setActiveSettingSheet(setting);
    }, 300);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={(isOpen) => {
        // Only allow setting open to true if no active setting sheet and not disabled
        if (isOpen && activeSettingSheet === null && !menuDisabled) {
          setOpen(true);
        } else if (!isOpen) {
          setOpen(false);
        }
      }}>
        <DrawerTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white"
            onClick={(e) => {
              if (activeSettingSheet !== null || menuDisabled) {
                e.preventDefault();
                return;
              }
              setOpen(true);
            }}
            disabled={activeSettingSheet !== null || menuDisabled}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </DrawerTrigger>
        <MobileNavDrawer setOpen={setOpen} openSettingSheet={openSettingSheet} />
      </Drawer>

      <SettingsSheet 
        activeSettingSheet={activeSettingSheet} 
        closeSettingSheet={closeSettingSheet} 
      />
    </>
  );
};

export default MobileNav;
