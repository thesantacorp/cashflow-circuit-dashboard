
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
  
  // SQL to fix the RLS policies
  const fixRlsSql = `
-- Enable Row Level Security
ALTER TABLE public.user_uuids ENABLE ROW LEVEL SECURITY;

-- Delete any existing insert policies (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.user_uuids;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.user_uuids;
DROP POLICY IF EXISTS "Users can insert their own records" ON public.user_uuids;

-- Create a policy to allow anonymous inserts (for non-authenticated users)
CREATE POLICY "Allow anonymous inserts" 
ON public.user_uuids 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Create a policy to allow authenticated users to insert records
CREATE POLICY "Allow authenticated inserts" 
ON public.user_uuids 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create a policy to allow selecting records
CREATE POLICY "Allow selecting records" 
ON public.user_uuids 
FOR SELECT 
USING (true);

-- Grant table permissions
GRANT SELECT, INSERT ON public.user_uuids TO anon;
GRANT SELECT, INSERT ON public.user_uuids TO authenticated;

-- Grant usage on sequence
GRANT USAGE ON SEQUENCE user_uuids_id_seq TO anon;
GRANT USAGE ON SEQUENCE user_uuids_id_seq TO authenticated;`;

  const handleCopySQL = () => {
    copyToClipboard(fixRlsSql);
  };

  return (
    <Card className="border-red-200 shadow-lg">
      <CardHeader className="bg-red-50 border-b border-red-100">
        <CardTitle className="text-red-700 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Supabase RLS Policy Fix Required
        </CardTitle>
        <CardDescription className="text-red-600">
          Your app cannot write to the database due to Row Level Security (RLS) policy restrictions
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTitle className="text-red-700">Database Permission Error</AlertTitle>
          <AlertDescription className="text-red-600">
            Your app is connected to Supabase, but Row Level Security (RLS) is preventing data 
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
          </ul>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="solution">
            <AccordionTrigger className="text-indigo-600 font-medium">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                How to Fix This Issue
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm">
              <p>Log into your <strong>Supabase Dashboard</strong> and follow these steps:</p>
              
              <ol className="list-decimal pl-5 space-y-2">
                <li>Go to <strong>Authentication</strong> → <strong>Policies</strong></li>
                <li>Find the <code>user_uuids</code> table in the list</li>
                <li>Delete any existing INSERT policies that might be causing conflicts</li>
                <li>Click <strong>New Policy</strong></li>
                <li>Choose <strong>"Create a policy from scratch"</strong></li>
                <li>Policy name: <code>Allow anonymous inserts</code></li>
                <li>For the policy definition, select <strong>INSERT</strong> as the operation</li>
                <li>Target roles: <code>anon</code></li>
                <li>Policy definition (WITH CHECK expression):
                  <div className="mt-2 mb-3">
                    <Code className="text-xs p-3 block bg-slate-900 text-slate-100">
                      -- Allow all inserts
                      true
                    </Code>
                  </div>
                </li>
                <li>Click <strong>Review</strong> then <strong>Save Policy</strong></li>
                <li>Repeat steps 4-10 to create another policy for authenticated users if needed</li>
              </ol>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800">
                <p className="font-medium flex items-center gap-1">
                  <Database className="h-4 w-4" />
                  For SELECT operations:
                </p>
                <p className="mt-2">
                  Create a similar policy but for <strong>SELECT</strong> operations to allow reading from the table.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-emerald-800">
                <p className="font-medium flex items-center gap-1">
                  <KeyRound className="h-4 w-4" />
                  Testing the Fix:
                </p>
                <p className="mt-1">
                  After applying these policy changes, return to the app and try again. The app should now be able to write data to the table.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="code">
            <AccordionTrigger className="text-indigo-600 font-medium">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Complete SQL Fix Script
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="mb-2 text-sm">
                Execute this SQL in the Supabase SQL Editor to fix your RLS policies:
              </p>
              <div className="relative">
                <Code className="text-xs p-3 block bg-slate-900 text-slate-100 overflow-x-auto">
                  {fixRlsSql}
                </Code>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2 h-8 bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-600"
                  onClick={handleCopySQL}
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
              <p className="mt-3 text-sm text-slate-600">
                This script will create the necessary policies and permissions for both anonymous and authenticated users.
              </p>
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
