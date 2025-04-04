import React, { useState, useEffect } from "react";
import { useCrowdfunding } from "@/context/CrowdfundingContext";
import { useCurrency } from "@/context/CurrencyContext";
import { format, parseISO, isAfter } from "date-fns";
import { CrowdfundingProject, Backer } from "@/types/crowdfunding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, ExternalLink, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ProjectFormData {
  title: string;
  description: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
  projectDetails: string;
  externalLink?: string;
  currency: string;
  currencySymbol: string;
}

const defaultFormData: ProjectFormData = {
  title: "",
  description: "",
  targetAmount: 1000,
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
  projectDetails: "",
  externalLink: "",
  currency: "USD",
  currencySymbol: "$",
};

const CrowdfundingManager: React.FC = () => {
  const { state, addProject, updateProject, deleteProject, getBackersForProject } = useCrowdfunding();
  const { currencySymbol } = useCurrency();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewBackersDialogOpen, setIsViewBackersDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<CrowdfundingProject | null>(null);
  const [selectedProjectBackers, setSelectedProjectBackers] = useState<Backer[]>([]);
  const [formData, setFormData] = useState<ProjectFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, [name]: numValue }));
      
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.description) newErrors.description = "Description is required";
    if (!formData.targetAmount || formData.targetAmount <= 0) {
      newErrors.targetAmount = "Target amount must be greater than 0";
    }
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.projectDetails) newErrors.projectDetails = "Project details are required";
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    if (end <= start) {
      newErrors.endDate = "End date must be after start date";
    }
    
    if (formData.externalLink && !isValidUrl(formData.externalLink)) {
      newErrors.externalLink = "Please enter a valid URL";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await addProject(formData);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedProject) return;
    
    try {
      await updateProject({
        ...selectedProject,
        title: formData.title,
        description: formData.description,
        targetAmount: formData.targetAmount,
        startDate: formData.startDate,
        endDate: formData.endDate,
        projectDetails: formData.projectDetails,
        externalLink: formData.externalLink || undefined,
        currency: formData.currency,
        currencySymbol: formData.currencySymbol,
      });
      
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedProject) {
      try {
        await deleteProject(selectedProject.id);
        setIsDeleteDialogOpen(false);
        setSelectedProject(null);
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setErrors({});
    setSelectedProject(null);
  };

  const handleViewBackers = (project: CrowdfundingProject) => {
    setSelectedProject(project);
    setSelectedProjectBackers(getBackersForProject(project.id));
    setIsViewBackersDialogOpen(true);
  };

  const handleEditClick = (project: CrowdfundingProject) => {
    setSelectedProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      targetAmount: project.targetAmount,
      startDate: project.startDate.substring(0, 10),
      endDate: project.endDate.substring(0, 10),
      projectDetails: project.projectDetails,
      externalLink: project.externalLink || "",
      currency: project.currency || "USD",
      currencySymbol: project.currencySymbol || "$",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (project: CrowdfundingProject) => {
    setSelectedProject(project);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleFullyFunded = async (project: CrowdfundingProject) => {
    try {
      await updateProject({
        ...project,
        isFullyFunded: !project.isFullyFunded
      });
      
      toast.success(`Project marked as ${!project.isFullyFunded ? 'fully funded' : 'not fully funded'}`);
    } catch (error) {
      toast.error("Failed to update project status");
    }
  };

  const renderProjectList = () => {
    if (state.projects.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-gray-500 mb-4">No crowdfunding projects have been created yet.</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Project
          </Button>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Timeline</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Backers</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.projects.map(project => {
            const backers = getBackersForProject(project.id);
            const percentFunded = Math.min(100, (project.raisedAmount / project.targetAmount) * 100);
            const isActive = !project.isFullyFunded && isAfter(new Date(project.endDate), new Date());
            
            return (
              <TableRow key={project.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{project.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-[200px]">{project.description}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(project.startDate), 'MMM d')} - {format(new Date(project.endDate), 'MMM d, yyyy')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-40">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{currencySymbol}{project.raisedAmount.toLocaleString()}</span>
                      <span>{currencySymbol}{project.targetAmount.toLocaleString()}</span>
                    </div>
                    <Progress value={percentFunded} className="h-1" />
                  </div>
                </TableCell>
                <TableCell>
                  {project.isFullyFunded ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                      Fully Funded
                    </Badge>
                  ) : isActive ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200">
                      Ended
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewBackers(project)}
                  >
                    {backers.length} backers
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleFullyFunded(project)}
                      title={project.isFullyFunded ? "Mark as not fully funded" : "Mark as fully funded"}
                    >
                      {project.isFullyFunded ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClick(project)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(project)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Crowdfunding Management</h2>
          <p className="text-gray-500">Manage crowdfunding projects and track contributions</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {renderProjectList()}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Crowdfunding Project</DialogTitle>
            <DialogDescription>
              Add all the details for your new crowdfunding project.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Project Title"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="A brief description of the project"
                  rows={2}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="targetAmount">Target Amount ({currencySymbol})</Label>
                <Input
                  id="targetAmount"
                  name="targetAmount"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.targetAmount}
                  onChange={handleNumberInputChange}
                />
                {errors.targetAmount && <p className="text-sm text-red-500">{errors.targetAmount}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                  {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                  {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="projectDetails">Project Details</Label>
                <Textarea
                  id="projectDetails"
                  name="projectDetails"
                  value={formData.projectDetails}
                  onChange={handleInputChange}
                  placeholder="Detailed description, goals, and benefits of the project"
                  rows={6}
                />
                {errors.projectDetails && <p className="text-sm text-red-500">{errors.projectDetails}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="externalLink">External Link (Optional)</Label>
                <Input
                  id="externalLink"
                  name="externalLink"
                  value={formData.externalLink}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
                {errors.externalLink && <p className="text-sm text-red-500">{errors.externalLink}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Crowdfunding Project</DialogTitle>
            <DialogDescription>
              Update the details for this crowdfunding project.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Project Title</Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Short Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-targetAmount">Target Amount ({currencySymbol})</Label>
                <Input
                  id="edit-targetAmount"
                  name="targetAmount"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.targetAmount}
                  onChange={handleNumberInputChange}
                />
                {errors.targetAmount && <p className="text-sm text-red-500">{errors.targetAmount}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                  {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                  {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-projectDetails">Project Details</Label>
                <Textarea
                  id="edit-projectDetails"
                  name="projectDetails"
                  value={formData.projectDetails}
                  onChange={handleInputChange}
                  rows={6}
                />
                {errors.projectDetails && <p className="text-sm text-red-500">{errors.projectDetails}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-externalLink">External Link (Optional)</Label>
                <Input
                  id="edit-externalLink"
                  name="externalLink"
                  value={formData.externalLink}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
                {errors.externalLink && <p className="text-sm text-red-500">{errors.externalLink}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">{selectedProject?.title}</p>
            <p className="text-sm text-gray-500 mt-1">{selectedProject?.description}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewBackersDialogOpen} onOpenChange={setIsViewBackersDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Project Backers</DialogTitle>
            <DialogDescription>
              Viewing all backers for {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedProjectBackers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                This project doesn't have any backers yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProjectBackers.map(backer => (
                    <TableRow key={backer.id}>
                      <TableCell>{backer.firstName}</TableCell>
                      <TableCell>{backer.email}</TableCell>
                      <TableCell>{currencySymbol}{backer.amount}</TableCell>
                      <TableCell>{format(new Date(backer.timestamp), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewBackersDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrowdfundingManager;
