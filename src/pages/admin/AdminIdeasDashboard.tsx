
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AdminIdeasTable } from '@/components/admin/ideas/AdminIdeasTable';
import { AdminIdeaForm } from '@/components/admin/ideas/AdminIdeaForm';
import { AdminVotesStatsGrid } from '@/components/admin/ideas/AdminVotesStatsGrid';
import { AdminIdeasLoading } from '@/components/admin/ideas/AdminIdeasLoading';
import { useIdeasManagement } from '@/hooks/admin/useIdeasManagement';

const AdminIdeasDashboard = () => {
  const navigate = useNavigate();
  const { 
    ideas,
    voteSummary,
    loading,
    isAdmin,
    dialogOpen,
    setDialogOpen,
    isUploading,
    editingIdea,
    handleFormSubmit,
    handleDeleteIdea,
    handleEditIdea,
    handleNewIdea
  } = useIdeasManagement();

  if (!isAdmin) {
    return null; // Redirect handled in useIdeasManagement
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ideas Management</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to App
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ideas" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="ideas">All Ideas</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="ideas">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manage Ideas</CardTitle>
                  <CardDescription>
                    Create, edit, and delete ideas for community voting
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600"
                    onClick={handleNewIdea}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Idea
                  </Button>
                  
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingIdea ? 'Edit Idea' : 'Create New Idea'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingIdea 
                          ? 'Update the details of this idea' 
                          : 'Create a new idea for community voting'}
                      </DialogDescription>
                    </DialogHeader>

                    <AdminIdeaForm 
                      idea={editingIdea} 
                      onSubmit={handleFormSubmit}
                      isUploading={isUploading}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <AdminIdeasLoading />
              ) : ideas.length === 0 ? (
                <AdminIdeasLoading type="empty" />
              ) : (
                <AdminIdeasTable 
                  ideas={ideas}
                  voteSummary={voteSummary}
                  onEditIdea={handleEditIdea}
                  onDeleteIdea={handleDeleteIdea}
                  loading={loading}
                />
              )}
            </CardContent>
            <CardFooter className="border-t py-4 text-sm text-gray-500">
              {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'} found
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Voting Statistics</CardTitle>
              <CardDescription>
                View voting statistics for all ideas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <AdminIdeasLoading />
              ) : ideas.length === 0 ? (
                <AdminIdeasLoading type="empty" />
              ) : (
                <AdminVotesStatsGrid 
                  ideas={ideas}
                  voteSummary={voteSummary}
                  loading={loading}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminIdeasDashboard;
