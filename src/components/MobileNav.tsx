
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
    // Close the drawer first without the timeout which was causing the issue
    setOpen(false);
    setActiveSettingSheet(setting);
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
