
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Code } from "@/components/ui/code";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Code2, Database, Lock, KeyRound } from "lucide-react";

const RlsConfigGuide: React.FC = () => {
  return (
    <Card className="border-red-200 shadow-lg">
      <CardHeader className="bg-red-50 border-b border-red-100">
        <CardTitle className="text-red-700 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Supabase RLS Policy Configuration Required
        </CardTitle>
        <CardDescription className="text-red-600">
          Your app cannot write to the database due to missing Row Level Security (RLS) policies
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTitle className="text-red-700">Database Write Permission Error</AlertTitle>
          <AlertDescription className="text-red-600">
            Your app is connecting successfully to Supabase, but Row Level Security (RLS) is preventing data 
            from being written to the database.
          </AlertDescription>
        </Alert>

        <div className="text-sm space-y-2">
          <p className="font-medium">What's happening:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Supabase uses Row Level Security (RLS) to protect your data</li>
            <li>By default, all tables are locked down - no reading or writing allowed</li>
            <li>You need to create policies to allow specific operations</li>
            <li>Your app currently cannot write to the <code>user_uuids</code> table</li>
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
                <li>Go to <strong>Database</strong> → <strong>Tables</strong></li>
                <li>Find the <code>user_uuids</code> table</li>
                <li>Click on <strong>Authentication</strong> → <strong>Policies</strong></li>
                <li>Click <strong>New Policy</strong></li>
                <li>Select <strong>Insert</strong> as the policy type</li>
                <li>Name the policy "Allow Anonymous Inserts"</li>
                <li>Use this Policy Definition (SQL):
                  <div className="mt-2 mb-3">
                    <Code className="text-xs p-3 block bg-slate-900 text-slate-100">
                      {`-- Allow anonymous users to insert their own email/uuid pairs
true`}
                    </Code>
                  </div>
                </li>
                <li>Click <strong>Review</strong> then <strong>Save Policy</strong></li>
              </ol>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800">
                <p className="font-medium flex items-center gap-1">
                  <Database className="h-4 w-4" />
                  Additional Policies Needed:
                </p>
                <ul className="list-disc pl-5 mt-2">
                  <li>You may also need a <strong>Select</strong> policy to read from the table</li>
                  <li>Use <code>true</code> for the Policy Definition to allow anonymous reads</li>
                </ul>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-emerald-800">
                <p className="font-medium flex items-center gap-1">
                  <KeyRound className="h-4 w-4" />
                  For Production:
                </p>
                <p className="mt-1">
                  For a production app, you should use more restrictive policies. Consider using authenticated 
                  users only or adding conditions like <code>auth.uid() IS NOT NULL</code> to your policies.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="code">
            <AccordionTrigger className="text-indigo-600 font-medium">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Complete SQL Setup Script
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="mb-2 text-sm">
                Execute this SQL in the Supabase SQL Editor to properly set up your table and policies:
              </p>
              <Code className="text-xs p-3 block bg-slate-900 text-slate-100 overflow-x-auto">
{`-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_uuids (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  uuid TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.user_uuids ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow anonymous inserts
CREATE POLICY "Allow anonymous inserts" 
ON public.user_uuids 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Create a policy to allow anonymous selects
CREATE POLICY "Allow anonymous selects" 
ON public.user_uuids 
FOR SELECT 
TO anon
USING (true);

-- Grant usage on sequences
GRANT USAGE ON SEQUENCE user_uuids_id_seq TO anon;
GRANT USAGE ON SEQUENCE user_uuids_id_seq TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT ON public.user_uuids TO anon;
GRANT SELECT, INSERT ON public.user_uuids TO authenticated;`}
              </Code>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t flex justify-between items-center">
        <p className="text-xs text-slate-500">
          Once fixed, your app will automatically sync data with the cloud
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open('https://supabase.com/docs/guides/auth/row-level-security', '_blank')}
        >
          Supabase RLS Docs
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RlsConfigGuide;
