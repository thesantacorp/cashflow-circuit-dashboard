
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ArrowDownIcon, ArrowUpIcon, Settings, HardDrive } from "lucide-react";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import AppLogo from "./AppLogo";
import NotificationSettings from "./NotificationSettings";
import CurrencySelector from "./CurrencySelector";
import DataExportImport from "./DataExportImport";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from "@/components/ui/drawer";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const MobileNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeSettingSheet, setActiveSettingSheet] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalByType } = useTransactions();
  const { currencySymbol } = useCurrency();
  
  const totalExpenses = getTotalByType("expense");
  const totalIncome = getTotalByType("income");
  const balance = totalIncome - totalExpenses;

  const onLinkClick = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const closeSettingSheet = () => {
    setActiveSettingSheet(null);
  };

  const renderSettingContent = () => {
    switch (activeSettingSheet) {
      case "currency":
        return <CurrencySelector />;
      case "data":
        return <DataExportImport />;
      case "notifications":
        return <NotificationSettings />;
      default:
        return null;
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden text-white">
            <Menu className="h-6 w-6" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="bg-gradient-to-b from-orange-500 to-amber-500 text-white border-r-orange-600 h-[85vh] rounded-t-[20px]">
          <div className="flex flex-col h-full px-4 py-4">
            <div className="flex items-center mb-6 mt-2">
              <AppLogo className="h-6 w-6 mr-2" />
              <span className="font-bold text-xl">Stack'd</span>
            </div>

            <div className="px-4 py-3 bg-white/10 mb-4 rounded-lg">
              <div className="text-sm text-white/70 mb-1">Balance</div>
              <div className="text-2xl font-bold">{currencySymbol}{balance.toFixed(2)}</div>
            </div>

            <nav className="flex flex-col mb-4">
              <div 
                className={`flex items-center px-6 py-3 rounded-lg mb-1 ${location.pathname === "/" 
                  ? "bg-white/20 border-l-4 border-white" 
                  : ""}`}
                onClick={() => onLinkClick("/")}
              >
                <span>Overview</span>
              </div>
              <div 
                className={`flex items-center px-6 py-3 rounded-lg mb-1 ${location.pathname === "/expenses" 
                  ? "bg-white/20 border-l-4 border-white" 
                  : ""}`}
                onClick={() => onLinkClick("/expenses")}
              >
                <span>Expenses</span>
                <span className="ml-auto font-medium flex items-center">
                  <ArrowDownIcon className="h-3 w-3 mr-1" />
                  {currencySymbol}{totalExpenses.toFixed(2)}
                </span>
              </div>
              <div 
                className={`flex items-center px-6 py-3 rounded-lg mb-1 ${location.pathname === "/income" 
                  ? "bg-white/20 border-l-4 border-white" 
                  : ""}`}
                onClick={() => onLinkClick("/income")}
              >
                <span>Income</span>
                <span className="ml-auto font-medium flex items-center">
                  <ArrowUpIcon className="h-3 w-3 mr-1" />
                  {currencySymbol}{totalIncome.toFixed(2)}
                </span>
              </div>
            </nav>

            <div className="px-4 mt-auto">
              <div className="text-sm font-medium mb-2 text-white/80">Settings</div>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10 rounded-lg"
                  onClick={() => setActiveSettingSheet("currency")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Currency
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10 rounded-lg"
                  onClick={() => setActiveSettingSheet("data")}
                >
                  <HardDrive className="mr-2 h-4 w-4" />
                  Data Management
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/10 rounded-lg"
                  onClick={() => setActiveSettingSheet("notifications")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                  </svg>
                  Notifications
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Settings Sheets */}
      <Sheet open={activeSettingSheet !== null} onOpenChange={(open) => !open && closeSettingSheet()}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {activeSettingSheet === "currency" && "Currency Settings"}
              {activeSettingSheet === "data" && "Data Management"}
              {activeSettingSheet === "notifications" && "Notifications"}
            </SheetTitle>
          </SheetHeader>
          <div className="py-6">
            {renderSettingContent()}
          </div>
          <DrawerFooter>
            <Button variant="outline" onClick={closeSettingSheet}>
              Close
            </Button>
          </DrawerFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileNav;
