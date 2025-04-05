
import React from "react";

const GrowPageHeader: React.FC = () => {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-3xl md:text-4xl font-bold text-orange-800 mb-4">
        Spark Innovation
      </h1>
      <h2 className="text-xl md:text-2xl font-medium text-orange-700 mb-4">
        Discover new Ideas.
      </h2>
      <p className="max-w-3xl mx-auto text-gray-600">
        Explore a curated list of innovative product ideas to spark your entrepreneurial spirit. 
        Vote on the concepts you believe have the most potential, find talents to help you 
        build and scale ideas in our community.
      </p>
    </div>
  );
};

export default GrowPageHeader;
