
import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertTriangle, FileSpreadsheet } from "lucide-react";
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

interface DataExportImportProps {
  showDialog?: boolean;
}

// Case-insensitive header lookup with common aliases
const HEADER_ALIASES: Record<string, string> = {
  id: "id",
  type: "type",
  "transaction type": "type",
  category: "category",
  amount: "amount",
  value: "amount",
  description: "description",
  note: "description",
  notes: "description",
  date: "date",
  emotion: "emotion",
  "emotional state": "emotion",
  currency: "currency",
};

const canonicalizeHeader = (raw: string): string => {
  const key = String(raw ?? "").replace(/^\uFEFF/, "").trim().toLowerCase();
  return HEADER_ALIASES[key] || key;
};

// Robust RFC4180 CSV parser: handles quoted fields, "" escapes, embedded commas
const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }
  if (value !== "" || row.length > 0) {
    row.push(value);
    rows.push(row);
  }
  return rows;
};

// Clean amounts like "$1,234.50", "(500.00)", "1 234,50" → number
const parseAmount = (raw: unknown): number => {
  let s = String(raw ?? "").trim();
  if (!s) return NaN;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[^0-9.\-]/g, "");
  const n = parseFloat(s);
  if (isNaN(n)) return NaN;
  return negative ? -Math.abs(n) : n;
};

const toLocalISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Accepts Date objects (from Excel), "YYYY-MM-DD", "MM/DD/YYYY", Excel serials
const parseDateToISO = (raw: unknown): string | null => {
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return new Date(toLocalISODate(raw)).toISOString();
  }
  const s = String(raw ?? "").trim();
  if (!s) return null;
  // Excel serial date (5+ digit number)
  if (/^\d{5}(\.\d+)?$/.test(s)) {
    const d = new Date(Math.round((parseFloat(s) - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0] + "T00:00:00.000Z";
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const parseType = (raw: unknown): "expense" | "income" => {
  const s = String(raw ?? "").trim().toLowerCase();
  return s === "income" ? "income" : "expense";
};

const DataExportImport: React.FC<DataExportImportProps> = ({ showDialog = true }) => {
  const { state, importData, replaceAllData } = useTransactions();
  const { currency } = useCurrency();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [importedData, setImportedData] = useState<{ transactions: Transaction[], categories: any[] }>({
    transactions: [],
    categories: []
  });

  const handleExportCSV = () => {
    try {
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

      const headers = Object.keys(transactions[0]).join(',');

      const csvRows = transactions.map(t => {
        const safeDescription = t.description ? `"${t.description.replace(/"/g, '""')}"` : "";
        return `${t.id},${t.type},${t.category},${t.amount},${safeDescription},${t.date},${t.emotion},${t.currency}`;
      });

      const csvContent = [headers, ...csvRows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.setAttribute('href', url);
      link.setAttribute('download', `stack_d_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

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

  // Build row objects from a matrix of raw values (CSV or Excel)
  const rowsToObjects = (matrix: unknown[][]): Record<string, string>[] => {
    if (matrix.length === 0) return [];
    const headers = (matrix[0] as unknown[]).map(h => canonicalizeHeader(String(h ?? "")));
    return matrix.slice(1)
      .filter(r => (r as unknown[]).some(v => String(v ?? "").trim() !== ""))
      .map(r => {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          const v = (r as unknown[])[index];
          obj[header] = v instanceof Date ? toLocalISODate(v) : String(v ?? "");
        });
        return obj;
      });
  };

  const objectsToTransactions = (rows: Record<string, string>[]): Transaction[] => {
    const categoryMap = new Map<string, string>();
    state.categories.forEach(c => categoryMap.set(c.name.toLowerCase().trim(), c.id));

    const transactions: Transaction[] = [];
    rows.forEach((rowData, i) => {
      const type = parseType(rowData.type);
      const amount = parseAmount(rowData.amount);
      const dateISO = parseDateToISO(rowData.date);

      if (isNaN(amount) || !dateISO) {
        console.warn(`Skipping row ${i + 1}: missing or invalid amount/date`, rowData);
        return;
      }

      // Find category ID or fall back to a default of the same type
      let categoryId = '';
      const categoryKey = (rowData.category || "").toLowerCase().trim();
      if (categoryKey) {
        if (categoryMap.has(categoryKey)) {
          categoryId = categoryMap.get(categoryKey)!;
        } else {
          const defaultCategories = state.categories.filter(c => c.type === type);
          if (defaultCategories.length > 0) {
            categoryId = defaultCategories[0].id;
          }
        }
      }

      transactions.push({
        id: rowData.id || `imported-${Date.now()}-${i}`,
        type,
        amount: Math.abs(amount),
        description: rowData.description || '',
        date: dateISO,
        categoryId,
        emotionalState: rowData.emotion ? rowData.emotion.toLowerCase().trim() : 'neutral'
      });
    });
    return transactions;
  };

  const readFile = async (file: File): Promise<Record<string, string>[]> => {
    const name = file.name.toLowerCase();

    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      // Prefer the sheet the Stack'd template fills in; otherwise the first sheet
      const sheetName = workbook.SheetNames.includes("Transactions")
        ? "Transactions"
        : workbook.SheetNames[0];
      const matrix = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        header: 1,
        defval: "",
        blankrows: false,
      }) as unknown[][];
      return rowsToObjects(matrix);
    }

    // CSV / TXT
    const text = await file.text();
    const matrix = parseCSV(text);
    return rowsToObjects(matrix);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await readFile(file);

      if (rows.length === 0) {
        throw new Error("No data rows found in the file");
      }

      const transactions = objectsToTransactions(rows);

      if (transactions.length === 0) {
        throw new Error("No valid transactions found in the file. Each row needs a date and an amount.");
      }

      setImportedData({
        transactions,
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportConfirm = (replace: boolean) => {
    if (replace) {
      replaceAllData(importedData);
      toast({
        title: "Data replaced",
        description: `${importedData.transactions.length} transactions have replaced your existing data.`
      });
    } else {
      importData(importedData);
      toast({
        title: "Import successful",
        description: `${importedData.transactions.length} transactions have been added to your existing data.`
      });
    }
    setShowReplaceDialog(false);
    setImportedData({ transactions: [], categories: [] });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <Button
          variant="outline"
          className="flex items-center gap-2 text-black"
          onClick={handleExportCSV}
        >
          <Download className="h-4 w-4" />
          Export as CSV
        </Button>

        <Button
          variant="outline"
          className="flex items-center gap-2 text-black"
          onClick={handleImportClick}
        >
          <Upload className="h-4 w-4" />
          Import CSV / Excel
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
          />
        </Button>
      </div>

      <AlertDialog open={showReplaceDialog && showDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-orange-500" />
              Import Options
            </AlertDialogTitle>
            <AlertDialogDescription>
              Found {importedData.transactions.length} transactions in your file.
              Do you want to replace all your existing data with the imported data,
              or add the imported data to your existing data?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowReplaceDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleImportConfirm(false)}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Add to Existing
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleImportConfirm(true)}
              className="bg-orange-500 hover:bg-orange-600"
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
