
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bell, Banknote, CreditCard, Cloud, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SettingsSheetContent from "./mobile/SettingsSheetContent";
import MobileDrawerHeader from "./mobile/MobileDrawerHeader";
import MobileDrawerContent from "./mobile/MobileDrawerContent";
import MobileDrawerFooter from "./mobile/MobileDrawerFooter";

const MobileNav: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  const navigationItems = [
    { name: "Overview", path: "/" },
    { name: "Expenses", path: "/expenses" },
    { name: "Income", path: "/income" }
  ];

  const settingsItems = [
    { 
      name: "Notifications", 
      icon: <Bell className="h-5 w-5 mr-2" />,
      setting: "notifications"
    },
    { 
      name: "Currency Settings", 
      icon: <Banknote className="h-5 w-5 mr-2" />,
      setting: "currency"
    },
    { 
      name: "Data Management", 
      icon: <CreditCard className="h-5 w-5 mr-2" />,
      setting: "data"
    },
    { 
      name: "Google Drive Backup", 
      icon: <Cloud className="h-5 w-5 mr-2" />,
      setting: "backup"
    },
    { 
      name: "Data Recovery", 
      icon: <Link2 className="h-5 w-5 mr-2" />,
      setting: "recovery"
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsDrawerOpen(false);
  };
  
  const openSettingsSheet = (setting: string) => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setActiveSheet(setting);
      setIsSheetOpen(true);
    }, 300);
  };

  const closeSettingsSheet = () => {
    setIsSheetOpen(false);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setTimeout(() => {
        setActiveSheet(null);
      }, 300);
    }
  };

  useEffect(() => {
    if (!isSheetOpen) {
      setTimeout(() => {
        document.body.style.pointerEvents = '';
        document.body.style.touchAction = '';
        if (menuButtonRef.current) {
          menuButtonRef.current.style.pointerEvents = 'auto';
        }
      }, 150);
    }
  }, [isSheetOpen]);

  return (
    <>
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button 
            ref={menuButtonRef}
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white hover:bg-orange-600/20 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </DrawerTrigger>
        
        <DrawerContent className="h-[85%] bg-gradient-to-b from-orange-50 to-white border-t-orange-200">
          <DrawerHeader className="flex justify-between border-b border-orange-200/50 pb-3">
            <MobileDrawerHeader />
          </DrawerHeader>
          
          <MobileDrawerContent 
            navigationItems={navigationItems}
            settingsItems={settingsItems}
            onNavigation={handleNavigation}
            onSettingSelect={openSettingsSheet}
          />
          
          <DrawerFooter>
            <MobileDrawerFooter />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Sheet 
        open={isSheetOpen} 
        onOpenChange={handleSheetOpenChange}
      >
        <SheetContent 
          className="w-full sm:max-w-md pt-12 bg-gradient-to-br from-orange-500 to-amber-500 text-white"
          hideCloseButton={false}
        >
          <SheetHeader>
            <SheetTitle className="text-white text-xl">
              {activeSheet === "currency" && "Currency Settings"}
              {activeSheet === "data" && "Data Management"}
              {activeSheet === "notifications" && "Notifications"}
              {activeSheet === "backup" && "Google Drive Backup"}
              {activeSheet === "recovery" && "Data Recovery"}
            </SheetTitle>
          </SheetHeader>
          <div className="py-6 h-[calc(100vh-170px)] overflow-y-auto">
            <SettingsSheetContent 
              activeSheet={activeSheet} 
              onClose={closeSettingsSheet} 
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20 bg-gradient-to-br from-orange-500 to-amber-500">
            <Button 
              variant="secondary" 
              onClick={closeSettingsSheet} 
              className="w-full bg-white/20 text-white hover:bg-white/30 border-white/10 backdrop-blur-sm shadow-lg"
            >
              Close Menu
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileNav;
