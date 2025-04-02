
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  FileArchive, 
  Bell, 
  BellOff 
} from "lucide-react";
import { useTransactions } from "@/context/transaction";
import CurrencySelector from "./CurrencySelector";
import BackupManager from "./BackupManager";
import { useCurrency } from "@/context/CurrencyContext";
import MobileNav from "./MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import AppLogo from "./AppLogo";
import { createRoot } from "react-dom/client";
import DataExportImport from "./DataExportImport";
import NotificationSettings from "./NotificationSettings";
import { useNotifications } from "@/context/NotificationContext";

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalByType } = useTransactions();
  const { currencySymbol } = useCurrency();
  const isMobile = useIsMobile();
  const { permission, isSupported } = useNotifications();
  
  const totalExpenses = getTotalByType("expense");
  const totalIncome = getTotalByType("income");
  const balance = totalIncome - totalExpenses;
  
  const openDialog = (component: React.ReactNode, title: string) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'p-4 rounded-lg shadow-lg bg-white';
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.zIndex = '1000';
    dialog.style.width = '80vw';
    dialog.style.maxWidth = '500px';
    
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-4';
    
    const titleElement = document.createElement('h3');
    titleElement.className = 'font-semibold text-lg';
    titleElement.textContent = title;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.className = 'text-2xl leading-none';
    closeButton.onclick = () => dialog.close();
    
    header.appendChild(titleElement);
    header.appendChild(closeButton);
    dialog.appendChild(header);
    
    const dialogContent = document.createElement('div');
    dialogContent.id = 'modal-content';
    dialog.appendChild(dialogContent);
    
    document.body.appendChild(dialog);
    dialog.showModal();
    
    // Render the component inside the dialog
    const root = createRoot(dialogContent);
    root.render(component);
    
    dialog.addEventListener('close', () => {
      root.unmount();
      document.body.removeChild(dialog);
    });
  };
  
  return (
    <nav className="border-b bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
      <div className="container flex h-16 items-center max-w-7xl px-4">
        {isMobile && <MobileNav />}
        
        <Link to="/" className="flex items-center mr-8">
          <AppLogo className="h-6 w-6 mr-2" />
          <span className="font-bold text-xl">Stack'd</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-4 md:gap-6">
          <Link to="/">
            <Button variant={location.pathname === "/" ? "secondary" : "ghost"} 
              className={location.pathname === "/" 
                ? "bg-white/20 text-white hover:bg-white/30" 
                : "text-white hover:bg-white/10"}>
              Overview
            </Button>
          </Link>
          <Link to="/expenses">
            <Button variant={location.pathname === "/expenses" ? "secondary" : "ghost"}
              className={location.pathname === "/expenses" 
                ? "bg-white/20 text-white hover:bg-white/30" 
                : "text-white hover:bg-white/10"}>
              Expenses
            </Button>
          </Link>
          <Link to="/income">
            <Button variant={location.pathname === "/income" ? "secondary" : "ghost"}
              className={location.pathname === "/income" 
                ? "bg-white/20 text-white hover:bg-white/30" 
                : "text-white hover:bg-white/10"}>
              Income
            </Button>
          </Link>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          {!isMobile && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-white bg-white/10 border-white/20 hover:bg-white/20"
                onClick={() => openDialog(<NotificationSettings />, "Notification Settings")}
              >
                {isSupported && permission === 'granted' ? (
                  <Bell size={16} className="mr-2" />
                ) : (
                  <BellOff size={16} className="mr-2" />
                )}
                <span>Notifications</span>
              </Button>
              
              <BackupManager />
              
              <Button 
                size="sm" 
                variant="outline" 
                className="text-white bg-white/10 border-white/20 hover:bg-white/20 flex items-center gap-2"
                onClick={() => {
                  const dialog = document.createElement('dialog');
                  dialog.className = 'p-4 rounded-lg shadow-lg bg-white';
                  dialog.style.position = 'fixed';
                  dialog.style.top = '50%';
                  dialog.style.left = '50%';
                  dialog.style.transform = 'translate(-50%, -50%)';
                  dialog.style.zIndex = '1000';
                  dialog.style.width = '80vw';
                  dialog.style.maxWidth = '500px';
                  
                  const header = document.createElement('div');
                  header.className = 'flex justify-between items-center mb-4';
                  
                  const titleElement = document.createElement('h3');
                  titleElement.className = 'font-semibold text-lg';
                  titleElement.textContent = "Export/Import Data";
                  
                  const closeButton = document.createElement('button');
                  closeButton.textContent = '×';
                  closeButton.className = 'text-2xl leading-none';
                  closeButton.onclick = () => dialog.close();
                  
                  header.appendChild(titleElement);
                  header.appendChild(closeButton);
                  dialog.appendChild(header);
                  
                  const dialogContent = document.createElement('div');
                  dialogContent.id = 'modal-content';
                  dialog.appendChild(dialogContent);
                  
                  document.body.appendChild(dialog);
                  dialog.showModal();
                  
                  // Render the component inside the dialog
                  const root = createRoot(dialogContent);
                  root.render(<DataExportImport />);
                  
                  dialog.addEventListener('close', () => {
                    root.unmount();
                    document.body.removeChild(dialog);
                  });
                }}
              >
                <FileArchive size={16} />
                <span>Export/Import Data</span>
              </Button>
              
              <CurrencySelector />
            </>
          )}
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-sm text-white/70">Expenses</span>
              <span className="font-medium text-white flex items-center">
                <ArrowDownIcon className="h-3 w-3 mr-1" />
                {currencySymbol}{totalExpenses.toFixed(2)}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-sm text-white/70">Income</span>
              <span className="font-medium text-white flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                {currencySymbol}{totalIncome.toFixed(2)}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-sm text-white/70">Balance</span>
              <span className={`font-medium text-white`}>
                {currencySymbol}{balance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
