// Updated Assigntask.jsx - Separated fields into distinct sections with better layout
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import axiosInstance from '@/modules/Common/axios/axios';
import { showToast } from '@/modules/Common/toast/customToast';

const Assigntask = ({ refreshKey }) => {
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [refreshKey]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/tasks/get-all-task');
      setPendingTasks(res.data || []);
    } catch (err) {
      showToast('error', 'Failed to load tasks');
      setPendingTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const getPriorityColor = (priority) => {
    // Default to medium since priority not in model
    return 'bg-yellow-500';
  };

  if (loading) {
    return <div className="p-4 text-center">Loading tasks...</div>;
  }

  return (
    <>
      <div className="space-y-4 h-full flex flex-col px-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Pending Tasks</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Tasks assigned to volunteers
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="space-y-2 max-h-full overflow-y-auto pr-1">
            {pendingTasks.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground text-sm">
                  No pending tasks yet.
                </CardContent>
              </Card>
            ) : (
              pendingTasks.map((task) => (
                <Card
                  key={task._id}
                  className="border border-gray-200 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => handleCardClick(task)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Title + Priority Dot */}
                        <div className="flex items-center gap-2 mb-0.5">
                          <div
                            className={`w-2 h-2 rounded-full ${getPriorityColor(
                              task.priority || 'medium'
                            )}`}
                          />
                          <p className="font-medium text-sm leading-tight truncate">
                            {task.task_title}
                          </p>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>

                        {/* Event Info if present */}
                        {task.event && (
                          <p className="text-xs text-muted-foreground mb-1">
                            Event: <span className="font-medium">{task.event.eventTitle}</span> - {new Date(task.event.date).toLocaleDateString()}
                          </p>
                        )}

                        {/* Assigned Info */}
                        <p className="text-xs text-muted-foreground">
                          Assigned to:{' '}
                          <span className="font-medium">
                            {task.assign_to?.name || 'Unassigned'}
                          </span>
                          {task.assign_to?.ward && (
                            <span className="ml-1 text-blue-600">
                              ({task.assign_to.ward.ward_name})
                            </span>
                          )}
                        </p>

                        {/* Status Badge */}
                        <Badge variant="secondary" className="mt-1 text-[10px] py-0.5 px-2">
                          {task.status || 'pending'}
                        </Badge>
                      </div>

                      {/* Date */}
                      <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Task Details Modal - Separated Fields */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>View full details of the selected task.</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6 pt-2">
              {/* Task Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm border-b pb-1">Task Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Title:</span> {selectedTask.task_title}</p>
                  <p><span className="font-medium">Description:</span> {selectedTask.description}</p>
                </div>
              </div>

              <Separator />

              {/* Event Section */}
              {selectedTask.event && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm border-b pb-1">Event Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Title:</span> {selectedTask.event.eventTitle}</p>
                    <p><span className="font-medium">Date:</span> {new Date(selectedTask.event.date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Time:</span> {selectedTask.event.time}</p>
                    <p><span className="font-medium">Venue:</span> {selectedTask.event.venue}</p>
                    <p><span className="font-medium">Type:</span> {selectedTask.event.eventType}</p>
                    <p><span className="font-medium">Status:</span> {selectedTask.event.status}</p>
                    <p><span className="font-medium">Target Attendance:</span> {selectedTask.event.targetAttendance}</p>
                    {selectedTask.event.description && (
                      <p><span className="font-medium">Description:</span> {selectedTask.event.description}</p>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Assigned To Section */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm border-b pb-1">Assigned To</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedTask.assign_to?.name || 'Unassigned'}</p>
                  <p><span className="font-medium">Email:</span> {selectedTask.assign_to?.email || 'N/A'}</p>
                  {selectedTask.assign_to?.ward && (
                    <p><span className="font-medium">Ward:</span> {selectedTask.assign_to.ward.ward_name} ({selectedTask.assign_to.ward.ward_number})</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Status and Date Section */}
              <div className="flex justify-between pt-2">
                <Badge variant="secondary">{selectedTask.status || 'pending'}</Badge>
                <p className="text-sm text-muted-foreground">Created: {new Date(selectedTask.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Assigntask;