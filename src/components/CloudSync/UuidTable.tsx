
import React from "react";
import UuidRecord from "./UuidRecord";

interface UuidTableProps {
  records: any[] | null;
  userEmail: string | null;
}

const UuidTable: React.FC<UuidTableProps> = ({ records, userEmail }) => {
  if (!records || records.length === 0) {
    return <p className="text-sm text-gray-500">No records found in database</p>;
  }
  
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="text-xs font-medium bg-indigo-50 text-indigo-800 p-2 grid grid-cols-3">
        <div>Email</div>
        <div>UUID</div>
        <div>Created</div>
      </div>
      <div className="max-h-40 overflow-y-auto">
        {records.map((item, index) => (
          <UuidRecord 
            key={index} 
            item={item} 
            index={index} 
            userEmail={userEmail}
          />
        ))}
      </div>
    </div>
  );
};

export default UuidTable;
