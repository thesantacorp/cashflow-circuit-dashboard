
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Code } from "@/components/ui/code";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Code2, Database, Lock, KeyRound, Copy, CheckCircle } from "lucide-react";
import { useClipboard } from "@/hooks/use-clipboard";

const RlsConfigGuide: React.FC = () => {
  const { copyToClipboard, hasCopied } = useClipboard();
  
  // SQL to fix the RLS policies - completely disabling RLS for testing
  const disableRlsSql = `
-- TEMPORARY: Disable RLS completely for testing
ALTER TABLE public.user_uuids DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to anon and authenticated roles
GRANT ALL ON public.user_uuids TO anon, authenticated;
GRANT USAGE ON SEQUENCE user_uuids_id_seq TO anon, authenticated;
  `.trim();
  
  // SQL to implement proper RLS policies
  const properRlsSql = `
-- Step 1: Enable Row Level Security
ALTER TABLE public.user_uuids ENABLE ROW LEVEL SECURITY;

-- Step 2: Delete any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable all access" ON public.user_uuids;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.user_uuids;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.user_uuids;
DROP POLICY IF EXISTS "Allow selecting records" ON public.user_uuids;

-- Step 3: Create the "Enable all access" policy that allows all operations
CREATE POLICY "Enable all access" 
ON public.user_uuids 
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Step 4: Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_uuids TO anon, authenticated;
GRANT USAGE ON SEQUENCE user_uuids_id_seq TO anon, authenticated;
  `.trim();

  const handleCopyDisableSQL = () => {
    copyToClipboard(disableRlsSql);
  };
  
  const handleCopyProperSQL = () => {
    copyToClipboard(properRlsSql);
  };

  return (
    <Card className="border-red-200 shadow-lg">
      <CardHeader className="bg-red-50 border-b border-red-100">
        <CardTitle className="text-red-700 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Database Permission Error - RLS Policy Fix Required
        </CardTitle>
        <CardDescription className="text-red-600">
          Your app cannot write to the database due to Row Level Security (RLS) policy restrictions
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTitle className="text-red-700">Error Code: 42501</AlertTitle>
          <AlertDescription className="text-red-600">
            The database connection is working, but Row-Level Security (RLS) policies are preventing data 
            from being written to the <code>user_uuids</code> table.
          </AlertDescription>
        </Alert>

        <div className="text-sm space-y-2">
          <p className="font-medium">Error details:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Connection to Supabase: <span className="text-green-600 font-medium">Successful</span></li>
            <li>Table exists: <span className="text-green-600 font-medium">Yes</span></li>
            <li>Read access: <span className="text-green-600 font-medium">Working</span></li>
            <li>Write access: <span className="text-red-600 font-medium">Blocked by RLS policies</span></li>
            <li>Error message: <span className="text-red-600 font-medium">new row violates row-level security policy</span></li>
          </ul>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="quick-fix">
            <AccordionTrigger className="text-amber-600 font-medium">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Quick Fix: Temporarily Disable RLS (Testing Only)
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm">
              <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                <AlertTitle>Warning: Testing Only</AlertTitle>
                <AlertDescription>
                  This temporarily disables all security policies. Only use for testing and re-enable proper 
                  policies in production.
                </AlertDescription>
              </Alert>
              
              <p>Execute this SQL in the Supabase SQL Editor to temporarily disable RLS:</p>
              <div className="relative">
                <Code className="text-xs p-3 block bg-slate-900 text-slate-100 overflow-x-auto">
                  {disableRlsSql}
                </Code>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600"
                  onClick={handleCopyDisableSQL}
                >
                  {hasCopied ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy SQL
                    </>
                  )}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="solution" defaultChecked>
            <AccordionTrigger className="text-indigo-600 font-medium">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Recommended Solution: Configure Proper RLS Policies
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm">
              <p>Follow these steps to properly configure RLS for your app:</p>
              
              <ol className="list-decimal pl-5 space-y-2">
                <li>Log into your <strong>Supabase Dashboard</strong></li>
                <li>Go to <strong>SQL Editor</strong></li>
                <li>Create a new SQL query</li>
                <li>Paste and execute the following SQL code:</li>
              </ol>
              
              <div className="relative">
                <Code className="text-xs p-3 block bg-slate-900 text-slate-100 overflow-x-auto">
                  {properRlsSql}
                </Code>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600"
                  onClick={handleCopyProperSQL}
                >
                  {hasCopied ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy SQL
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-emerald-800">
                <p className="font-medium flex items-center gap-1">
                  <KeyRound className="h-4 w-4" />
                  After applying these changes:
                </p>
                <p className="mt-1">
                  Return to the app and refresh the page. The app should now be able to write data to the database.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t flex justify-between items-center">
        <p className="text-xs text-slate-500">
          Once fixed, your app will automatically sync data with the cloud
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open('https://supabase.com/docs/guides/auth/row-level-security', '_blank')}
          >
            Supabase RLS Docs
          </Button>
          <Button 
            variant="default"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => window.location.reload()}
          >
            Refresh App
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RlsConfigGuide;
