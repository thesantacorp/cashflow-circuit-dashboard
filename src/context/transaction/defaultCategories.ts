
import { Category } from "@/types";

// Define default categories
export const defaultExpenseCategories: Category[] = [
  { id: "1", name: "Food & Drinks", type: "expense", color: "#e74c3c" },
  { id: "2", name: "Housing", type: "expense", color: "#3498db" },
  { id: "3", name: "Transportation", type: "expense", color: "#2ecc71" },
  { id: "4", name: "Entertainment", type: "expense", color: "#9b59b6" },
  { id: "5", name: "Shopping", type: "expense", color: "#f39c12" },
  { id: "6", name: "Utilities", type: "expense", color: "#1abc9c" },
  { id: "7", name: "Healthcare", type: "expense", color: "#e67e22" },
];

export const defaultIncomeCategories: Category[] = [
  { id: "10", name: "Salary", type: "income", color: "#27ae60" },
  { id: "11", name: "Freelance", type: "income", color: "#2980b9" },
  { id: "12", name: "Investments", type: "income", color: "#8e44ad" },
  { id: "13", name: "Gifts", type: "income", color: "#d35400" },
];

export const allDefaultCategories = [...defaultExpenseCategories, ...defaultIncomeCategories];
