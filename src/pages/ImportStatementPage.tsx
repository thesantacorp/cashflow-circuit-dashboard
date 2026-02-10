import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Check, Loader2, Trash2 } from "lucide-react";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  suggestedCategory: string;
  categoryId: string;
  selected: boolean;
}

const ImportStatementPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addTransaction, getCategoriesByType, state } = useTransactions();
  const { currencySymbol } = useCurrency();
  const { toast } = useToast();

  const expenseCategories = getCategoriesByType("expense");
  const incomeCategories = getCategoriesByType("income");

  const findCategoryId = (name: string, type: "expense" | "income"): string => {
    const cats = type === "expense" ? expenseCategories : incomeCategories;
    const match = cats.find(c => c.name.toLowerCase() === name.toLowerCase());
    return match?.id || cats[0]?.id || "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setTransactions([]);
    } else {
      toast({ title: "Invalid file", description: "Please select a PDF file.", variant: "destructive" });
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    
    // Simple PDF text extraction - find text between BT and ET markers
    let text = "";
    const decoder = new TextDecoder("latin1");
    const raw = decoder.decode(uint8);
    
    // Extract text from PDF streams
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;
    while ((match = streamRegex.exec(raw)) !== null) {
      const chunk = match[1];
      // Extract readable ASCII text
      const readable = chunk.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
      if (readable.length > 5) {
        text += readable + "\n";
      }
    }

    // Also try extracting text objects (Tj, TJ operators)
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    while ((match = tjRegex.exec(raw)) !== null) {
      text += match[1] + " ";
    }

    // Fallback: extract any readable strings from the entire file
    if (text.trim().length < 50) {
      const lines = raw.split(/[\r\n]+/);
      for (const line of lines) {
        const clean = line.replace(/[^\x20-\x7E]/g, "").trim();
        if (clean.length > 10 && !clean.startsWith("%") && !clean.includes("obj") && !clean.includes("endobj")) {
          text += clean + "\n";
        }
      }
    }

    return text;
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const text = await extractTextFromPDF(file);

      if (text.trim().length < 20) {
        toast({
          title: "Could not read PDF",
          description: "The PDF might be scanned/image-based. Try a text-based bank statement PDF.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("parse-bank-statement", {
        body: { text },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const parsed: ParsedTransaction[] = (data.transactions || []).map((t: any) => ({
        date: t.date,
        description: t.description,
        amount: Math.abs(Number(t.amount)),
        type: t.type === "income" ? "income" : "expense",
        suggestedCategory: t.suggestedCategory,
        categoryId: findCategoryId(t.suggestedCategory, t.type === "income" ? "income" : "expense"),
        selected: true,
      }));

      setTransactions(parsed);
      toast({ title: "Success", description: `Found ${parsed.length} transactions.` });
    } catch (err: any) {
      console.error("Import error:", err);
      toast({ title: "Import failed", description: err.message || "Failed to parse statement.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = (index: number, field: keyof ParsedTransaction, value: any) => {
    setTransactions(prev => prev.map((t, i) => {
      if (i !== index) return t;
      const updated = { ...t, [field]: value };
      // If type changed, reassign category
      if (field === "type") {
        updated.categoryId = findCategoryId(updated.suggestedCategory, value as "expense" | "income");
      }
      return updated;
    }));
  };

  const removeTransaction = (index: number) => {
    setTransactions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const selected = transactions.filter(t => t.selected);
    if (selected.length === 0) {
      toast({ title: "No transactions selected", variant: "destructive" });
      return;
    }

    setSaving(true);
    let added = 0;
    for (const t of selected) {
      const success = addTransaction({
        amount: t.amount,
        categoryId: t.categoryId,
        date: new Date(t.date).toISOString(),
        description: t.description,
        type: t.type,
        emotionalState: "neutral",
      });
      if (success) added++;
    }

    toast({ title: "Imported!", description: `${added} transactions added successfully.` });
    setTransactions([]);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-600">Import Bank Statement</h1>
        <p className="text-muted-foreground">Upload a PDF bank statement to extract and categorize transactions automatically.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="pdf-upload" className="sr-only">Choose PDF</Label>
              <Input
                id="pdf-upload"
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            <Button onClick={handleUpload} disabled={!file || loading} className="bg-orange-500 hover:bg-orange-600">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {loading ? "Parsing..." : "Extract Transactions"}
            </Button>
          </div>
          {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Extracted Transactions ({transactions.length})</span>
              <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Save {transactions.filter(t => t.selected).length} Transactions
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <input
                        type="checkbox"
                        checked={transactions.every(t => t.selected)}
                        onChange={(e) => setTransactions(prev => prev.map(t => ({ ...t, selected: e.target.checked })))}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t, i) => {
                    const categories = t.type === "expense" ? expenseCategories : incomeCategories;
                    return (
                      <TableRow key={i} className={!t.selected ? "opacity-50" : ""}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={t.selected}
                            onChange={(e) => updateTransaction(i, "selected", e.target.checked)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={t.date}
                            onChange={(e) => updateTransaction(i, "date", e.target.value)}
                            className="w-[140px] text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={t.description}
                            onChange={(e) => updateTransaction(i, "description", e.target.value)}
                            className="min-w-[200px] text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">{currencySymbol}</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={t.amount}
                              onChange={(e) => updateTransaction(i, "amount", parseFloat(e.target.value) || 0)}
                              className="w-[100px] text-sm"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={t.type} onValueChange={(v) => updateTransaction(i, "type", v)}>
                            <SelectTrigger className="w-[110px] text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expense">Expense</SelectItem>
                              <SelectItem value="income">Income</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={t.categoryId} onValueChange={(v) => updateTransaction(i, "categoryId", v)}>
                            <SelectTrigger className="w-[160px] text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                                    {c.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeTransaction(i)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportStatementPage;
