
import React, { useRef } from "react";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const DataExportImport: React.FC = () => {
  const { state, importData } = useTransactions();
  const { currency } = useCurrency();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    try {
      // Prepare transactions data
      const transactions = state.transactions.map(t => {
        const category = state.categories.find(c => c.id === t.categoryId);
        return {
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
        return `${t.type},${t.category},${t.amount},${safeDescription},${t.date},${t.emotion},${t.currency}`;
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

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        
        // Create a function to parse CSV row considering quoted fields
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
          
          transactions.push({
            type: rowData.type,
            amount: parseFloat(rowData.amount),
            description: rowData.description || '',
            date: new Date(rowData.date).toISOString(),
            categoryId,
            emotionalState: rowData.emotion || 'neutral',
            id: `imported-${Date.now()}-${i}`
          });
        }
        
        if (transactions.length === 0) {
          throw new Error("No valid transactions found in the CSV file");
        }
        
        // Import the data
        importData(transactions);
        
        toast({
          title: "Import successful",
          description: `${transactions.length} transactions have been imported.`
        });
      } catch (error) {
        console.error("Import error:", error);
        toast({
          title: "Import failed",
          description: error instanceof Error ? error.message : "There was an error importing your data.",
          variant: "destructive"
        });
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-4">
      <Button 
        variant="outline" 
        className="flex items-center gap-2" 
        onClick={handleExportCSV}
      >
        <Download className="h-4 w-4" />
        Export as CSV
      </Button>
      
      <Button 
        variant="outline" 
        className="flex items-center gap-2" 
        onClick={handleImportClick}
      >
        <Upload className="h-4 w-4" />
        Import CSV
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportCSV}
          accept=".csv"
          className="hidden"
        />
      </Button>
    </div>
  );
};

export default DataExportImport;
