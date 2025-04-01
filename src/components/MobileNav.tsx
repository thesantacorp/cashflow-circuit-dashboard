import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ArrowDownIcon, ArrowUpIcon, FileArchive } from "lucide-react";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import BackupManager from "./BackupManager";
import DataExportImport from "./DataExportImport";
import CurrencySelector from "./CurrencySelector";
import AppLogo from "./AppLogo";
import { createRoot } from "react-dom/client";

const MobileNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { getTotalByType } = useTransactions();
  const { currencySymbol } = useCurrency();
  
  const totalExpenses = getTotalByType("expense");
  const totalIncome = getTotalByType("income");
  const balance = totalIncome - totalExpenses;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[80vw] sm:w-[350px] bg-gradient-to-b from-orange-500 to-amber-500 text-white border-r-orange-600">
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-6 mt-2">
            <AppLogo className="h-6 w-6 mr-2" />
            <span className="font-bold text-xl">Stack'd</span>
          </div>

          <nav className="flex flex-col gap-2">
            <Link to="/" onClick={() => setOpen(false)}>
              <Button 
                variant={location.pathname === "/" ? "secondary" : "ghost"} 
                className={`w-full justify-start ${location.pathname === "/" 
                  ? "bg-white/20 text-white hover:bg-white/30" 
                  : "text-white hover:bg-white/10"}`}
              >
                Overview
              </Button>
            </Link>
            <Link to="/expenses" onClick={() => setOpen(false)}>
              <Button 
                variant={location.pathname === "/expenses" ? "secondary" : "ghost"} 
                className={`w-full justify-start ${location.pathname === "/expenses" 
                  ? "bg-white/20 text-white hover:bg-white/30" 
                  : "text-white hover:bg-white/10"}`}
              >
                Expenses
              </Button>
            </Link>
            <Link to="/income" onClick={() => setOpen(false)}>
              <Button 
                variant={location.pathname === "/income" ? "secondary" : "ghost"} 
                className={`w-full justify-start ${location.pathname === "/income" 
                  ? "bg-white/20 text-white hover:bg-white/30" 
                  : "text-white hover:bg-white/10"}`}
              >
                Income
              </Button>
            </Link>
          </nav>

          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
              <span>Expenses</span>
              <span className="font-medium flex items-center">
                <ArrowDownIcon className="h-3 w-3 mr-1" />
                {currencySymbol}{totalExpenses.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
              <span>Income</span>
              <span className="font-medium flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                {currencySymbol}{totalIncome.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
              <span>Balance</span>
              <span className="font-medium">
                {currencySymbol}{balance.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-auto p-4 flex flex-col gap-3">
            <CurrencySelector />
            <div className="flex justify-between gap-2">
              <BackupManager />
              <Button
                size="sm"
                variant="outline"
                className="text-black bg-white flex items-center gap-2 flex-1"
                onClick={() => {
                  const dialog = document.createElement('dialog');
                  dialog.className = 'p-4 rounded-lg shadow-lg bg-white';
                  dialog.style.position = 'fixed';
                  dialog.style.top = '50%';
                  dialog.style.left = '50%';
                  dialog.style.transform = 'translate(-50%, -50%)';
                  dialog.style.zIndex = '1000';
                  dialog.style.width = '80vw';
                  dialog.style.maxWidth = '400px';
                  
                  const dialogContent = document.createElement('div');
                  dialogContent.id = 'export-import-dialog';
                  dialog.appendChild(dialogContent);
                  
                  const closeButton = document.createElement('button');
                  closeButton.textContent = 'Close';
                  closeButton.className = 'mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300';
                  closeButton.onclick = () => dialog.close();
                  dialog.appendChild(closeButton);
                  
                  document.body.appendChild(dialog);
                  dialog.showModal();
                  
                  // Render the DataExportImport component inside the dialog
                  const root = createRoot(dialogContent);
                  root.render(<DataExportImport />);
                  
                  dialog.addEventListener('close', () => {
                    root.unmount();
                    document.body.removeChild(dialog);
                  });
                }}
              >
                <FileArchive size={16} />
                <span>Export/Import</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
