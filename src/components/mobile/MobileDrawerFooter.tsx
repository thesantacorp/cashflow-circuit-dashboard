
import React from "react";
import { DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

const MobileDrawerFooter: React.FC = () => {
  return (
    <div className="pt-2 border-t border-orange-200/50 bg-gradient-to-b from-orange-50 to-white">
      <DrawerClose asChild>
        <Button 
          variant="outline" 
          className="w-full border-orange-300 bg-white text-orange-800 hover:bg-orange-50"
        >
          Close Menu
        </Button>
      </DrawerClose>
    </div>
  );
};

export default MobileDrawerFooter;
