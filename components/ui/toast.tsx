// "use client";

// import React from "react";
// import toast from "react-hot-toast";

// // This is a compatibility layer for code that might be using the old toast component
// // It forwards calls to react-hot-toast

// export interface ToastProps {
//   message: string;
//   onClose?: () => void;
// }

// export function Toast({ message, onClose }: ToastProps) {
//   // This component is deprecated - use react-hot-toast directly
//   // This is just to prevent build errors
//   React.useEffect(() => {
//     const id = toast(message);
//     return () => {
//       toast.dismiss(id);
//       onClose?.();
//     };
//   }, [message, onClose]);

//   return null;
// }

// // No-op toast to prevent import errors
// export type ToastActionElement = React.ReactElement;

// export interface ToastProps {
//   title?: React.ReactNode;
//   description?: React.ReactNode;
//   action?: ToastActionElement;
//   variant?: "default" | "destructive";
// }

// export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
//   console.warn("ToastProvider is deprecated. Using react-hot-toast instead.");
//   return <>{children}</>;
// };

// export const ToastViewport = () => null;
// export const ToastTitle = () => null;
// export const ToastDescription = () => null;
// export const ToastClose = () => null;
// export const ToastAction = () => null;