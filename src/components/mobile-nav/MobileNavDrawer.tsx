
import { Button } from "@/components/ui/button";
import {
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { 
  Bell, 
  X, 
  CreditCard, 
  Banknote,
  Upload,
  Cloud,
  Link2
} from "lucide-react";
import React from "react";

interface MobileNavDrawerProps {
  setOpen: (open: boolean) => void;
  openSettingSheet: (setting: string) => void;
}

const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ setOpen, openSettingSheet }) => {
  const menuItems = [
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
    },
  ];

  return (
    <DrawerContent className="h-[85%] px-0">
      <DrawerHeader className="flex justify-between items-center border-b pb-3 px-4 sm:px-6">
        <DrawerTitle>Settings</DrawerTitle>
        <DrawerClose asChild>
          <Button variant="ghost" size="icon">
            <X className="h-6 w-6" />
          </Button>
        </DrawerClose>
      </DrawerHeader>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid gap-4">
          {menuItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className="w-full justify-start text-lg h-12"
              onClick={() => {
                openSettingSheet(item.setting);
              }}
            >
              {item.icon}
              {item.name}
            </Button>
          ))}
        </div>
      </div>
      <DrawerFooter className="pt-2 border-t">
        <Button 
          variant="outline" 
          onClick={() => setOpen(false)}
          className="w-full"
        >
          Close Menu
        </Button>
      </DrawerFooter>
    </DrawerContent>
  );
};

export default MobileNavDrawer;
