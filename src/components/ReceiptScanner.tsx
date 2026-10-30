import React, { useRef, useState, useEffect } from "react";
import { Camera, X, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface ScannedItem {
  description: string;
  amount: number;
  suggestedCategory: string;
  categoryId?: string;
  isEditing?: boolean;
}

interface ReceiptScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [merchant, setMerchant] = useState<string>("");
  
  const { addTransaction, getCategoriesByType, state } = useTransactions();
  const { currencySymbol } = useCurrency();
  
  const categories = getCategoriesByType("expense");

  // Effect to start video playback when stream is available
  useEffect(() => {
    if (stream && videoRef.current && showCamera) {
      console.log("Setting up video stream in useEffect");
      videoRef.current.srcObject = stream;
      videoRef.current.play()
        .then(() => console.log("Video playback started"))
        .catch(err => console.error("Error playing video:", err));
    }
  }, [stream, showCamera]);

  const startCamera = async () => {
    try {
      console.log("Requesting camera access...");
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Camera not supported on this device or browser");
        console.error("MediaDevices API not supported");
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      console.log("Camera access granted", mediaStream);
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      
      if (error.name === 'NotAllowedError') {
        toast.error("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (error.name === 'NotFoundError') {
        toast.error("No camera found on this device.");
      } else if (error.name === 'NotReadableError') {
        toast.error("Camera is already in use by another application.");
      } else if (error.name === 'SecurityError') {
        toast.error("Camera access requires HTTPS. Please use a secure connection.");
      } else {
        toast.error(`Could not access camera: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    stopCamera();

    canvas.toBlob(async (blob) => {
      if (blob) {
        await processImage(blob);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processImage(file);
    }
  };

  const processImage = async (imageFile: Blob) => {
    setIsProcessing(true);
    console.log("Processing image, size:", imageFile.size);
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      
      reader.onload = async () => {
        const base64 = reader.result?.toString().split(',')[1];
        if (!base64) throw new Error("Failed to convert image");

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-receipt`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ imageBase64: base64 }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to scan receipt");
        }

        const data = await response.json();
        
        // Map suggested categories to actual category IDs
        const itemsWithCategories = data.items.map((item: ScannedItem) => {
          const category = categories.find(c => 
            c.name.toLowerCase().includes(item.suggestedCategory.toLowerCase()) ||
            item.suggestedCategory.toLowerCase().includes(c.name.toLowerCase())
          );
          return {
            ...item,
            categoryId: category?.id || categories[0]?.id || "",
            isEditing: false
          };
        });

        setScannedItems(itemsWithCategories);
        setReceiptDate(data.date || new Date().toISOString().split('T')[0]);
        setMerchant(data.merchant || "");
        toast.success("Receipt scanned successfully!");
      };
    } catch (error) {
      console.error("Error processing receipt:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process receipt");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleEdit = (index: number) => {
    setScannedItems(items => items.map((item, i) => 
      i === index ? { ...item, isEditing: !item.isEditing } : item
    ));
  };

  const updateItem = (index: number, field: keyof ScannedItem, value: string | number) => {
    setScannedItems(items => items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const saveExpenses = () => {
    let successCount = 0;
    scannedItems.forEach(item => {
      const success = addTransaction({
        amount: item.amount,
        type: "expense",
        categoryId: item.categoryId || categories[0]?.id || "",
        description: item.description,
        date: receiptDate
      });
      if (success) successCount++;
    });

    if (successCount > 0) {
      toast.success(`Saved ${successCount} expense(s) from receipt`);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setScannedItems([]);
    setMerchant("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scan Receipt</DialogTitle>
        </DialogHeader>

        {!showCamera && scannedItems.length === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose how to scan your receipt:
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  console.log("Take Photo button clicked");
                  startCamera();
                }} 
                className="flex-1 gap-2"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </Button>
              <Button 
                onClick={() => {
                  console.log("Upload button clicked");
                  fileInputRef.current?.click();
                }} 
                variant="outline"
                className="flex-1"
              >
                Upload Image
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {showCamera && (
          <div className="space-y-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3">
              <Button onClick={capturePhoto} className="flex-1">
                Capture
              </Button>
              <Button onClick={stopCamera} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Processing receipt...</p>
          </div>
        )}

        {scannedItems.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Merchant</Label>
              <Input 
                value={merchant} 
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Store name"
              />
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date"
                value={receiptDate} 
                onChange={(e) => setReceiptDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Items</Label>
              {scannedItems.map((item, index) => (
                <Card key={index} className="p-4">
                  {item.isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Description"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value))}
                        placeholder="Amount"
                      />
                      <Select
                        value={item.categoryId}
                        onValueChange={(value) => updateItem(index, 'categoryId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => toggleEdit(index)} size="sm" className="w-full">
                        <Check className="w-4 h-4 mr-2" />
                        Done
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ 
                              backgroundColor: categories.find(c => c.id === item.categoryId)?.color 
                            }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {categories.find(c => c.id === item.categoryId)?.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">
                          {currencySymbol}{item.amount.toFixed(2)}
                        </span>
                        <Button
                          onClick={() => toggleEdit(index)}
                          size="sm"
                          variant="ghost"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={saveExpenses} className="flex-1">
                Save All Expenses
              </Button>
              <Button onClick={handleClose} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
