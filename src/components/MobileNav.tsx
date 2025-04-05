
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

  const closeSettingSheet = () => {
    setActiveSettingSheet(null);
  };

  const openSettingSheet = (setting: string) => {
    // Close drawer first
    setOpen(false);
    
    // Add a longer delay before opening the settings sheet to ensure drawer is fully closed
    setTimeout(() => {
      setActiveSettingSheet(setting);
    }, 300); // Increased from 150ms to 300ms for better reliability
  };

  return (
    <>
      <Drawer open={open} onOpenChange={(isOpen) => {
        // Only allow setting open to true if no active setting sheet
        if (isOpen && activeSettingSheet === null) {
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
            onClick={() => {
              if (activeSettingSheet === null) {
                setOpen(true);
              }
            }}
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
