"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, MessageCircle, Calendar } from "lucide-react";
import { markEmailAsResponded } from "@/services/emailService"; // Changed import
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from 'react-hot-toast';

interface MarkAsRespondedButtonProps {
  emailId: string; // Already updated ✅
  isResponded: boolean;
  respondedAt?: any;
  onUpdate: (responded: boolean, respondedAt?: any) => void;
  variant?: "button" | "checkbox";
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  showDatePicker?: boolean;
}

export default function MarkAsRespondedButton({
  emailId, // Already updated ✅
  isResponded,
  respondedAt,
  onUpdate,
  variant = "button",
  size = "sm",
  showDatePicker = false
}: MarkAsRespondedButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today's date
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  });

  const formatResponseDate = (timestamp: any) => {
    if (!timestamp) return null;
    
    // Handle Firebase Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString();
    }
    
    // Handle regular Date or timestamp
    return new Date(timestamp).toLocaleDateString();
  };

  const handleMarkAsResponded = async (customDate?: string) => {
    if (isResponded) return; // Don't allow unmarking for now
    
    setIsLoading(true);
    
    try {
      // If showDatePicker is true and we have a custom date, use it
      let responseDate = new Date();
      if (showDatePicker && customDate) {
        responseDate = new Date(customDate);
      }

      await markEmailAsResponded(emailId, responseDate);
      
      // Pass both the responded status and the timestamp to parent
      onUpdate(true, responseDate);
      
      toast.success("Thanks! We've marked this client as responded. This helps us guide your next steps and keep your outreach on track.");

      setShowDialog(false);
    } catch (error) {
      console.error("Error marking email as responded:", error);
      toast.error("Failed to update email status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (showDatePicker) {
      setShowDialog(true);
    } else {
      handleMarkAsResponded();
    }
  };

  if (variant === "checkbox") {
    return (
      <>
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`responded-${emailId}`} // Changed from emailId to emailId
              checked={isResponded}
              onCheckedChange={handleButtonClick}
              disabled={isLoading || isResponded}
              className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            />
            <label 
              htmlFor={`responded-${emailId}`} // Changed from emailId to emailId
              className={`text-sm cursor-pointer ${isResponded ? 'text-green-600 font-medium' : 'text-gray-600'}`}
            >
              {isResponded ? "Client responded" : "Mark as responded"}
            </label>
          </div>
          {isResponded && respondedAt && (
            <p className="text-xs text-gray-500 ml-6">
              Responded on {formatResponseDate(respondedAt)}
            </p>
          )}
        </div>

        {/* Date picker dialog */}
        {showDatePicker && (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>When did the client respond?</DialogTitle>
                <DialogDescription>
                  Please select the date when the client responded to your email.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="response-date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="response-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="col-span-3"
                    max={new Date().toISOString().split('T')[0]} // Can't select future dates
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleMarkAsResponded(selectedDate)}
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Mark as Responded"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center space-y-2">
        <Button
          variant={isResponded ? "outline" : "secondary"}
          size={size}
          onClick={handleButtonClick}
          disabled={isLoading || isResponded}
          className={`${isResponded ? 'border-green-500 text-green-600' : ''}`}
        >
          {isLoading ? (
            "Updating..."
          ) : isResponded ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Responded
            </>
          ) : (
            <>
              {showDatePicker ? (
                <Calendar className="h-4 w-4 mr-2" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2" />
              )}
              Mark as Responded
            </>
          )}
        </Button>
        {isResponded && respondedAt && (
          <p className="text-xs text-gray-500 text-center">
            Responded on {formatResponseDate(respondedAt)}
          </p>
        )}
      </div>

      {/* Date picker dialog for button variant */}
      {showDatePicker && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>When did the client respond?</DialogTitle>
              <DialogDescription>
                Please select the date when the client responded to your email.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="response-date" className="text-right">
                  Date
                </Label>
                <Input
                  id="response-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="col-span-3"
                  max={new Date().toISOString().split('T')[0]} // Can't select future dates
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleMarkAsResponded(selectedDate)}
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Mark as Responded"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}