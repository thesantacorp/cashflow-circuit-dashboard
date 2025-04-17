
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategorySelectorProps {
  categoryId: string;
  categories: Category[];
  onCategoryChange: (value: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  categoryId, 
  categories,
  onCategoryChange 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <Select value={categoryId} onValueChange={onCategoryChange} required>
        <SelectTrigger id="category" className="category-select-trigger">
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent position="popper" className="category-select-content max-h-[40vh] overflow-y-auto">
          <div className="category-grid">
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  <span
                    className="h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategorySelector;
