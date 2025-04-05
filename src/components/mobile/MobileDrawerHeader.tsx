
import React from "react";
import { DrawerTitle } from "@/components/ui/drawer";

const MobileDrawerHeader: React.FC = () => {
  return (
    <div className="flex justify-between border-b border-orange-200/50 pb-3">
      <DrawerTitle className="text-orange-800 font-semibold">Menu</DrawerTitle>
    </div>
  );
};

export default MobileDrawerHeader;
