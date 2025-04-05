
import React, { useState } from "react";
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
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [sheetTrigger, setSheetTrigger] = useState(0); // Counter to force sheet re-render
  const navigate = useNavigate();

  // Navigation items
  const navigationItems = [
    { name: "Overview", path: "/" },
    { name: "Expenses", path: "/expenses" },
    { name: "Income", path: "/income" },
    { name: "Grow", path: "/grow" }
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
      setSheetTrigger(prev => prev + 1); // Increment to force re-render of Sheet
    }, 300);
  };

  // Helper to safely close a settings sheet
  const closeSettingsSheet = () => {
    setActiveSheet(null);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button 
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

      {/* Settings Sheets - key forces re-creation of the component when sheets are opened/closed */}
      <Sheet 
        key={`sheet-${sheetTrigger}`}
        open={activeSheet !== null} 
        onOpenChange={(open) => {
          if (!open) closeSettingsSheet();
        }}
      >
        <SheetContent className="w-full sm:max-w-md pt-12">
          <SheetHeader>
            <SheetTitle>
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
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
            <Button variant="outline" onClick={closeSettingsSheet} className="w-full">
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileNav;
