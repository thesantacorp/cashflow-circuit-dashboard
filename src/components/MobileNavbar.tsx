
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import MobileNavMenu from "./mobile/MobileNavMenu";
import MobileDrawerHeader from "./mobile/MobileDrawerHeader";
import MobileDrawerContent from "./mobile/MobileDrawerContent";
import MobileDrawerFooter from "./mobile/MobileDrawerFooter";
import AppLogo from "./AppLogo";
import NetworkStatusIndicator from "./NetworkStatusIndicator";

const MobileNavbar: React.FC = () => {
  const location = useLocation();

  // Determine title based on current route
  const getTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Overview";
    if (path === "/expenses") return "Expenses";
    if (path === "/income") return "Income";
    if (path === "/profile") return "Profile";
    if (path === "/ideas") return "Feature Ideas";
    return "Cashflow Circuit";
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-3 flex items-center justify-between">
      <div className="flex items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="p-2 -ml-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] flex flex-col">
            <SheetHeader className="p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            </SheetHeader>
            <MobileDrawerHeader />
            <MobileDrawerContent />
            <MobileDrawerFooter />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-bold ml-2">{getTitle()}</h1>
      </div>
      <div className="flex items-center space-x-2">
        <NetworkStatusIndicator minimal />
        <Link to="/">
          <AppLogo size="sm" />
        </Link>
      </div>
    </div>
  );
};

export default MobileNavbar;
