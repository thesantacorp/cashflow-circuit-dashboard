
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@/types";

interface CategoryFilterProps {
  selectedCategory: string | 'all';
  categories: Category[];
  onChange: (value: string | 'all') => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  selectedCategory,
  categories,
  onChange
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-2">Filter by Category</h3>
      <Select 
        value={selectedCategory} 
        onValueChange={onChange}
      >
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
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
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategoryFilter;
