
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Database, Download, Upload, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const LocalStorageInfo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-blue-200 mt-6">
      <CardHeader className="border-b border-blue-100 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Info size={18} />
            Your Data is Safe & Private
          </CardTitle>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <button className="rounded-full hover:bg-blue-50 p-1">
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription>
          No account needed — your data stays on your device
        </CardDescription>
      </CardHeader>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="pt-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Local Storage</h3>
                  <p className="text-sm text-muted-foreground">
                    All your transaction data is stored securely in your browser's local storage. 
                    It never leaves your device unless you choose to export it.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Export Data</h3>
                  <p className="text-sm text-muted-foreground">
                    You can export your data anytime as a backup or to transfer it to another device.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Upload className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Import Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Easily import your data from a backup file to restore your transactions and settings.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Share2 className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Cross-Device Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Want to use multiple devices? Simply export your data from one device and import it on another.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default LocalStorageInfo;
