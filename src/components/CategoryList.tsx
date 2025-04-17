import React, { useState, useEffect } from "react";
import { useTransactions } from "@/context/transaction";
import { Category, Transaction, TransactionType } from "@/types";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EditCategoryModal from "./EditCategoryModal";
import { toast } from "sonner";

interface CategoryListProps {
  type: TransactionType;
  filteredTransactions?: Transaction[];
}

const CategoryList: React.FC<CategoryListProps> = ({ type, filteredTransactions }) => {
  const { state, getCategoriesByType, addCategory, deleteCategory, isOnline } = useTransactions();
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<string>("");
  const [color, setColor] = useState<string>(type === "expense" ? "#e74c3c" : "#27ae60");

  // Update categories when the type or state changes
  useEffect(() => {
    const fetchedCategories = getCategoriesByType(type);
    console.log(`[CategoryList] Fetched ${fetchedCategories.length} ${type} categories`, fetchedCategories);
    setCategories(fetchedCategories);
  }, [type, getCategoriesByType, state.categories]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    // Check if category already exists (case-insensitive)
    const categoryExists = categories.some(
      cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase()
    );
    
    if (categoryExists) {
      toast.error(`A ${type} category named "${newCategory}" already exists.`);
      return;
    }
    
    // Add the new category
    console.log(`[CategoryList] Attempting to add category: ${newCategory} (${type})`);
    const success = addCategory({
      name: newCategory.trim(),
      type,
      color
    });
    
    if (success) {
      console.log(`[CategoryList] Successfully added category: ${newCategory}`);
      setNewCategory("");
      setColor(type === "expense" ? "#e74c3c" : "#27ae60");
      setOpen(false);
      
      // Manually fetch updated categories
      const updatedCategories = getCategoriesByType(type);
      setCategories(updatedCategories);
      
      toast.success(`Added ${type} category: ${newCategory}`);
      
      if (!isOnline) {
        toast.info("You're offline. Changes will sync when you reconnect.", {
          duration: 4000
        });
      }
    } else {
      console.error(`[CategoryList] Failed to add category: ${newCategory}`);
      toast.error("Failed to add category. Please try again.");
    }
  };

  const handleDeleteCategory = (id: string) => {
    console.log(`[CategoryList] Attempting to delete category with ID: ${id}`);
    const success = deleteCategory(id);
    
    if (success) {
      toast.success("Category deleted successfully");
      
      // Update local state to reflect deletion
      setCategories(prev => prev.filter(c => c.id !== id));
      
      if (!isOnline) {
        toast.info("You're offline. Changes will sync when you reconnect.", {
          duration: 4000
        });
      }
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
        {categories.length > 0 ? (
          categories.map((category) => (
            <CategoryCard 
              key={category.id} 
              category={category} 
              onDelete={handleDeleteCategory} 
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No categories found. Add one to get started.
          </div>
        )}
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
