
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import IdeasGrid from "@/components/ideas/IdeasGrid";
import IdeasLoading from "@/components/ideas/IdeasLoading";
import { useIdeaVotes } from "@/hooks/useIdeaVotes";
import EmptyIdeasState from "@/components/ideas/EmptyIdeasState";

const IdeasPage = () => {
  const { ideas, isLoading, error } = useIdeaVotes();

  return (
    <div className="container py-8 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Ideas you can execute</h1>
        <p className="text-lg font-bold mb-2">at the snap of a finger</p>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover and jump on ready made SAAS products and business ideas, build generational wealth
        </p>
      </div>

      {isLoading ? (
        <IdeasLoading />
      ) : error ? (
        <Card className="w-full p-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600">Error loading ideas. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      ) : ideas.length === 0 ? (
        <EmptyIdeasState />
      ) : (
        <IdeasGrid ideas={ideas} />
      )}
    </div>
  );
};

export default IdeasPage;
