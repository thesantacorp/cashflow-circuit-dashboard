
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCrowdfunding } from '@/context/CrowdfundingContext';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ArrowLeft, Calendar, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const ProjectDetailsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProjectById, getBackersForProject } = useCrowdfunding();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(10);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const project = projectId ? getProjectById(projectId) : undefined;
  const backers = projectId ? getBackersForProject(projectId) : [];
  
  useEffect(() => {
    if (!project) {
      navigate('/grow');
    }
  }, [project, navigate]);
  
  if (!project) {
    return <div>Loading...</div>;
  }
  
  const today = new Date();
  const endDate = new Date(project.endDate);
  const daysLeft = Math.max(0, differenceInDays(endDate, today));
  const percentFunded = Math.min(100, (project.raisedAmount / project.targetAmount) * 100);
  const isActive = !project.isFullyFunded && endDate > today;
  const currencySymbol = project.currencySymbol || "$";
  
  const handleBackClick = () => {
    navigate('/grow');
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setAmount(value);
    }
  };
  
  // This would be replaced with actual PayPal integration
  const handleFundProject = () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaymentDialogOpen(false);
      
      toast.success(`Thank you for your contribution of ${currencySymbol}${amount}!`);
      
      // In a real implementation, we'd redirect to PayPal and handle the confirmation
      // after they return. For now, we'll show a success message and simulate redirection
      
      toast("You'll be redirected to join our community soon!");
      
      // Simulate navigation to homepage after a delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }, 2000);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={handleBackClick}
        className="mb-6 pl-0 flex items-center"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Opportunities
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{project.title}</h1>
              {project.isFullyFunded && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Fully Funded
                </span>
              )}
              {!project.isFullyFunded && daysLeft === 0 && (
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Ended
                </span>
              )}
            </div>
            <p className="text-lg text-gray-600 mb-4">{project.description}</p>
            
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {format(new Date(project.startDate), 'MMM d')} - {format(new Date(project.endDate), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{backers.length} backers</span>
              </div>
            </div>
            
            {project.externalLink && (
              <Button variant="outline" className="flex items-center mb-6" asChild>
                <a href={project.externalLink} target="_blank" rel="noopener noreferrer">
                  Visit Project Website
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </Button>
            )}
          </div>
          
          <div className="prose max-w-none">
            <h2 className="text-xl font-bold mb-4">Project Details</h2>
            <div className="whitespace-pre-wrap">{project.projectDetails}</div>
          </div>
        </div>
        
        <div>
          <Card className="sticky top-4">
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span>{currencySymbol}{project.raisedAmount.toLocaleString()}</span>
                  <span>{currencySymbol}{project.targetAmount.toLocaleString()}</span>
                </div>
                <Progress value={percentFunded} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{percentFunded.toFixed(0)}% funded</span>
                  {daysLeft > 0 && !project.isFullyFunded ? (
                    <span>{daysLeft} days left</span>
                  ) : (
                    <span>{project.isFullyFunded ? 'Goal reached' : 'Campaign ended'}</span>
                  )}
                </div>
              </div>
              
              {isActive ? (
                <div>
                  <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full mb-4">Support This Project</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Support {project.title}</DialogTitle>
                        <DialogDescription>
                          Enter the amount you would like to contribute to this project.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="amount">Amount ({currencySymbol})</Label>
                          <Input
                            id="amount"
                            type="number"
                            min="1"
                            step="1"
                            value={amount}
                            onChange={handleAmountChange}
                          />
                        </div>
                        <div className="text-sm text-gray-500">
                          You'll be redirected to PayPal to complete your payment securely.
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleFundProject} disabled={isProcessing}>
                          {isProcessing ? 'Processing...' : `Fund ${currencySymbol}${amount}`}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <p className="text-sm text-gray-500 text-center">
                    Payments are securely processed via PayPal.
                  </p>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-gray-500 mb-2">
                    {project.isFullyFunded
                      ? 'This project has been fully funded. Thank you for your interest!'
                      : 'This funding period has ended.'}
                  </p>
                </div>
              )}
              
              {backers.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-semibold mb-2">Recent Backers</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {backers
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .slice(0, 10)
                      .map(backer => (
                        <div key={backer.id} className="flex justify-between items-center text-sm">
                          <span>{backer.firstName}</span>
                          <span className="font-medium">{currencySymbol}{backer.amount}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
