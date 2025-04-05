
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { getAllUuids } from "@/utils/supabase/index";
import UuidRecordsTable from "./UuidRecordsTable";
import { toast } from "sonner";

interface AdminSectionProps {
  userEmail: string | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AdminSection: React.FC<AdminSectionProps> = ({
  userEmail,
  isLoading,
  setIsLoading
}) => {
  const [showAllUuids, setShowAllUuids] = useState(false);
  const [allUuids, setAllUuids] = useState<any[] | null>(null);
  
  const loadAllUuids = async () => {
    setIsLoading(true);
    
    try {
      const uuids = await getAllUuids();
      setAllUuids(uuids);
      
      if (!uuids || uuids.length === 0) {
        toast.info("No User IDs found in the database");
      }
    } catch (error) {
      console.error("Error loading all UUIDs:", error);
      toast.error("Failed to load User IDs from the database");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-2 pt-2 border-t border-indigo-100">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm text-indigo-700">Database Records (Admin):</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAllUuids(!showAllUuids)}
          className="text-indigo-600 hover:text-indigo-700 p-1 h-auto"
        >
          {showAllUuids ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      
      {showAllUuids && (
        <>
          <Button
            onClick={loadAllUuids}
            variant="outline"
            size="sm"
            className="text-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Loading...
              </>
            ) : (
              "Load Database Records"
            )}
          </Button>
          
          {allUuids && <UuidRecordsTable records={allUuids} userEmail={userEmail} />}
        </>
      )}
    </div>
  );
};

export default AdminSection;
