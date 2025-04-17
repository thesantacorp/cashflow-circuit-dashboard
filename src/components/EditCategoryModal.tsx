
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransactions } from "@/context/transaction";
import { Category } from "@/types";
import { toast } from "sonner";

interface EditCategoryModalProps {
  category: Category;
  isOpen: boolean;
  onClose: () => void;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ 
  category,
  isOpen, 
  onClose 
}) => {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color || "#cccccc");
  const { getCategoriesByType, dispatch, updateCategory } = useTransactions();
  
  // Get all categories of the same type for duplicate checking
  const categoriesOfSameType = getCategoriesByType(category.type);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    // Check if another category with this name already exists (excluding the current one)
    const nameExists = categoriesOfSameType.some(
      cat => cat.id !== category.id && cat.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (nameExists) {
      toast.error(`A ${category.type} category named "${name}" already exists.`);
      return;
    }

    // Create updated category
    const updatedCategory: Category = {
      ...category,
      name: name.trim(),
      color,
    };

    // Use the updateCategory function instead of directly dispatching
    const success = updateCategory(updatedCategory);
    
    if (success) {
      toast.success("Category updated successfully");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Category Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-color">Color</Label>
            <div className="flex space-x-2">
              <Input
                type="color"
                id="edit-color"
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
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
