import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusColor(status: string): string {
  switch (status) {
      case "prospect":
          return "bg-blue-100 text-blue-800 hover:bg-blue-100/90";
      case "lead":
          return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/90";
      case "client":
          return "bg-green-100 text-green-800 hover:bg-green-100/90";
      default:
          return "bg-gray-100 text-gray-800 hover:bg-gray-100/90";
  }
};

export function formatDateOnly(timestamp: any): string {
  if (!timestamp) return "N/A";

  let date: Date;
  
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } 
  else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } 
  else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(timestamp: any): string {
  if (!timestamp) return "N/A";

  let date: Date;
  
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateForInput(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function getRelativeTime(timestamp: any): string {
  if (!timestamp) return "Unknown";

  let date: Date;
  
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) {
    return "Unknown";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDateOnly(timestamp);
}
