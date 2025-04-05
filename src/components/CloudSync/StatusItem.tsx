
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface StatusItemProps {
  label: string;
  status: boolean;
  description: string;
}

const StatusItem: React.FC<StatusItemProps> = ({ label, status, description }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}:</span>
      <Badge 
        variant={status ? "default" : "destructive"}
        className={`${status ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
      >
        {status ? "OK" : "Issue"}
      </Badge>
    </div>
    <p className="text-xs text-gray-600 flex items-center gap-1">
      {status ? (
        <CheckCircle2 className="h-3 w-3 text-green-600" />
      ) : (
        <XCircle className="h-3 w-3 text-red-600" />
      )}
      {description}
    </p>
  </div>
);

export default StatusItem;
