
import React from "react";
import { ExternalLink } from "lucide-react";

const CommunityLink: React.FC = () => {
  return (
    <div className="py-3 text-center border-t mt-auto">
      <a 
        href="https://stackdhq.com/join/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-sm text-orange-600 hover:text-orange-800 transition-colors flex items-center justify-center gap-1"
      >
        Join the community <ExternalLink size={14} />
      </a>
    </div>
  );
};

export default CommunityLink;
