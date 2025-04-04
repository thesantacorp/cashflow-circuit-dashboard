
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ExternalLink, PlusIcon, EditIcon, TrashIcon } from "lucide-react";
import { useCrowdfunding } from "@/context/CrowdfundingContext";
import { CrowdfundingProject } from "@/types/crowdfunding";
import ProjectCurrencySelector from "./CurrencySelector";

const CrowdfundingManager: React.FC = () => {
  const { state, addProject, updateProject, deleteProject } = useCrowdfunding();
  const { projects } = state;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default 30 days from now
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      description: "",
      targetAmount: 1000,
      projectDetails: "",
      externalLink: ""
    }
  });
  
  const resetForm = () => {
    reset({
      title: "",
      description: "",
      targetAmount: 1000,
      projectDetails: "",
      externalLink: ""
    });
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setIsEditing(false);
    setEditingProjectId(null);
    setSelectedCurrency("USD");
    setCurrencySymbol("$");
  };
  
  const handleEditProject = (project: CrowdfundingProject) => {
    setValue("title", project.title);
    setValue("description", project.description);
    setValue("targetAmount", project.targetAmount);
    setValue("projectDetails", project.projectDetails);
    setValue("externalLink", project.externalLink || "");
    setStartDate(new Date(project.startDate));
    setEndDate(new Date(project.endDate));
    setIsEditing(true);
    setEditingProjectId(project.id);
    setSelectedCurrency(project.currency || "USD");
    setCurrencySymbol(project.currencySymbol || "$");
  };
  
  const onSubmit = async (data: any) => {
    try {
      if (isEditing && editingProjectId) {
        const projectToUpdate = projects.find(p => p.id === editingProjectId);
        if (projectToUpdate) {
          await updateProject({
            ...projectToUpdate,
            ...data,
            startDate: startDate?.toISOString() || new Date().toISOString(),
            endDate: endDate?.toISOString() || new Date().toISOString(),
            currency: selectedCurrency,
            currencySymbol: currencySymbol
          });
        }
      } else {
        await addProject({
          ...data,
          startDate: startDate?.toISOString() || new Date().toISOString(),
          endDate: endDate?.toISOString() || new Date().toISOString(),
          currency: selectedCurrency,
          currencySymbol: currencySymbol
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };
  
  const handleDeleteProject = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(id);
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit" : "Create"} Crowdfunding Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                {...register("title", { required: "Project title is required" })}
                placeholder="Enter project title"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message as string}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount</Label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
                  <span className="absolute left-3 top-2.5">{currencySymbol}</span>
                  <Input
                    id="targetAmount"
                    type="number"
                    className="pl-8"
                    min={1}
                    {...register("targetAmount", { required: "Target amount is required", min: 1 })}
                  />
                </div>
                <div className="w-1/2">
                  <ProjectCurrencySelector 
                    value={selectedCurrency} 
                    onChange={setSelectedCurrency}
                    onSymbolChange={setCurrencySymbol}
                  />
                </div>
              </div>
              {errors.targetAmount && (
                <p className="text-sm text-red-500">{errors.targetAmount.message as string}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Brief summary)</Label>
            <Input
              id="description"
              {...register("description", { required: "Description is required" })}
              placeholder="Enter a brief description"
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message as string}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setIsStartCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setIsEndCalendarOpen(false);
                    }}
                    disabled={(date) => date < (startDate || new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDetails">Project Details</Label>
            <Textarea
              id="projectDetails"
              className="min-h-[150px]"
              {...register("projectDetails", { required: "Project details are required" })}
              placeholder="Enter detailed description of the project"
            />
            {errors.projectDetails && (
              <p className="text-sm text-red-500">{errors.projectDetails.message as string}</p>
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Update Project" : "Create Project"}
            </Button>
          </div>
        </form>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Existing Projects</h3>
          {projects.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No projects yet. Create your first crowdfunding project.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div>
                    <h4 className="font-medium">{project.title}</h4>
                    <p className="text-sm text-gray-500">
                      {project.currencySymbol || "$"}{project.targetAmount.toLocaleString()} • Ends {format(new Date(project.endDate), "PP")}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditProject(project)}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteProject(project.id)}
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

export default CrowdfundingManager;
