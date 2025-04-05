
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash, Edit, Calendar, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSupabaseClient } from "@/utils/supabase/client";
import { Project } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import ProjectForm from "@/components/grow/admin/ProjectForm";
import { Badge } from "@/components/ui/badge";

const AdminGrowPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load innovation projects");
        setProjects([]);
      } else {
        setProjects(data);
      }
    } catch (err) {
      console.error("Exception fetching projects:", err);
      toast.error("Failed to load innovation projects");
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setCurrentProject(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setCurrentProject(project);
    setIsDialogOpen(true);
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      setIsDeleting(true);
      
      try {
        const supabase = getSupabaseClient();
        
        // First delete related votes
        const { error: votesError } = await supabase
          .from('project_votes')
          .delete()
          .eq('project_id', projectId);
          
        if (votesError) {
          console.error("Error deleting project votes:", votesError);
          toast.error("Failed to delete project votes");
          setIsDeleting(false);
          return;
        }
        
        // Then delete the project
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId);
          
        if (error) {
          console.error("Error deleting project:", error);
          toast.error("Failed to delete project");
        } else {
          toast.success("Project deleted successfully");
          fetchProjects();
        }
      } catch (err) {
        console.error("Exception deleting project:", err);
        toast.error("Failed to delete project");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDialogClose = (refresh?: boolean) => {
    setIsDialogOpen(false);
    if (refresh) {
      fetchProjects();
    }
  };

  const getProjectStatus = (project: Project) => {
    if (!project.expiration_date) {
      return { label: "Active", color: "green" };
    }
    
    const now = new Date();
    const expiration = new Date(project.expiration_date);
    
    if (expiration <= now) {
      return { label: "Expired", color: "gray" };
    }
    
    const timeLeft = expiration.getTime() - now.getTime();
    if (timeLeft < 86400000) { // Less than 24 hours
      return { label: "Ending Soon", color: "orange" };
    }
    
    return { label: "Active", color: "green" };
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Innovation Projects</h1>
        <Button 
          onClick={handleAddNew} 
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add New Project
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">All Projects</h2>
          <Button 
            variant="outline" 
            onClick={() => navigate("/grow")}
            className="text-orange-500 border-orange-200 hover:bg-orange-50"
          >
            View Public Page
          </Button>
        </div>
        
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 mb-4">No projects found. Add your first innovation project!</p>
            <Button 
              onClick={handleAddNew}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="text-left bg-orange-50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 rounded-tl-lg">Name</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Expiration</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">Votes</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600 rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const status = getProjectStatus(project);
                  return (
                    <tr key={project.id} className="border-b border-gray-100">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-800">{project.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">{project.description}</div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge 
                          className={`
                            ${status.color === "green" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                            ${status.color === "orange" ? "bg-orange-100 text-orange-800 hover:bg-orange-100" : ""}
                            ${status.color === "gray" ? "bg-gray-100 text-gray-800 hover:bg-gray-100" : ""}
                          `}
                        >
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {project.expiration_date ? (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {format(new Date(project.expiration_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Never expires</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center text-green-600">
                            <Check className="h-3.5 w-3.5 mr-1" />
                            <span>{project.upvotes || 0}</span>
                          </div>
                          <div className="flex items-center text-red-600">
                            <X className="h-3.5 w-3.5 mr-1" />
                            <span>{project.downvotes || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(project)}
                          className="text-gray-600 hover:text-orange-600 hover:bg-orange-50 mr-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
                          disabled={isDeleting}
                          className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentProject ? "Edit Project" : "Create New Project"}</DialogTitle>
          </DialogHeader>
          <ProjectForm 
            project={currentProject}
            onClose={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGrowPage;
