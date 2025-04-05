
import { Loader2, ImageIcon } from 'lucide-react';

interface AdminIdeasLoadingProps {
  type?: 'loading' | 'empty';
}

export const AdminIdeasLoading = ({ type = 'loading' }: AdminIdeasLoadingProps) => {
  if (type === 'empty') {
    return (
      <div className="text-center py-10">
        <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No ideas found</p>
        <p className="text-gray-400 text-sm mt-2">
          Create your first idea to get started
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
    </div>
  );
};
