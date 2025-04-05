
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
    // We need to set these in sequence with delay to prevent state conflicts
    setOpen(false);
    // Add a slight delay before opening the settings sheet
    setTimeout(() => {
      setActiveSettingSheet(setting);
    }, 150);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden text-white">
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
