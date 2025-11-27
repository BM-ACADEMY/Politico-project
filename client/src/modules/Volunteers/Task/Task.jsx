// src/components/Task.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "@/modules/Common/context/AuthContext";
import axiosInstance from "@/modules/Common/axios/axios";
import { showToast } from "@/modules/Common/toast/customToast";

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, User, Clock, Paperclip, X, FileText, Image, Video, Music, Link2 } from "lucide-react";

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "in process", label: "In Process", color: "bg-blue-100 text-blue-800" },
  { value: "on hold", label: "On Hold", color: "bg-orange-100 text-orange-800" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
];

const Task = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [status, setStatus] = useState("");
  const [volunteerDescription, setVolunteerDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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
        const errorMessage = err.response?.data?.message || "Failed to load your tasks.";
        showToast("error", errorMessage);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [user, authLoading]);

  const openDialog = (task) => {
    setSelectedTask(task);
    setStatus(task.status || "pending");
    setVolunteerDescription(task.volunteer_description || "");
    setAttachments(task.attachments || []);
    setOpen(true);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
      isNew: true
    }))]);
    e.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedTask) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("volunteer_description", volunteerDescription);

      // Append only new files
      attachments.forEach((att) => {
        if (att.isNew && att.file) {
          formData.append("attachments", att.file);
        }
      });

      const response = await axiosInstance.put(`/tasks/my-tasks/${selectedTask._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update the task in local state
      setTasks(prev => prev.map(t => t._id === selectedTask._id ? response.data.task : t));

      showToast("success", "Task updated successfully!");
      setOpen(false);
    } catch (err) {
      console.error(err);
      showToast("error", err.response?.data?.message || "Failed to update task");
    } finally {
      setUploading(false);
    }
  };

  // Loading & Empty States (unchanged)
  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h2 className="font-bold text-gray-900 mb-8">My Tasks</h2>
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

  return (
    <>
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
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-200 hover:border-indigo-300 cursor-pointer"
              onClick={() => openDialog(task)}
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

      {/* Task Detail Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedTask?.task_title}</DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-6 mt-4">
              {/* Status */}
              <div>
                <Label className="text-base font-semibold">Status</Label>
                <RadioGroup value={status} onValueChange={setStatus} className="mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    {statusOptions.map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt.value} id={opt.value} />
                        <Label htmlFor={opt.value} className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium ${opt.color}`}>
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Task Description (from admin) */}
              <div>
                <Label className="text-base font-semibold">Task Description</Label>
                <p className="mt-2 text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedTask.description || "No description provided."}
                </p>
              </div>

              {/* Event Details */}
              {selectedTask.event && (
                <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-200">
                  <h4 className="font-semibold text-indigo-900 mb-3">Event Details</h4>
                  <p className="font-medium">{selectedTask.event.eventTitle}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mt-2">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(selectedTask.event.date).toLocaleDateString("en-IN")}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedTask.event.time || "No time"}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedTask.event.venue || "No venue"}</span>
                    <span>Type: {selectedTask.event.eventType || "N/A"}</span>
                  </div>
                  {selectedTask.event.description && (
                    <p className="mt-3 text-sm text-gray-600">{selectedTask.event.description}</p>
                  )}
                </div>
              )}

              {/* Volunteer Description */}
              <div>
                <Label htmlFor="vol-desc" className="text-base font-semibold">Your Report / Notes</Label>
                <Textarea
                  id="vol-desc"
                  placeholder="Write about your progress, challenges, or completion details..."
                  value={volunteerDescription}
                  onChange={(e) => setVolunteerDescription(e.target.value)}
                  className="mt-2 min-h-32"
                />
              </div>

              {/* Attachments */}
              <div>
                <Label className="text-base font-semibold">Attachments</Label>
                <div className="mt-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-3"
                  >
                    <Paperclip className="w-4 h-4 mr-2" /> Add Files or Links
                  </Button>

                  <div className="space-y-2">
                    {attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                        {att.isNew ? (
                          <>
                            {att.type.startsWith("image/") && <Image className="w-5 h-5 text-blue-600" />}
                            {att.type.startsWith("video/") && <Video className="w-5 h-5 text-purple-600" />}
                            {att.type.startsWith("audio/") && <Music className="w-5 h-5 text-green-600" />}
                            {att.type.includes("pdf") && <FileText className="w-5 h-5 text-red-600" />}
                            {!att.type.startsWith("image/") && !att.type.startsWith("video/") && !att.type.startsWith("audio/") && !att.type.includes("pdf") && <FileText className="w-5 h-5" />}
                            <span className="flex-1 text-sm">{att.name}</span>
                          </>
                        ) : (
                          <>
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-blue-600 hover:underline">
                              {att.url.split("/").pop()}
                            </a>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => removeAttachment(i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {attachments.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No attachments yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={uploading}>
                  {uploading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Task;