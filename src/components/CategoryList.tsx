
import React, { useState } from "react";
import { useTransactions } from "@/context/transaction";
import { Category, TransactionType } from "@/types";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EditCategoryModal from "./EditCategoryModal";

interface CategoryListProps {
  type: TransactionType;
}

const CategoryList: React.FC<CategoryListProps> = ({ type }) => {
  const { getCategoriesByType, addCategory, deleteCategory, deduplicate } = useTransactions();
  const categories = getCategoriesByType(type);
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<string>("");
  const [color, setColor] = useState<string>(type === "expense" ? "#e74c3c" : "#27ae60");

  // Run deduplicate on initial load
  React.useEffect(() => {
    deduplicate();
  }, [deduplicate]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      // Check if category already exists (case-insensitive)
      const categoryExists = categories.some(
        cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase()
      );
      
      if (categoryExists) {
        alert(`A ${type} category named "${newCategory}" already exists.`);
        return;
      }
      
      addCategory({
        name: newCategory.trim(),
        type,
        color,
      });
      setNewCategory("");
      setColor(type === "expense" ? "#e74c3c" : "#27ae60");
      setOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {type === "expense" ? "Expense" : "Income"} Categories
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New {type === "expense" ? "Expense" : "Income"} Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex space-x-2">
                  <Input
                    type="color"
                    id="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#hex"
                    className="flex-1"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Add Category</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} onDelete={deleteCategory} />
        ))}
      </div>
    </div>
  );
};

interface CategoryCardProps {
  category: Category;
  onDelete: (id: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onDelete }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <div
        className="p-4 rounded-lg shadow-sm border flex flex-col justify-between"
        style={{ borderLeftColor: category.color, borderLeftWidth: "4px" }}
      >
        <div className="flex justify-between items-start">
          <p className="font-medium truncate flex-1" title={category.name}>
            {category.name}
          </p>
          <div className="flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-blue-500"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(category.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {isEditModalOpen && (
        <EditCategoryModal 
          category={category} 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}
    </>
  );
};

export default CategoryList;
