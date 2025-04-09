
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

// Create a navigation items array
const navigationItems = [
  { id: "overview", label: "Overview", path: "/overview" },
  { id: "expenses", label: "Expenses", path: "/expenses" },
  { id: "income", label: "Income", path: "/income" },
  { id: "ideas", label: "Ideas", path: "/ideas" },
  { id: "profile", label: "Profile", path: "/profile" }
];

// Create settings items array
const settingsItems = [
  { id: "currency", label: "Currency" },
  { id: "backup", label: "Backup" },
  { id: "notifications", label: "Notifications" }
];

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

  // Handlers for navigation and settings
  const handleNavigation = (path: string) => {
    // Navigation logic here
  };

  const handleSettingSelect = (id: string) => {
    // Settings logic here
  };

  return (
    <div className="md:hidden sticky bottom-0 z-10 bg-white border-t border-gray-200 p-3 flex items-center justify-between">
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
            <MobileDrawerContent 
              navigationItems={navigationItems}
              settingsItems={settingsItems}
              onNavigation={handleNavigation}
              onSettingSelect={handleSettingSelect}
            />
            <MobileDrawerFooter />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-bold ml-2">{getTitle()}</h1>
      </div>
      <div className="flex items-center space-x-2">
        <NetworkStatusIndicator minimal={true} />
        <Link to="/">
          <AppLogo size="sm" />
        </Link>
      </div>
    </div>
  );
};

export default MobileNavbar;
