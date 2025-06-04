import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExitConfirmationProps } from "./types";

export function ExitConfirmation({ open, onOpenChange, onContinue, onExit }: ExitConfirmationProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[450px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-[#141E33]">
            Wait! Personalization helps you win more deals
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="font-medium text-gray-700">
                Prospect. Pitch. Win. Instantly.
              </div>
              <div>
                By completing this quick profile, we can tailor our AI-powered proposals 
                specifically to your industry and role, helping you close deals faster.
              </div>
              <div>
                It only takes a minute and will significantly improve your results.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={onContinue}
            className="mt-2 sm:mt-0"
          >
            Continue Setup
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onExit}
            className="bg-gray-500 hover:bg-gray-600"
          >
            Skip for Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}