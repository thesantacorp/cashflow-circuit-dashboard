
import React from "react";

interface UuidRecord {
  email: string;
  uuid: string;
  created_at: string;
}

interface UuidRecordsTableProps {
  records: UuidRecord[];
  userEmail: string | null;
}

const UuidRecordsTable: React.FC<UuidRecordsTableProps> = ({ records, userEmail }) => {
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
          <div 
            key={index}
            className={`text-xs p-2 grid grid-cols-3 ${
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            } ${item.email === userEmail ? 'bg-indigo-50' : ''}`}
          >
            <div className="truncate">{item.email}</div>
            <div className="truncate">{item.uuid.substring(0, 8)}...</div>
            <div>{new Date(item.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UuidRecordsTable;
