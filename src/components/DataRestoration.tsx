
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { DataRestorationProvider } from "./restoration/DataRestorationProvider";
import DataRestorationContent from "./restoration/DataRestorationContent";

interface DataRestorationProps {
  onCancel: () => void;
}

const DataRestoration: React.FC<DataRestorationProps> = ({ onCancel }) => {
  return (
    <Card className="border-indigo-200 shadow-lg bg-gradient-to-b from-white to-indigo-50/30">
      <CardHeader className="border-b border-indigo-100">
        <CardTitle className="text-indigo-600 flex items-center gap-2">
          <Download className="h-5 w-5" />
          Import Existing Data
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <DataRestorationProvider onCancel={onCancel}>
          <DataRestorationContent onCancel={onCancel} />
        </DataRestorationProvider>
      </CardContent>
    </Card>
  );
};

export default DataRestoration;
