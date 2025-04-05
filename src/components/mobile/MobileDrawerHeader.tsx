
import React from "react";
import { DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const MobileDrawerHeader: React.FC = () => {
  return (
    <div className="flex justify-between border-b border-orange-200/50 pb-3">
      <DrawerTitle className="text-orange-800 font-semibold">Menu</DrawerTitle>
      <DrawerClose asChild>
        <Button variant="ghost" size="icon" className="text-orange-800 hover:bg-orange-100">
          <X className="h-6 w-6" />
        </Button>
      </DrawerClose>
    </div>
  );
};

export default MobileDrawerHeader;
