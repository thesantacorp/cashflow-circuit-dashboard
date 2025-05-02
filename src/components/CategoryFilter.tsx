
import React, { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Category } from "@/types";
import { toast } from "sonner";

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
  // Log to help debug category selections
  useEffect(() => {
    console.log("CategoryFilter - Selected category:", selectedCategory);
    console.log("CategoryFilter - Available categories:", categories.map(c => ({id: c.id, name: c.name})));
  }, [selectedCategory, categories]);

  // Handle change with additional validation
  const handleCategoryChange = (value: string) => {
    console.log("CategoryFilter - Changing to:", value);
    onChange(value);
  };

  // Ensure no duplicate IDs in the categories 
  const uniqueCategories = categories.reduce((acc: Category[], current) => {
    const isDuplicate = acc.some(item => item.id === current.id);
    if (!isDuplicate) {
      acc.push(current);
    } else {
      console.warn(`Duplicate category ID detected: ${current.id} - ${current.name}`);
    }
    return acc;
  }, []);

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-2">Filter by Category</h3>
      <Select 
        value={selectedCategory} 
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {uniqueCategories.map((category) => (
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
