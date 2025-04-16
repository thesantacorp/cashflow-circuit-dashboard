
import React, { useRef, useState } from "react";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Transaction } from "@/types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface DataExportImportProps {
  showDialog?: boolean;
}

const DataExportImport: React.FC<DataExportImportProps> = ({ showDialog = true }) => {
  const { state, importData, replaceAllData, refreshData, syncToSupabase, deduplicate } = useTransactions();
  const { currency } = useCurrency();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [importedData, setImportedData] = useState<{transactions: Transaction[], categories: any[]}>({
    transactions: [],
    categories: []
  });
  const [isImporting, setIsImporting] = useState(false);

  const handleExportCSV = () => {
    try {
      // Prepare transactions data
      const transactions = state.transactions.map(t => {
        const category = state.categories.find(c => c.id === t.categoryId);
        return {
          id: t.id,
          type: t.type,
          category: category?.name || "Unknown",
          amount: t.amount,
          description: t.description || "",
          date: new Date(t.date).toISOString().split('T')[0],
          emotion: t.emotionalState || "neutral",
          currency
        };
      });

      if (transactions.length === 0) {
        toast({
          title: "No data to export",
          description: "You don't have any transactions to export yet.",
          variant: "destructive"
        });
        return;
      }

      // Create CSV headers
      const headers = Object.keys(transactions[0]).join(',');
      
      // Create CSV rows
      const csvRows = transactions.map(t => {
        // Make sure to properly escape description to handle commas
        const safeDescription = t.description ? `"${t.description.replace(/"/g, '""')}"` : "";
        return `${t.id},${t.type},${t.category},${t.amount},${safeDescription},${t.date},${t.emotion},${t.currency}`;
      });
      
      // Combine headers and rows
      const csvContent = [headers, ...csvRows].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set up download link
      link.setAttribute('href', url);
      link.setAttribute('download', `stack_d_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: "Your data has been exported as a CSV file."
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive"
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const parseCSVRow = (row: string) => {
    const values = [];
    let insideQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Push the last value
    values.push(currentValue);
    return values;
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        
        // Check if CSV format is valid
        if (!headers.includes('type') || !headers.includes('amount') || !headers.includes('date')) {
          throw new Error("Invalid CSV format. Required headers: type, amount, date");
        }
        
        const transactions = [];
        const categoryMap = new Map();
        
        // Create a map of existing categories
        state.categories.forEach(c => {
          categoryMap.set(c.name.toLowerCase(), c.id);
        });
        
        // Start from index 1 to skip headers
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = parseCSVRow(lines[i]);
          if (values.length !== headers.length) {
            console.warn(`Skipping row ${i}: column count mismatch`);
            continue;
          }
          
          const rowData: any = {};
          
          // Map CSV values to object properties
          headers.forEach((header, index) => {
            rowData[header] = values[index];
          });
          
          // Find category ID or create placeholder
          let categoryId = '';
          if (rowData.category) {
            const categoryLower = rowData.category.toLowerCase();
            if (categoryMap.has(categoryLower)) {
              categoryId = categoryMap.get(categoryLower);
            } else {
              // Use default category based on transaction type
              const defaultCategories = state.categories.filter(c => c.type === rowData.type);
              if (defaultCategories.length > 0) {
                categoryId = defaultCategories[0].id;
              }
            }
          }
          
          // Generate a truly unique ID for import
          // Use a UUID plus a timestamp for absolute uniqueness
          const uniqueId = `imported-${uuidv4()}`;
          
          transactions.push({
            id: uniqueId,
            type: rowData.type,
            amount: parseFloat(rowData.amount),
            description: rowData.description || '',
            date: new Date(rowData.date).toISOString(),
            categoryId,
            emotionalState: rowData.emotion || 'neutral'
          });
        }
        
        if (transactions.length === 0) {
          throw new Error("No valid transactions found in the CSV file");
        }
        
        console.log(`Parsed ${transactions.length} transactions from CSV`);
        
        setImportedData({
          transactions: transactions,
          categories: state.categories
        });
        setShowReplaceDialog(true);
      } catch (error) {
        console.error("Import error:", error);
        toast({
          title: "Import failed",
          description: error instanceof Error ? error.message : "There was an error importing your data.",
          variant: "destructive"
        });
      } finally {
        setIsImporting(false);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const handleImportConfirm = async (replace: boolean) => {
    try {
      console.log(`Import confirmed. Replace mode: ${replace}`);
      console.log(`Importing ${importedData.transactions.length} transactions`);
      
      // First run deduplication before import
      deduplicate();
      
      setIsImporting(true);
      
      if (replace) {
        // Force complete state replacement
        const newState = {
          transactions: importedData.transactions,
          categories: state.categories,
          nextTransactionId: state.nextTransactionId || 1,
          nextCategoryId: state.nextCategoryId || 100
        };
        
        console.log("Replacing all data with:", newState);
        await replaceAllData(newState);
        
        // Immediately sync to ensure data is saved to Supabase
        await syncToSupabase();
        
        toast({
          title: "Data replaced",
          description: `${importedData.transactions.length} transactions have replaced your existing data.`
        });
      } else {
        // Add to existing data
        console.log("Adding to existing data:", importedData);
        await importData(importedData);
        
        // Immediately sync to ensure data is saved to Supabase
        await syncToSupabase();
        
        toast({
          title: "Import successful",
          description: `${importedData.transactions.length} transactions have been added to your existing data.`
        });
      }
      
      // Force a full refresh after import and sync
      try {
        console.log("Triggering full data refresh after import");
        await refreshData(false); // Full refresh with UI feedback
        console.log("Successfully refreshed data after import");
      } catch (refreshError) {
        console.error("Failed to refresh after import:", refreshError);
      }
      
      setShowReplaceDialog(false);
      setImportedData({ transactions: [], categories: [] });
    } catch (error) {
      console.error("Error during import confirmation:", error);
      toast({
        title: "Import failed",
        description: "There was an error processing your imported data.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <Button 
          variant="outline" 
          className="flex items-center gap-2 text-black" 
          onClick={handleExportCSV}
          disabled={isImporting}
        >
          <Download className="h-4 w-4" />
          Export as CSV
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2 text-black" 
          onClick={handleImportClick}
          disabled={isImporting}
        >
          <Upload className="h-4 w-4" />
          {isImporting ? "Importing..." : "Import CSV"}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCSV}
            accept=".csv"
            className="hidden"
            disabled={isImporting}
          />
        </Button>
      </div>

      <AlertDialog open={showReplaceDialog && showDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Import Options
            </AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to replace all your existing data with the imported data, 
              or add the imported data to your existing data?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReplaceDialog(false)} disabled={isImporting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleImportConfirm(false)}
              className="bg-blue-500 hover:bg-blue-600"
              disabled={isImporting}
            >
              Add to Existing
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleImportConfirm(true)}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={isImporting}
            >
              Replace All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DataExportImport;
