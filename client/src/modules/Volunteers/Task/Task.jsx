// src/components/Task.jsx → FINAL CLEAN VERSION
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/modules/Common/context/AuthContext";
import axiosInstance from "@/modules/Common/axios/axios";
import { showToast } from "@/modules/Common/toast/customToast";

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

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-lg text-gray-600 animate-pulse">Loading your tasks...</div>
      </div>
    );
  }

  // No tasks state
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div class="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
          No tasks assigned
        </div>
        <p className="text-gray-500 text-lg max-w-md mx-auto">
          You have no pending tasks at the moment. Check back later or contact your coordinator!
        </p>
      </div>
    );
  }

  // Tasks grid
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center md:text-left">
        My Tasks ({tasks.length})
      </h2>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full"
          >
            <div className="p-6 grow">
              <h3 className="text-xl font-bold text-indigo-700 mb-3 line-clamp-2">
                {task.task_title}
              </h3>

              <p className="text-gray-600 text-sm leading-relaxed mb-5 line-clamp-3">
                {task.description || "No description provided."}
              </p>

              {task.event && (
                <div className="bg-linear-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-5 border border-indigo-100">
                  <p className="font-semibold text-indigo-800 text-sm">
                    {task.event.eventTitle || "Untitled Event"}
                  </p>
                  <p className="text-gray-700 text-xs mt-1">
                    {task.event.date
                      ? new Date(task.event.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "No date"}{" "}
                    • {task.event.time || "Time TBD"}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Venue: {task.event.venue || "Not specified"}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-auto">
                Assigned by:{" "}
                <span className="font-medium text-gray-700">
                  {task.created_by?.name || "Admin"}
                </span>
              </div>
            </div>

            <div className="px-6 pb-5">
              <div className="flex justify-between items-center">
                <span
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
                    task.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                      : "bg-green-100 text-green-800 border border-green-300"
                  }`}
                >
                  {task.status || "Pending"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Task;