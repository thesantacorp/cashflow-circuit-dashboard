
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bell, Banknote, CreditCard, Cloud, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobileNavMenu from "./mobile/MobileNavMenu";
import MobileSettingsMenu from "./mobile/MobileSettingsMenu";
import SettingsSheetContent from "./mobile/SettingsSheetContent";

const MobileNav: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Navigation items - "Grow" has been removed from the list
  const navigationItems = [
    { name: "Overview", path: "/" },
    { name: "Expenses", path: "/expenses" },
    { name: "Income", path: "/income" }
  ];

  // Settings items
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

  // Navigation handler
  const handleNavigation = (path: string) => {
    navigate(path);
    setIsDrawerOpen(false);
  };
  
  // Helper to safely open a settings sheet
  const openSettingsSheet = (setting: string) => {
    // First close the drawer
    setIsDrawerOpen(false);
    
    // Wait for drawer animation to complete before opening sheet
    setTimeout(() => {
      setActiveSheet(setting);
      setIsSheetOpen(true);
    }, 300);
  };

  // Helper to safely close a settings sheet
  const closeSettingsSheet = () => {
    setIsSheetOpen(false);
  };

  // Handle sheet close event
  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      // Wait for the closing animation to complete before clearing the activeSheet
      setTimeout(() => {
        setActiveSheet(null);
      }, 300);
    }
  };

  // Reset Radix UI focus trap when sheet closes
  // This helps ensure the menu button remains clickable
  useEffect(() => {
    if (!isSheetOpen && menuButtonRef.current) {
      // Small timeout to ensure DOM has settled
      setTimeout(() => {
        // Reset any focus traps and ensure menu button is clickable
        document.body.style.pointerEvents = '';
        document.body.style.touchAction = '';
      }, 100);
    }
  }, [isSheetOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button 
            ref={menuButtonRef}
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </DrawerTrigger>
        
        {/* Drawer Content */}
        <DrawerContent className="h-[85%]">
          <DrawerHeader className="flex justify-between border-b pb-3">
            <DrawerTitle>Menu</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-6 w-6" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          
          <div className="flex-1 overflow-y-auto p-4">
            {/* Navigation Section */}
            <MobileNavMenu 
              navigationItems={navigationItems} 
              onNavigation={handleNavigation} 
            />
            
            {/* Settings Section */}
            <MobileSettingsMenu 
              settingsItems={settingsItems} 
              onSettingSelect={openSettingsSheet} 
            />
          </div>
          
          <DrawerFooter className="pt-2 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsDrawerOpen(false)}
              className="w-full"
            >
              Close Menu
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Settings Sheet */}
      <Sheet 
        open={isSheetOpen} 
        onOpenChange={handleSheetOpenChange}
      >
        <SheetContent className="w-full sm:max-w-md pt-12 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <SheetHeader>
            <SheetTitle className="text-white">
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
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-orange-500/90">
            <Button 
              variant="secondary" 
              onClick={closeSettingsSheet} 
              className="w-full bg-white/20 text-white hover:bg-white/30 border-white/10"
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
