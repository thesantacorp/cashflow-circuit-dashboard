
import { Loader2 } from 'lucide-react';

export const IdeasLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      <p className="mt-4 text-lg">Loading ideas...</p>
    </div>
  );
};
