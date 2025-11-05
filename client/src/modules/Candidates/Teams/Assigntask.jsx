'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axiosInstance from '@/modules/Common/axios/axios';
import { showToast } from '@/modules/Common/toast/customToast';

const Assigntask = ({ refreshKey }) => {
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [refreshKey]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/tasks');
      setPendingTasks(res.data || []);
    } catch (err) {
      showToast('error', 'Failed to load tasks');
      setPendingTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    return priority === 'high'
      ? 'bg-red-500'
      : priority === 'medium'
      ? 'bg-yellow-500'
      : 'bg-green-500';
  };

  if (loading) {
    return <div className="p-4 text-center">Loading tasks...</div>;
  }

  return (
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
                className="border border-gray-200 hover:bg-muted/40 transition-colors"
              >
                <CardContent className="p-3"> {/* ✅ Reduced padding */}
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
  );
};

export default Assigntask;