
import React from "react";
import StatusItem from "./StatusItem";

interface StatusGridProps {
  verification: {
    connected: boolean;
    tableExists: boolean;
    hasReadAccess: boolean;
    hasWriteAccess: boolean;
    hasRlsError?: boolean;
  };
}

const StatusGrid: React.FC<StatusGridProps> = ({ verification }) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatusItem 
        label="Connection"
        status={verification.connected}
        description={verification.connected ? "Successfully connected to Supabase" : "Cannot connect to Supabase"}
      />
      
      <StatusItem 
        label="Table Exists"
        status={verification.tableExists}
        description={verification.tableExists ? "user_uuids table exists" : "user_uuids table not found"}
      />
      
      <StatusItem 
        label="Read Access"
        status={verification.hasReadAccess}
        description={verification.hasReadAccess ? "Can read from database" : "Cannot read from database"}
      />
      
      <StatusItem 
        label="Write Access"
        status={verification.hasWriteAccess}
        description={verification.hasWriteAccess ? "Can write to database" : "Cannot write to database"}
        important={!verification.hasWriteAccess && verification.hasRlsError}
      />
    </div>
  );
};

export default StatusGrid;
