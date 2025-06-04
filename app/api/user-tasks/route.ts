// app/api/user-tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

// Get user tasks
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // FIRST - check onboarding status from user profile
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const isOnboardingCompleted = userDoc.exists && userDoc.data()?.onboardingCompleted === true;
    
    // Get user tasks from Firestore
    const userTasksRef = adminDb.collection("userTasks").doc(userId);
    const doc = await userTasksRef.get();

    if (doc.exists) {
      const data = doc.data();
      
      if (data && data.tasks) {
        const tasks = data.tasks;
        
        // Find onboarding task
        const onboardingTaskIndex = tasks.findIndex((task: any) => task.id === "onboarding");
        if (onboardingTaskIndex !== -1) {
          // If onboarding status changed, update it
          if (tasks[onboardingTaskIndex].completed !== isOnboardingCompleted) {
            tasks[onboardingTaskIndex].completed = isOnboardingCompleted;
            
            // Save the updated tasks
            await userTasksRef.update({ tasks });
          }
        }
        
        return NextResponse.json(data);
      } else {
        // Handle the case where data or data.tasks is undefined
        console.error("Document exists but data or tasks are undefined");
        return NextResponse.json({ error: "Invalid task data" }, { status: 500 });
      }
    } else {
      // Create default tasks
      const defaultTasks = [
        {
          id: "onboarding",
          title: "Complete your profile setup",
          description: "Tell us more about your business to help us personalize your experience.",
          completed: isOnboardingCompleted,
          actionLabel: "Update Profile",
          actionLink: "/account-settings",
          icon: "CheckCircle"
        },
        {
          id: "generate-leads",
          title: "Generate leads with AI",
          description: "Use our AI-powered tool to find potential clients in your industry.",
          videoId: "Pe1Xf_9Ikms",
          completed: false,
          actionLabel: "Generate Leads",
          actionLink: "/clients",
          icon: "PlusCircle"
        },
        {
          id: "create-client",
          title: "Add your first client",
          description: "Create a client profile to organize your business relationships.",
          videoId: "Pe1Xf_9Ikms",
          completed: false,
          actionLabel: "Add Client",
          actionLink: "/clients/new",
          icon: "Users"
        },
        {
          id: "create-proposal",
          title: "Generate your first proposal",
          description: "Create a professional proposal with our AI-powered templates.",
          videoId: "Pe1Xf_9Ikms",
          completed: false,
          actionLabel: "Create Proposal",
          actionLink: "/create-proposal",
          icon: "FileText"
        }
      ];

      // Save default tasks
      await userTasksRef.set({ tasks: defaultTasks });
      return NextResponse.json({ tasks: defaultTasks });
    }
  } catch (error) {
    console.error("Error getting user tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update task status
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { taskId, completed } = await request.json();

    // Update the task
    const userTasksRef = adminDb.collection("userTasks").doc(userId);
    const doc = await userTasksRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Tasks not found" }, { status: 404 });
    }

    const data = doc.data();
    if (!data) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }
    const tasks = data.tasks;
    const updatedTasks = tasks.map((task: any) => 
      task.id === taskId ? { ...task, completed } : task
    );

    await userTasksRef.update({ tasks: updatedTasks });
    return NextResponse.json({ success: true, tasks: updatedTasks });

  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}