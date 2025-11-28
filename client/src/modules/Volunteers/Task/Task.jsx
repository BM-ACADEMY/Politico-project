// src/components/Task.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "@/modules/Common/context/AuthContext";
import axiosInstance from "@/modules/Common/axios/axios";
import { showToast } from "@/modules/Common/toast/customToast";

import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Calendar,
  MapPin,
  Clock,
  User,
  Paperclip,
  FileText,
  Image as Img,
  Video,
  Music,
  X,
  Plus,
  Pencil,
  Search,
  CheckCircle2,
  PauseCircle,
  ArrowRightCircle,
  Timer,
  Trash2,
  Link2,
  ExternalLink,
} from "lucide-react";

// STATUS CONFIG
const statusConfig = {
  pending: { label: "Pending", icon: Timer, color: "bg-amber-100 text-amber-800 border-amber-300" },
  "in process": { label: "In Progress", icon: ArrowRightCircle, color: "bg-blue-100 text-blue-800 border-blue-300" },
  "on hold": { label: "On Hold", icon: PauseCircle, color: "bg-orange-100 text-orange-800 border-orange-300" },
  completed: { label: "Completed", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
};

// FILE ICON UTILITY
const getFileIcon = (url) => {
  const ext = (url || "").split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return <Img className="w-6 h-6 text-blue-600" />;
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return <Video className="w-6 h-6 text-purple-600" />;
  if (["mp3", "wav", "ogg"].includes(ext)) return <Music className="w-6 h-6 text-green-600" />;
  if (ext === "pdf") return <FileText className="w-6 h-6 text-red-600" />;
  return <Link2 className="w-6 h-6 text-indigo-600" />;
};

// TASK CARD
const TaskCard = ({ task, onClick }) => {
  const status = statusConfig[task.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <Card
      onClick={onClick}
      className="group rounded-xl border border-gray-200 bg-white hover:shadow-xl transition cursor-pointer 
                 p-4 flex flex-col justify-between w-[310px] h-[260px] overflow-hidden"
    >
      <div className="space-y-2 overflow-y-auto pr-1 scrollbar-thin">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{task.task_title}</h3>
        <p className="text-xs text-gray-600 line-clamp-3">{task.description || "No description"}</p>

        {task.event && (
          <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100 space-y-1 text-xs">
            <p className="font-semibold text-indigo-900 text-[11px]">{task.event.eventTitle}</p>
            <p className="flex items-center gap-1 text-indigo-700 text-[11px]">
              <Calendar className="w-3 h-3" />
              {new Date(task.event.date).toLocaleDateString("en-IN")}
            </p>
            {task.event.time && (
              <p className="flex items-center gap-1 text-indigo-700 text-[11px]">
                <Clock className="w-3 h-3" />
                {task.event.time}
              </p>
            )}
            {task.event.venue && (
              <p className="flex items-center gap-1 text-indigo-700 text-[11px]">
                <MapPin className="w-3 h-3" /> {task.event.venue}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="flex items-center gap-1 text-[11px] text-gray-500">
          <User className="w-3 h-3" /> {task.created_by?.name || "Admin"}
        </span>
        <Badge className={`flex items-center gap-1 px-2 py-0.5 text-[10px] border ${status.color}`}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </Badge>
      </div>
    </Card>
  );
};

const Task = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [status, setStatus] = useState("");
  const [volunteerDescription, setVolunteerDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [linkInput, setLinkInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      if (authLoading || !user) return setLoading(false);
      try {
        setLoading(true);
        const res = await axiosInstance.get("/tasks/my-tasks");
        setTasks(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        showToast("error", "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user, authLoading]);

  const openViewDialog = (task) => {
    setSelectedTask(task);
    setViewOpen(true);
  };

  const openEditDialog = () => {
    if (!selectedTask) return;
    setStatus(selectedTask.status || "pending");
    setVolunteerDescription(selectedTask.volunteer_description || "");
    setAttachments(
      (selectedTask.attachments || []).map((a) => ({ ...a, isExisting: true }))
    );
    setViewOpen(false);
    setEditOpen(true);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const mapped = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      isNew: true,
    }));
    setAttachments((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const addLink = () => {
    if (!linkInput.trim()) return;
    setAttachments((prev) => [
      ...prev,
      { url: linkInput.trim(), name: linkInput.trim(), isLink: true, isNew: true },
    ]);
    setLinkInput("");
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteAttachmentFromServer = async (attachmentUrl) => {
    try {
      await axiosInstance.delete(`/tasks/my-tasks/attachment/${selectedTask._id}`, {
        data: { attachmentUrl },
      });
    } catch (err) {
      showToast("error", "Failed to delete attachment");
    }
  };

  const handleSubmit = async () => {
    if (!selectedTask) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("volunteer_description", volunteerDescription);

      const newFiles = attachments.filter((a) => a.isNew && a.file);
      const newLinks = attachments.filter((a) => a.isNew && a.isLink);
      const existing = attachments.filter((a) => a.isExisting);

      newFiles.forEach((a) => formData.append("attachments", a.file));
      newLinks.forEach((a) => formData.append("attachmentLinks", a.url));
      existing.forEach((a) => formData.append("existingAttachments", a.url));

      const res = await axiosInstance.put(
        `/tasks/my-tasks/${selectedTask._id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setTasks((prev) =>
        prev.map((t) => (t._id === selectedTask._id ? res.data.task : t))
      );
      showToast("success", "Task updated successfully!");
      setEditOpen(false);
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to update task");
    } finally {
      setUploading(false);
    }
  };

  const visibleTasks = tasks
    .filter((t) => (filter ? t.status === filter : true))
    .filter((t) =>
      search
        ? `${t.task_title} ${t.description}`.toLowerCase().includes(search.toLowerCase())
        : true
    );

  if (authLoading || loading)
    return (
      <div className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-40 w-full rounded-xl" />
          </Card>
        ))}
      </div>
    );

  return (
    <main className="p-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-600 text-sm">{tasks.length} tasks assigned</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border-gray-300 p-2 text-sm"
            >
              <option value="">All</option>
              {Object.entries(statusConfig).map(([key, v]) => (
                <option key={key} value={key}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* GRID */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visibleTasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={() => openViewDialog(task)} />
          ))}
        </div>
      </div>

      {/* VIEW DIALOG */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-xl p-4 rounded-lg">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-bold leading-tight">
              {selectedTask?.task_title}
            </DialogTitle>
            <p className="text-[11px] text-gray-600">
              Assigned by {selectedTask?.created_by?.name}
            </p>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            <div className="flex justify-between items-center mb-1">
              <Button size="icon" variant="outline" onClick={openEditDialog} className="rounded-full h-7 w-7">
                <Pencil className="w-3 h-3" />
              </Button>
              <Badge className={`px-2 py-0.5 text-[10px] border ${statusConfig[selectedTask?.status]?.color}`}>
                {statusConfig[selectedTask?.status]?.label}
              </Badge>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-1">Description</h3>
              <p className="bg-gray-50 p-3 text-[12px] rounded-lg border whitespace-pre-wrap">
                {selectedTask?.description}
              </p>
            </div>

            {selectedTask?.event && (
              <div className="bg-indigo-50 p-3 rounded-lg border text-[12px] space-y-1">
                <h3 className="font-semibold text-indigo-900 text-sm">Event Details</h3>
                <p className="flex items-center gap-1 text-indigo-700">
                  <Calendar className="w-3 h-3" />
                  {new Date(selectedTask.event.date).toLocaleDateString("en-IN")}
                </p>
                {selectedTask.event.time && (
                  <p className="flex items-center gap-1 text-indigo-700">
                    <Clock className="w-3 h-3" /> {selectedTask.event.time}
                  </p>
                )}
                {selectedTask.event.venue && (
                  <p className="flex items-center gap-1 text-indigo-700">
                    <MapPin className="w-3 h-3" /> {selectedTask.event.venue}
                  </p>
                )}
              </div>
            )}

            {selectedTask?.volunteer_description && (
              <div>
                <h3 className="font-semibold text-sm mb-1">Your Report</h3>
                <p className="bg-blue-50 p-3 text-[12px] rounded-lg border whitespace-pre-wrap">
                  {selectedTask.volunteer_description}
                </p>
              </div>
            )}

            {/* BEAUTIFUL ATTACHMENTS DISPLAY */}
            {selectedTask?.attachments?.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">
                  Attachments ({selectedTask.attachments.length})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTask.attachments.map((att, i) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.url);
                    const isVideo = /\.(mp4|webm|mov|avi)$/i.test(att.url);
                    const filename = att.url.split("/").pop().split("?")[0];

                    return (
                      <div
                        key={i}
                        className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
                      >
                        {isImage ? (
                          <Zoom>
                            <img
                              src={att.url}
                              alt="attachment"
                              className="w-full h-32 object-cover"
                            />
                          </Zoom>
                        ) : isVideo ? (
                          <video controls className="w-full h-32 object-cover bg-black">
                            <source src={att.url} />
                            Your browser does not support video.
                          </video>
                        ) : (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center h-32 p-4 text-center hover:bg-gray-50 transition"
                          >
                            {getFileIcon(att.url)}
                            <p className="text-xs font-medium text-blue-600 underline mt-2 line-clamp-2">
                              {filename.length > 25 ? filename.slice(0, 25) + "..." : filename}
                            </p>
                            <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                              <ExternalLink className="w-3 h-3" /> Open Link
                            </p>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl p-4 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Update Task</DialogTitle>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto space-y-5 pr-1 scrollbar-thin">
            {/* STATUS */}
            <div>
              <h3 className="font-semibold text-sm mb-1">Status</h3>
              <RadioGroup value={status} onValueChange={setStatus} className="grid grid-cols-2 gap-2">
                {Object.entries(statusConfig).map(([v, cfg]) => (
                  <label
                    key={v}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-[12px] ${
                      status === v ? cfg.color : "bg-white"
                    }`}
                  >
                    <RadioGroupItem value={v} />
                    <cfg.icon className="w-3 h-3" />
                    {cfg.label}
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* REPORT */}
            <div>
              <Label className="text-sm">Your Report / Notes</Label>
              <Textarea
                value={volunteerDescription}
                onChange={(e) => setVolunteerDescription(e.target.value)}
                className="mt-1 text-sm"
                rows={4}
                placeholder="Write your completion report, observations, challenges faced..."
              />
            </div>

            {/* ATTACHMENTS */}
            <div>
              <Label className="text-sm">Attachments</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-lg h-8 text-xs">
                  <Paperclip className="w-3 h-3 mr-1" /> Upload Files
                </Button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />

                <Input
                  placeholder="https://drive.google.com/... or any link"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLink()}
                  className="h-8 text-xs"
                />
                <Button size="icon" onClick={addLink} className="rounded-lg h-8 w-8">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                {attachments.map((att, i) => (
                  <div key={i} className="relative border p-2 rounded-lg bg-white group">
                    {att.url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                      <Zoom>
                        <img src={att.url} className="rounded-md h-20 w-full object-cover" alt="preview" />
                      </Zoom>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-center">
                        {getFileIcon(att.url)}
                        <p className="text-[10px] truncate w-full">{att.name || att.url.split("/").pop()}</p>
                      </div>
                    )}

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (att.isExisting || (att.isLink && !att.isNew)) {
                          await deleteAttachmentFromServer(att.url);
                        }
                        removeAttachment(i);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading}
                className="bg-linear-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
              >
                {uploading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Task;