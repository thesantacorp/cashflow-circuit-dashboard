
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectScrollUpButton, SelectScrollDownButton } from "@/components/ui/select";
import { Category } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp, ChevronDown } from "lucide-react";

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
        <SelectTrigger id="category" className="category-select-trigger text-base">
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent 
          position="popper" 
          className="category-select-content max-h-[40vh] overflow-y-auto"
        >
          <SelectScrollUpButton className="flex justify-center items-center py-2">
            <ChevronUp className="h-6 w-6 text-gray-500" />
          </SelectScrollUpButton>
          <div className="category-grid px-2">
            {categories.map((category) => (
              <SelectItem 
                key={category.id} 
                value={category.id} 
                className="text-base py-2"
              >
                <div className="flex items-center">
                  <span
                    className="h-4 w-4 rounded-full mr-3"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </div>
          <SelectScrollDownButton className="flex justify-center items-center py-2">
            <ChevronDown className="h-6 w-6 text-gray-500" />
          </SelectScrollDownButton>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategorySelector;
