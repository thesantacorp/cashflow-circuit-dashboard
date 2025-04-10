
import { useRef, useState, useEffect } from 'react';
import {
  Calendar,
  Upload,
  Info,
  ExternalLink,
  Loader2,
  ImageIcon,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Idea } from '@/integrations/supabase/customClient';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminIdeaFormProps {
  idea: Idea | null;
  onSubmit: (formData: {
    name: string;
    description: string;
    imageFile: File | null;
    imageUrl: string | null;
    countdownTimer: string;
    liveProjectLink: string;
    learnMoreLink: string;
  }) => Promise<void>;
  isUploading: boolean;
}

export const AdminIdeaForm = ({ idea, onSubmit, isUploading }: AdminIdeaFormProps) => {
  const [name, setName] = useState(idea?.name || '');
  const [description, setDescription] = useState(idea?.description || '');
  const [imageUrl, setImageUrl] = useState<string | null>(idea?.image_url || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [countdownTimer, setCountdownTimer] = useState(
    idea?.countdown_timer ? idea.countdown_timer.split('T')[0] : ''
  );
  const [liveProjectLink, setLiveProjectLink] = useState(idea?.live_project_link || '');
  const [learnMoreLink, setLearnMoreLink] = useState(idea?.learn_more_link || '');
  const [imageName, setImageName] = useState<string>('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  useEffect(() => {
    setImageError(null);
    setSubmitError(null);
    if (idea?.image_url) {
      setImageName('Current image');
    }
  }, [idea]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError(null);
    setSubmitError(null);
    
    if (!name || !description || !countdownTimer) {
      setSubmitError('Please fill in all required fields');
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      await onSubmit({
        name,
        description,
        imageFile,
        imageUrl,
        countdownTimer,
        liveProjectLink,
        learnMoreLink
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('Failed to submit the form. Please try again.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);
    
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size exceeds 5MB limit');
      return;
    }
    
    if (!file.type.match('image.*')) {
      setImageError('Please select an image file');
      return;
    }
    
    setImageFile(file);
    setImageName(file.name);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.onerror = () => {
      setImageError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSubmit}>
      {submitError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      
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
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {imageUrl ? 'Change Image' : 'Upload Image'}
              </Button>
              {imageName && (
                <span className="text-sm text-gray-500 truncate max-w-[200px]">
                  {imageName}
                </span>
              )}
            </div>
            {imageError && (
              <p className="text-sm text-red-500">{imageError}</p>
            )}
            {imageUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-md border border-gray-200">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={() => {
                    setImageError('Failed to load image preview');
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center aspect-video w-full overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                <ImageIcon className="h-12 w-12 text-gray-300" />
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

      <div className="flex justify-end gap-2 mt-4">
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
          ) : idea ? (
            'Update Idea'
          ) : (
            'Create Idea'
          )}
        </Button>
      </div>
    </form>
  );
};
