
import React from "react";

interface UuidRecordProps {
  item: {
    email: string;
    uuid: string;
    created_at: string;
  };
  index: number;
  userEmail?: string | null;
}

const UuidRecord: React.FC<UuidRecordProps> = ({ item, index, userEmail }) => {
  return (
    <div 
      className={`text-xs p-2 grid grid-cols-3 ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      } ${item.email === userEmail ? 'bg-indigo-50' : ''}`}
    >
      <div className="truncate">{item.email}</div>
      <div className="truncate">{item.uuid.substring(0, 8)}...</div>
      <div>{new Date(item.created_at).toLocaleString()}</div>
    </div>
  );
};

export default UuidRecord;
