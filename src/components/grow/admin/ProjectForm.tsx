
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, ImageIcon, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Project } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface ProjectFormProps {
  project: Project | null;
  onClose: (refresh?: boolean) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onClose }) => {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [amount, setAmount] = useState(project?.amount?.toString() || "");
  const [liveLink, setLiveLink] = useState(project?.live_link || "");
  const [moreDetails, setMoreDetails] = useState(project?.more_details || "");
  const [hasExpiration, setHasExpiration] = useState(!!project?.expiration_date);
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    project?.expiration_date ? new Date(project.expiration_date) : undefined
  );
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(project?.image_url || null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image is too large", { description: "Maximum file size is 5MB" });
        return;
      }
      
      setImageFile(file);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setImagePreview(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const supabase = getSupabaseClient();
      let imageUrl = project?.image_url || null;
      
      // Upload image if a new one was selected
      if (imageFile) {
        try {
          // First, ensure the bucket exists
          const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('grow');
          
          if (bucketError && bucketError.message.includes('does not exist')) {
            // Create bucket if it doesn't exist
            const { error: createBucketError } = await supabase.storage.createBucket('grow', {
              public: true,
              fileSizeLimit: 5242880 // 5MB
            });
            
            if (createBucketError) {
              console.error("Error creating storage bucket:", createBucketError);
              toast.error("Failed to set up storage");
              setIsSubmitting(false);
              return;
            }
          }
          
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `project-images/${fileName}`;
          
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('grow')
            .upload(filePath, imageFile);
            
          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            toast.error("Failed to upload image");
            setIsSubmitting(false);
            return;
          }
          
          // Get public URL for the uploaded image
          const { data: { publicUrl } } = supabase.storage
            .from('grow')
            .getPublicUrl(filePath);
            
          imageUrl = publicUrl;
        } catch (imageError) {
          console.error("Exception during image upload:", imageError);
          toast.error("Failed to upload image");
          setIsSubmitting(false);
          return;
        }
      }
      
      const projectData = {
        name,
        description,
        amount: amount ? parseFloat(amount) : null,
        live_link: liveLink || null,
        more_details: moreDetails || null,
        expiration_date: hasExpiration && expirationDate ? expirationDate.toISOString() : null,
        image_url: imageUrl,
      };
      
      if (project) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id);
          
        if (error) {
          console.error("Error updating project:", error);
          toast.error("Failed to update project");
        } else {
          toast.success("Project updated successfully");
          onClose(true);
        }
      } else {
        // Create new project
        const { error, data } = await supabase
          .from('projects')
          .insert({
            ...projectData,
            upvotes: 0,
            downvotes: 0,
            created_at: new Date().toISOString()
          })
          .select();
          
        if (error) {
          console.error("Error creating project:", error);
          toast.error("Failed to create project");
        } else {
          toast.success("Project created successfully");
          onClose(true);
        }
      }
    } catch (err) {
      console.error("Exception in project form:", err);
      toast.error("An error occurred while saving the project");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-gray-700">Project Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
            placeholder="Enter project name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description" className="text-gray-700">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1"
            placeholder="Enter project description"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount" className="text-gray-700">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <Label htmlFor="liveLink" className="text-gray-700">Project Live Link</Label>
            <Input
              id="liveLink"
              type="url"
              value={liveLink}
              onChange={(e) => setLiveLink(e.target.value)}
              className="mt-1"
              placeholder="https://..."
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="moreDetails" className="text-gray-700">More Details</Label>
          <Textarea
            id="moreDetails"
            value={moreDetails}
            onChange={(e) => setMoreDetails(e.target.value)}
            className="mt-1"
            placeholder="Additional information about the project"
            rows={4}
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="projectImage" className="text-gray-700">Project Image</Label>
            <span className="text-xs text-gray-500">Max size: 5MB</span>
          </div>
          
          <div className="flex items-center gap-4">
            {imagePreview ? (
              <div className="relative w-24 h-24 overflow-hidden rounded border">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                  }}
                  className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 flex items-center justify-center border border-dashed rounded bg-gray-50">
                <ImageIcon className="w-8 h-8 text-gray-300" />
              </div>
            )}
            
            <div className="flex-1">
              <Input
                id="projectImage"
                type="file"
                onChange={handleImageChange}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="mt-1"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="hasExpiration" 
              checked={hasExpiration}
              onCheckedChange={setHasExpiration}
            />
            <Label htmlFor="hasExpiration" className="text-gray-700">Enable countdown timer</Label>
          </div>
          
          {hasExpiration && (
            <div>
              <Label htmlFor="expirationDate" className="text-gray-700">Expiration Date</Label>
              <div className="mt-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expirationDate ? (
                        format(expirationDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expirationDate}
                      onSelect={setExpirationDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => onClose()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          className="bg-orange-500 hover:bg-orange-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {project ? "Updating..." : "Creating..."}
            </>
          ) : (
            project ? "Update Project" : "Create Project"
          )}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
