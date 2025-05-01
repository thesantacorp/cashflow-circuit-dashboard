
import React, { useState, useEffect } from "react";
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
  const [name, setName] = useState(category?.name || "");
  const [color, setColor] = useState(category?.color || "#cccccc");
  const { updateCategory, isOnline } = useTransactions();
  
  // Update state when the category prop changes
  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color || "#cccccc");
    }
  }, [category]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    console.log('EditCategoryModal - Original category:', category);
    
    // Create updated category with the same ID but updated name and color
    const updatedCategory: Category = {
      ...category,
      name: name.trim(),
      color,
    };

    console.log('EditCategoryModal - Preparing to save category with ID:', updatedCategory.id);
    console.log('EditCategoryModal - Updated category:', updatedCategory);

    // Use the updateCategory function to update the existing category
    const success = updateCategory(updatedCategory);
    
    if (success) {
      toast.success("Category updated successfully");
      if (!isOnline) {
        toast.info("You're offline. Changes will sync when you reconnect.", {
          duration: 4000
        });
      }
      onClose();
    } else {
      toast.error("Failed to update category");
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
