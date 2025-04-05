
import React, { useState, useEffect } from "react";

interface ProjectCountdownProps {
  expirationDate: string;
}

const ProjectCountdown: React.FC<ProjectCountdownProps> = ({ expirationDate }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState<boolean>(false);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const expiration = new Date(expirationDate);
      const difference = expiration.getTime() - now.getTime();
      
      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft("Expired");
        return;
      }
      
      // Calculate days, hours, minutes
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m left`);
      } else {
        setTimeLeft("Less than a minute");
      }
    };
    
    calculateTimeLeft();
    
    // Update countdown every minute
    const timer = setInterval(calculateTimeLeft, 60000);
    
    return () => clearInterval(timer);
  }, [expirationDate]);
  
  return (
    <span className={isExpired ? "text-gray-500" : "text-orange-600"}>
      {timeLeft}
    </span>
  );
};

export default ProjectCountdown;
