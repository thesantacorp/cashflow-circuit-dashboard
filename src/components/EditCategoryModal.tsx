
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransactions } from "@/context/transaction";
import { Category } from "@/types";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [targetCategory, setTargetCategory] = useState<string | null>(null);
  const [showMoveOption, setShowMoveOption] = useState(false);
  const { updateCategory, isOnline, state, getCategoriesByType, reassignTransactions } = useTransactions();

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color || "#cccccc");
      setShowMoveOption(false);
      setTargetCategory(null);
    }
  }, [category]);

  // Get other categories of the same type, EXCLUDING this category.
  const otherCategories = getCategoriesByType(category?.type || "expense")
    .filter(c => c.id !== category?.id);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    // Defensive: don't allow same name as another category (case-insensitive, except this id)
    const duplicate = state.categories.find(c =>
      c.id !== category.id &&
      c.type === category.type &&
      c.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      toast.error(`A category named "${name}" already exists for this type.`);
      return;
    }

    console.log('[EditCategoryModal] Attempting to update category:', name, color, 'ID:', category.id);

    // Only add the move if explicit
    let updated = false;
    const updatedCategory: Category = {
      ...category,
      name: name.trim(),
      color,
    };
    const result = updateCategory(updatedCategory);
    if (result) {
      updated = true;
      // Only move transactions if explicitly selected
      if (showMoveOption && targetCategory) {
        reassignTransactions(category.id, targetCategory);
      }
      toast.success("Category updated successfully");
      if (!isOnline) {
        toast.info("You're offline. Changes will sync when you reconnect.", { duration: 4000 });
      }
      onClose();
    } else {
      toast.error("Failed to update category. It may duplicate another, or an error occurred.");
      // Return early: do NOT close on error
    }
    // Log flow for debugging
    console.log('[EditCategoryModal] Updated:', updatedCategory, 'Result:', result, 'Moved transactions:', showMoveOption && targetCategory);
  };

  const toggleMoveTransactions = () => {
    setShowMoveOption(!showMoveOption);
    if (!showMoveOption) {
      setTargetCategory(null);
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

          <div className="pt-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="move-transactions"
                checked={showMoveOption}
                onChange={toggleMoveTransactions}
                className="rounded border-gray-300"
              />
              <label htmlFor="move-transactions" className="text-sm">
                Move transactions to another category
              </label>
            </div>

            {showMoveOption && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="target-category">Target Category</Label>
                <Select
                  value={targetCategory || ""}
                  onValueChange={setTargetCategory}
                >
                  <SelectTrigger id="target-category" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center">
                          <span
                            className="h-3 w-3 rounded-full mr-2"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
