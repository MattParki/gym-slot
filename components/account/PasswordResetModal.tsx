import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, Mail, User, Shield } from "lucide-react";
import { sendPasswordResetEmail } from "@/services/businessService";
import toast from 'react-hot-toast';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName?: string;
  userRole?: string;
  userType?: 'staff' | 'customer';
}

export default function PasswordResetModal({ 
  isOpen, 
  onClose, 
  userEmail, 
  userName, 
  userRole, 
  userType = 'customer' 
}: PasswordResetModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      const result = await sendPasswordResetEmail(userEmail);
      
      if (result.devMode && result.resetLink) {
        // Development mode - show the reset link
        toast.success(
          <div>
            <p>Development Mode: Password reset link generated!</p>
            <p className="text-xs mt-2">
              <a 
                href={result.resetLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                Click here to reset password
              </a>
            </p>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.success(`Password reset email sent to ${userEmail}`);
      }
      
      onClose();
    } catch (error) {
      console.error("Error sending password reset:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to send password reset email";
      
      // Check if it's a user-not-found error
      if (errorMessage.includes("complete account setup") || errorMessage.includes("User not found")) {
        toast.error(
          `This ${userType} hasn't completed their account setup yet. ` +
          "Consider re-sending their invitation email instead.",
          { duration: 6000 }
        );
      } else if (errorMessage.includes("email")) {
        toast.error(
          "Email service is not configured. Please contact your system administrator.",
          { duration: 6000 }
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-orange-600" />
            Confirm Password Reset
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Are you sure you want to send a password reset email to this {userType}?
            </AlertDescription>
          </Alert>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{userEmail}</span>
            </div>
            
            {userName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Name:</span>
                <span className="text-sm">{userName}</span>
              </div>
            )}
            
            {userRole && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Role:</span>
                <span className="text-sm capitalize">{userRole.replace('_', ' ')}</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600">
            They will receive an email with instructions to reset their password. 
            This action cannot be undone.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Reset Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 