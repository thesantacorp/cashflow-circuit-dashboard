
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ExternalLink, PlusIcon, EditIcon, TrashIcon, ThumbsUp, ThumbsDown } from "lucide-react";
import { useCrowdfunding } from "@/context/CrowdfundingContext";
import { ProductIdea } from "@/types/crowdfunding";
import ProjectCurrencySelector from "./CurrencySelector";

interface IdeaFormData {
  title: string;
  description: string;
  detailedDescription: string;
  externalLink?: string;
  currency: string;
  currencySymbol: string;
}

const ProductIdeaManager: React.FC = () => {
  const { state, addIdea, updateIdea, deleteIdea } = useCrowdfunding();
  const { ideas } = state;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<IdeaFormData>({
    defaultValues: {
      title: "",
      description: "",
      detailedDescription: "",
      externalLink: "",
      currency: "USD",
      currencySymbol: "$"
    }
  });
  
  const resetForm = () => {
    reset({
      title: "",
      description: "",
      detailedDescription: "",
      externalLink: "",
      currency: "USD",
      currencySymbol: "$"
    });
    setIsEditing(false);
    setEditingIdeaId(null);
    setSelectedCurrency("USD");
    setCurrencySymbol("$");
  };
  
  const handleEditIdea = (idea: ProductIdea) => {
    setValue("title", idea.title);
    setValue("description", idea.description);
    setValue("detailedDescription", idea.detailedDescription);
    setValue("externalLink", idea.externalLink || "");
    setIsEditing(true);
    setEditingIdeaId(idea.id);
    setSelectedCurrency(idea.currency || "USD");
    setCurrencySymbol(idea.currencySymbol || "$");
  };
  
  const onSubmit = async (data: IdeaFormData) => {
    try {
      // Update form data with selected currency
      data.currency = selectedCurrency;
      data.currencySymbol = currencySymbol;
      
      if (isEditing && editingIdeaId) {
        const ideaToUpdate = ideas.find(i => i.id === editingIdeaId);
        if (ideaToUpdate) {
          await updateIdea({
            ...ideaToUpdate,
            title: data.title,
            description: data.description,
            detailedDescription: data.detailedDescription,
            externalLink: data.externalLink,
            currency: data.currency,
            currencySymbol: data.currencySymbol
          });
        }
      } else {
        await addIdea({
          title: data.title,
          description: data.description,
          detailedDescription: data.detailedDescription,
          externalLink: data.externalLink,
          currency: data.currency,
          currencySymbol: data.currencySymbol
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error saving idea:", error);
    }
  };
  
  const handleDeleteIdea = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this idea?")) {
      try {
        await deleteIdea(id);
      } catch (error) {
        console.error("Error deleting idea:", error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit" : "Create"} Product Idea</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Idea Title</Label>
            <Input
              id="title"
              {...register("title", { required: "Idea title is required" })}
              placeholder="Enter idea title"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Brief summary)</Label>
            <Input
              id="description"
              {...register("description", { required: "Description is required" })}
              placeholder="Enter a brief description"
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="detailedDescription">Detailed Description</Label>
            <Textarea
              id="detailedDescription"
              className="min-h-[150px]"
              {...register("detailedDescription", { required: "Detailed description is required" })}
              placeholder="Enter detailed description of the idea"
            />
            {errors.detailedDescription && (
              <p className="text-sm text-red-500">{errors.detailedDescription.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalLink">External Link (Optional)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="externalLink"
                {...register("externalLink")}
                placeholder="https://example.com"
              />
              <ExternalLink className="flex-shrink-0 text-gray-400" size={18} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <ProjectCurrencySelector 
              value={selectedCurrency} 
              onChange={setSelectedCurrency}
              onSymbolChange={setCurrencySymbol}
            />
            <p className="text-xs text-gray-500">This is the reference currency for the idea's potential implementation cost.</p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Idea" : "Create Idea"}
            </Button>
          </div>
        </form>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Existing Ideas</h3>
          {ideas.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No ideas yet. Create your first product idea.</p>
          ) : (
            <div className="space-y-4">
              {ideas.map((idea) => (
                <div key={idea.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex-grow">
                    <h4 className="font-medium">{idea.title}</h4>
                    <p className="text-sm text-gray-500">
                      Posted on {format(new Date(idea.createdAt), "PP")}
                    </p>
                  </div>
                  <div className="flex items-center mr-4">
                    <div className="flex items-center mr-3">
                      <ThumbsUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm">{idea.upvotes}</span>
                    </div>
                    <div className="flex items-center">
                      <ThumbsDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm">{idea.downvotes}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditIdea(idea)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteIdea(idea.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductIdeaManager;
