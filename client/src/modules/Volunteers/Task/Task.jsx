// src/components/Task.jsx
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/modules/Common/context/AuthContext";
import axiosInstance from "@/modules/Common/axios/axios";
import { showToast } from "@/modules/Common/toast/customToast";

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, User, Clock } from "lucide-react";

const Task = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTasks = async () => {
      if (authLoading) return;

      if (!user) {
        setTasks([]);
        setLoading(false);
        showToast("error", "You must be logged in to view tasks.");
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get("/tasks/my-tasks");
        const myTasks = Array.isArray(response.data) ? response.data : [];
        setTasks(myTasks);

        if (myTasks.length === 0) {
          showToast("info", "No tasks assigned yet. Check back soon!");
        }
      } catch (err) {
        console.error("Error fetching my tasks:", err);
        const errorMessage =
          err.response?.data?.message || "Failed to load your tasks.";
        showToast("error", errorMessage);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [user, authLoading]);

  // Full page loading
  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h2 className=" font-bold text-gray-900 mb-8">My Tasks</h2>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-3/4 rounded" />
                <Skeleton className="h-4 w-full mt-3" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full rounded-lg mt-4" />
                <div className="flex justify-between items-center mt-6">
                  <Skeleton className="h-8 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="bg-gray-100 rounded-full p-8 mb-6">
          <Calendar className="w-16 h-16 text-gray-400" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
          No Tasks Assigned Yet
        </h3>
        <p className="text-gray-500 text-lg max-w-md">
          You're all caught up! Check back later or reach out to your coordinator for new assignments.
        </p>
      </div>
    );
  }

  // Main tasks grid
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">My Tasks</h2>
        <p className="text-muted-foreground mt-2">
          You have <span className="font-semibold text-indigo-600">{tasks.length}</span> active{" "}
          {tasks.length === 1 ? "task" : "tasks"}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tasks.map((task) => (
          <Card
            key={task._id}
            className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-200 hover:border-indigo-300"
          >
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {task.task_title}
                </CardTitle>
                <Badge
                  variant={task.status === "pending" ? "secondary" : "default"}
                  className={
                    task.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      : "bg-green-100 text-green-800 hover:bg-green-200"
                  }
                >
                  {task.status || "Pending"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {task.description && (
                <p className="text-sm text-gray-600 line-clamp-3">
                  {task.description}
                </p>
              )}

              {task.event && (
                <div className="bg-linear-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                  <p className="font-medium text-indigo-900 text-sm">
                    {task.event.eventTitle || "Untitled Event"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {task.event.date
                        ? new Date(task.event.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "No date"}
                    </span>
                    {task.event.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {task.event.time}
                      </span>
                    )}
                  </div>
                  {task.event.venue && (
                    <p className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                      <MapPin className="w-3.5 h-3.5" />
                      {task.event.venue}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Assigned by:{" "}
                  <span className="font-medium text-gray-700">
                    {task.created_by?.name || "Admin"}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Task;