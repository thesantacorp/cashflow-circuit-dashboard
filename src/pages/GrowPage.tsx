
import React, { useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GrowPageHeader from "@/components/grow/GrowPageHeader";
import GrowConnectionStatus from "@/components/grow/GrowConnectionStatus";
import GrowTabsContent from "@/components/grow/GrowTabsContent";
import { useGrowDbInit } from "@/hooks/useGrowDbInit";
import { useGrowProjects } from "@/hooks/useGrowProjects";

const GrowPage: React.FC = () => {
  const {
    isInitializing,
    initAttempts,
    error,
    connectionStatus,
    checkConnectionAndInit,
    checkTablesAndFetchProjects
  } = useGrowDbInit();
  
  const {
    isLoading,
    filterState,
    setFilterState,
    fetchProjects,
    handleVote,
    getFilteredProjects
  } = useGrowProjects();

  useEffect(() => {
    const initializeAndFetch = async () => {
      const success = await checkConnectionAndInit();
      if (success) {
        fetchProjects();
      }
    };
    
    initializeAndFetch();
  }, []);

  const handleTabChange = (value: string) => {
    setFilterState(value as "all" | "active" | "expired");
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <GrowPageHeader />
      
      <GrowConnectionStatus
        connectionStatus={connectionStatus}
        error={error}
        initAttempts={initAttempts}
        isInitializing={isInitializing}
        onRetryConnection={checkConnectionAndInit}
        onInitializeTables={async () => {
          const success = await checkTablesAndFetchProjects();
          if (success) {
            fetchProjects();
          }
        }}
      />
      
      <Tabs 
        defaultValue="all" 
        className="mt-6"
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="all">All Ideas</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        
        <GrowTabsContent
          activeTab={filterState}
          isLoading={isLoading}
          projects={getFilteredProjects()}
          error={error}
          onVote={handleVote}
        />
      </Tabs>
    </div>
  );
};

export default GrowPage;
