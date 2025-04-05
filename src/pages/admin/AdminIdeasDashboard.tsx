import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Edit,
  Trash2,
  Plus,
  Clock,
  ExternalLink,
  Info,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Upload,
  Loader2,
  Image as ImageIcon,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { customClient, Idea, VoteSummary } from '@/integrations/supabase/customClient';

const AdminIdeasDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [voteSummary, setVoteSummary] = useState<Record<string, VoteSummary>>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form fields
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [countdownTimer, setCountdownTimer] = useState('');
  const [liveProjectLink, setLiveProjectLink] = useState('');
  const [learnMoreLink, setLearnMoreLink] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Verify user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        navigate('/');
        return;
      }
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', user.id)
          .single();
          
        // Simple admin check (replace with a proper role-based system in production)
        if (data && (data.email === 'SupErAdmIn@example.com' || data.full_name === 'SupErAdmIn')) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          navigate('/');
          toast.error('You do not have permission to access this page');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        navigate('/');
      }
    };
    
    checkAdminStatus();
  }, [user, navigate]);

  // Fetch ideas and vote summaries
  const fetchIdeas = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await customClient.ideas
        .select()
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setIdeas(data || []);
      
      // Fetch vote summaries for each idea
      if (data && data.length > 0) {
        const voteStats: Record<string, VoteSummary> = {};
        
        for (const idea of data) {
          const { data: upvotes, error: upvotesError } = await customClient.votes
            .select()
            .eq('idea_id', idea.id)
            .eq('vote_type', 'upvote');
            
          const { data: downvotes, error: downvotesError } = await customClient.votes
            .select()
            .eq('idea_id', idea.id)
            .eq('vote_type', 'downvote');
            
          if (upvotesError) throw upvotesError;
          if (downvotesError) throw downvotesError;
          
          voteStats[idea.id] = {
            idea_id: idea.id,
            upvotes: upvotes?.length || 0,
            downvotes: downvotes?.length || 0
          };
        }
        
        setVoteSummary(voteStats);
      }
      
    } catch (error: any) {
      console.error('Error fetching ideas:', error.message);
      toast.error('Failed to fetch ideas');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isAdmin) {
      fetchIdeas();
    }
  }, [isAdmin]);

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description || !countdownTimer) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setIsUploading(true);
      
      let finalImageUrl = imageUrl;
      
      // If a new image file is selected, upload it
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `ideas/${fileName}`;
        
        // Get pre-signed URL for upload
        const { data, error: urlError } = await supabase
          .storage
          .from('ideas')
          .createSignedUploadUrl(filePath);
          
        if (urlError) throw urlError;
        
        // Upload file using signed URL
        const uploadResponse = await fetch(data.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile
        });
        
        if (!uploadResponse.ok) throw new Error('Failed to upload image');
        
        // Get public URL of uploaded image
        const { data: { publicUrl } } = supabase
          .storage
          .from('ideas')
          .getPublicUrl(filePath);
          
        finalImageUrl = publicUrl;
      }
      
      // Format the date
      const formattedDate = new Date(countdownTimer).toISOString();
      
      if (editingIdea) {
        // Update existing idea
        const { error } = await customClient.ideas
          .update({
            name,
            description,
            image_url: finalImageUrl,
            countdown_timer: formattedDate,
            live_project_link: liveProjectLink || null,
            learn_more_link: learnMoreLink || null
          })
          .eq('id', editingIdea.id);
          
        if (error) throw error;
        
        toast.success('Idea updated successfully');
      } else {
        // Create new idea
        const { error } = await customClient.ideas
          .insert({
            name,
            description,
            image_url: finalImageUrl,
            countdown_timer: formattedDate,
            live_project_link: liveProjectLink || null,
            learn_more_link: learnMoreLink || null,
            created_by: user?.id
          });
          
        if (error) throw error;
        
        toast.success('Idea created successfully');
      }
      
      // Reset form and fetch updated ideas
      resetForm();
      setDialogOpen(false);
      fetchIdeas();
      
    } catch (error: any) {
      console.error('Error saving idea:', error.message);
      toast.error('Failed to save idea');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteIdea = async (id: string) => {
    try {
      const { error } = await customClient.ideas
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Idea deleted successfully');
      fetchIdeas();
    } catch (error: any) {
      console.error('Error deleting idea:', error.message);
      toast.error('Failed to delete idea');
    }
  };
  
  const handleEditIdea = (idea: Idea) => {
    setEditingIdea(idea);
    setName(idea.name);
    setDescription(idea.description);
    setImageUrl(idea.image_url);
    setImageFile(null);
    setCountdownTimer(idea.countdown_timer.split('T')[0]); // Format date for input
    setLiveProjectLink(idea.live_project_link || '');
    setLearnMoreLink(idea.learn_more_link || '');
    setDialogOpen(true);
  };
  
  const resetForm = () => {
    setEditingIdea(null);
    setName('');
    setDescription('');
    setImageUrl(null);
    setImageFile(null);
    setCountdownTimer('');
    setLiveProjectLink('');
    setLearnMoreLink('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isAdmin) {
    return null; // Redirect handled in useEffect
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
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={() => {
                        resetForm();
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Idea
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <form onSubmit={handleFormSubmit}>
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

                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 gap-2">
                          <label htmlFor="name" className="font-medium">
                            Idea Name *
                          </label>
                          <Input
                            id="name"
                            placeholder="Enter idea name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <label htmlFor="description" className="font-medium">
                            Description *
                          </label>
                          <Textarea
                            id="description"
                            placeholder="Describe this idea in detail"
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <label htmlFor="image" className="font-medium">
                            Image
                          </label>
                          <div className="flex flex-col gap-3">
                            <input
                              id="image"
                              type="file"
                              ref={fileInputRef}
                              onChange={handleImageChange}
                              className="hidden"
                              accept="image/*"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              {imageUrl ? 'Change Image' : 'Upload Image'}
                            </Button>
                            {imageUrl && (
                              <div className="aspect-video w-full overflow-hidden rounded-md border border-gray-200">
                                <img
                                  src={imageUrl}
                                  alt="Preview"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <label htmlFor="countdown" className="font-medium">
                            Countdown Timer *
                          </label>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            <Input
                              id="countdown"
                              type="date"
                              value={countdownTimer}
                              onChange={(e) => setCountdownTimer(e.target.value)}
                              required
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <label htmlFor="liveProject" className="font-medium">
                            Live Project Link
                          </label>
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-5 w-5 text-gray-500" />
                            <Input
                              id="liveProject"
                              type="url"
                              placeholder="https://example.com"
                              value={liveProjectLink}
                              onChange={(e) => setLiveProjectLink(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <label htmlFor="learnMore" className="font-medium">
                            Learn More Link
                          </label>
                          <div className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-gray-500" />
                            <Input
                              id="learnMore"
                              type="url"
                              placeholder="https://example.com/learn-more"
                              value={learnMoreLink}
                              onChange={(e) => setLearnMoreLink(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setDialogOpen(false);
                            resetForm();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          className="bg-orange-500 hover:bg-orange-600"
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : editingIdea ? (
                            'Update Idea'
                          ) : (
                            'Create Idea'
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
              ) : ideas.length === 0 ? (
                <div className="text-center py-10">
                  <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No ideas found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Create your first idea to get started
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Countdown</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ideas.map((idea) => {
                        const votes = voteSummary[idea.id] || { upvotes: 0, downvotes: 0 };
                        const countdown = new Date(idea.countdown_timer);
                        const hasExpired = countdown < new Date();
                        return (
                          <TableRow key={idea.id}>
                            <TableCell className="font-medium">{idea.name}</TableCell>
                            <TableCell className={hasExpired ? 'text-red-500' : ''}>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(countdown, 'MMM d, yyyy')}
                                {hasExpired && ' (Expired)'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center text-green-600">
                                  <ThumbsUp className="h-4 w-4 mr-1" />
                                  {votes.upvotes}
                                </div>
                                <div className="flex items-center text-red-600">
                                  <ThumbsDown className="h-4 w-4 mr-1" />
                                  {votes.downvotes}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(idea.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditIdea(idea)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-red-500">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Idea</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{idea.name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-500 hover:bg-red-600"
                                        onClick={() => handleDeleteIdea(idea.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
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
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
              ) : ideas.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No ideas found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ideas.map((idea) => {
                    const votes = voteSummary[idea.id] || { upvotes: 0, downvotes: 0 };
                    const totalVotes = votes.upvotes + votes.downvotes;
                    const upvotePercentage = totalVotes > 0 ? Math.round((votes.upvotes / totalVotes) * 100) : 0;
                    
                    return (
                      <Card key={idea.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{idea.name}</CardTitle>
                          <CardDescription>{format(new Date(idea.countdown_timer), 'MMM d, yyyy')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span>Upvotes</span>
                                <span className="text-green-600 font-medium">{upvotePercentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-green-500 h-2.5 rounded-full" 
                                  style={{ width: `${upvotePercentage}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="flex justify-between">
                              <div className="flex items-center">
                                <ThumbsUp className="h-4 w-4 text-green-600 mr-1" />
                                <span>{votes.upvotes} upvotes</span>
                              </div>
                              <div className="flex items-center">
                                <ThumbsDown className="h-4 w-4 text-red-600 mr-1" />
                                <span>{votes.downvotes} downvotes</span>
                              </div>
                            </div>
                            
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-sm text-gray-500">
                                Total: {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminIdeasDashboard;
