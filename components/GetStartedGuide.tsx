"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, CheckCircle, Circle, Play, PlusCircle, Users, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

// Define the task types
interface Task {
  id: string;
  title: string;
  description: string;
  videoId?: string;
  completed: boolean;
  actionLabel: string;
  actionLink: string;
  icon: string;
}

export default function GetStartedGuide() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [isResetting, setIsResetting] = useState(false); // New state for reset loading


  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "CheckCircle": return <CheckCircle className="h-6 w-6 text-indigo-500" />;
      case "PlusCircle": return <PlusCircle className="h-6 w-6 text-blue-500" />;
      case "Users": return <Users className="h-6 w-6 text-green-500" />;
      case "FileText": return <FileText className="h-6 w-6 text-purple-500" />;
      default: return <Circle className="h-6 w-6 text-gray-500" />;
    }
  };
  
  // Calculate total progress and check for completion
  useEffect(() => {
    if (tasks.length > 0) {
      const completedCount = tasks.filter(task => task.completed).length;
      const percentage = Math.round((completedCount / tasks.length) * 100);
      setProgress(percentage);
      
      // Auto-collapse guide when all tasks are completed
      const allCompleted = tasks.every(task => task.completed);
      if (allCompleted) {
        setCollapsed(true);
      }
    }
  }, [tasks]);
  
  // Load user's task progress from API
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const token = await user.getIdToken();
        
        const response = await fetch('/api/user-tasks', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        
        const data = await response.json();
        setTasks(data.tasks || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [user]);
  
  // Update task completion status (unchanged)
  const updateTaskCompletion = async (taskId: string, completed: boolean) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/user-tasks', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId, completed })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      
      const data = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };
  
  // Toggle task expansion (unchanged)
  const toggleTask = (taskId: string) => {
    if (openTaskId === taskId) {
      setOpenTaskId(null);
    } else {
      setOpenTaskId(taskId);
    }
  };
  
  const resetAllTasks = async () => {
    if (!user || isResetting) return;
    
    try {
      setIsResetting(true);
      
      const token = await user.getIdToken();
      
      // Reset each task one by one
      for (const task of tasks) {
        await fetch('/api/user-tasks', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ taskId: task.id, completed: false })
        });
      }
      
      // Refresh the task list
      const response = await fetch('/api/user-tasks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
      
      setCollapsed(false);
    } catch (error) {
      console.error("Error resetting tasks:", error);
    } finally {
      setIsResetting(false);
    }
  };
  
  // Check if all tasks are completed
  const allTasksCompleted = tasks.length > 0 && tasks.every(task => task.completed);
  
  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-100 rounded-lg"></div>;
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">
              {allTasksCompleted ? "You're all set! 🚀" : "Get started with ProspectsEasy"}
            </h2>
            <p className="text-gray-500 mt-1">
              {allTasksCompleted 
                ? "You're now equipped with all the tools for success!" 
                : "Complete these steps to get the most out of your experience"}
            </p>
          </div>

          <div className="flex items-center mt-4 md:mt-0">
            <span className="text-sm font-medium mr-2">{progress}%</span>
            <Progress value={progress} className="w-24 h-2" />
            
            {/* Show collapse button regardless of completion status */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mb-4 flex items-center">
          <span>{tasks.length} steps</span>
          <span className="mx-2">•</span>
          <span>About 5 min</span>
        </div>
        
        {allTasksCompleted && !collapsed && (
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetAllTasks}
              disabled={isResetting}
              className="flex items-center text-gray-600"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isResetting ? 'animate-spin' : ''}`} />
              {isResetting ? "Resetting..." : "Reset Guide"}
            </Button>
          </div>
        )}
        
        {/* Only show tasks if not collapsed */}
        {!collapsed && (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`border rounded-lg overflow-hidden transition-all ${
                  task.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div 
                  className="flex flex-wrap items-center justify-between p-4 cursor-pointer"
                  onClick={() => toggleTask(task.id)}
                >
                  <div className="flex items-center gap-3 mb-2 md:mb-0 w-full md:w-auto">
                    <div className="flex-shrink-0">
                      {task.completed ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        getIconComponent(task.icon)
                      )}
                    </div>
                    <div>
                      <h3 className={`font-medium ${task.completed ? 'text-green-700' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
                    <div>
                      {task.completed ? (
                        <span className="text-sm text-green-600 mr-2">Completed</span>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                          className="mr-2"
                        >
                          <Link
                            href={task.actionLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {task.actionLabel}
                          </Link>
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center">
                      {openTaskId === task.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {openTaskId === task.id && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-gray-600 mb-4 ml-9">{task.description}</p>
                    
                    {task.videoId && (
                      <div className="flex flex-wrap items-center ml-9">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex items-center text-indigo-600 mb-2 md:mb-0"
                          onClick={(e) => {
                            e.stopPropagation();

                            const realVideoIds: Record<string, string> = {
                              'generate-leads': 'Pe1Xf_9Ikms',
                              'create-client': 'Pe1Xf_9Ikms',
                              'create-proposal': 'Pe1Xf_9Ikms',
                            };
                            
                            // Get the real video ID based on the task ID
                            const realVideoId = realVideoIds[task.id] || "Pe1Xf_9Ikms";
                            
                            // console.log(`Using real video ID ${realVideoId} for task ${task.id} instead of placeholder`);
                            
                            // Open YouTube with the real video ID
                            window.open(`https://www.youtube.com/watch?v=${realVideoId}`, "_blank", "noopener,noreferrer");
                          }}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Watch Tutorial
                        </Button>
                        
                        {!task.completed && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-gray-500 md:ml-auto w-full md:w-auto justify-start"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTaskCompletion(task.id, true);
                            }}
                          >
                            Mark as completed
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}