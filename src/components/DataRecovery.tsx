
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { Copy, Mail, RefreshCw, Loader2 } from 'lucide-react';
import { generateRecoveryLink } from '@/utils/userDataRecovery';

const DataRecovery: React.FC = () => {
  const [recoveryLink, setRecoveryLink] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  
  const handleGenerateLink = () => {
    setLoading(true);
    try {
      const link = generateRecoveryLink();
      if (link) {
        setRecoveryLink(link);
        toast.success('Recovery link generated successfully');
      } else {
        toast.error('Failed to generate recovery link');
      }
    } catch (error) {
      toast.error('An error occurred while generating the recovery link');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(recoveryLink);
    toast.success('Recovery link copied to clipboard');
  };
  
  const handleSendEmail = () => {
    // Since we don't have a backend email service connected yet, we'll open the user's email client
    // with a pre-populated message containing the recovery link
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    
    const subject = encodeURIComponent('Recover Your Data');
    const body = encodeURIComponent(
      `Click the link below to recover your data:\n\n${recoveryLink}\n\nThis link is valid for 24 hours.`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    toast.success('Email client opened with recovery link');
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Recovery</CardTitle>
        <CardDescription>
          Generate a recovery link to access your data from another device or browser.
          Recovery links are valid for 24 hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={handleGenerateLink} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate Recovery Link
              </>
            )}
          </Button>
          
          {recoveryLink && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="recovery-link">Your Recovery Link</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="recovery-link" 
                    value={recoveryLink} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopyLink} title="Copy to clipboard">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  This link will expire in 24 hours. Save it somewhere safe.
                </p>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="email">Send to Email (Optional)</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleSendEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataRecovery;
