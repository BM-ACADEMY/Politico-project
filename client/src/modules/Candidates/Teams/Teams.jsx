'use client';
import React, { useState, useEffect, useContext } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { AuthContext } from '@/modules/Common/context/AuthContext';
import axiosInstance from '@/modules/Common/axios/axios';
import { showToast } from '@/modules/Common/toast/customToast';
import { Card, CardContent } from '@/components/ui/card';
import TeamMembers from './TeamMembers';
import Assigntask from './Assigntask';

const Teams = () => {
  const { user } = useContext(AuthContext);

  const [addVolunteerOpen, setAddVolunteerOpen] = useState(false);
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [wards, setWards] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    ward: '',
    localities: [],
  });

  const [taskFormData, setTaskFormData] = useState({
    task_title: '',
    description: '',
    assign_to: [], // Array of volunteer IDs
    event: '',
  });

  // Fetch wards when Add Volunteer modal opens
  useEffect(() => {
    if (addVolunteerOpen && user) {
      const fetchWards = async () => {
        try {
          const res = await axiosInstance.get('/wards');
          setWards(res.data.wards || []);
        } catch (err) {
          showToast('error', 'Failed to load wards');
        }
      };
      fetchWards();
    }
  }, [addVolunteerOpen, user]);

  // Fetch volunteers when Assign Task modal opens
  useEffect(() => {
    if (assignTaskOpen && user) {
      const fetchVolunteers = async () => {
        try {
          const res = await axiosInstance.get('/volunteers');
          setVolunteers(res.data || []);
        } catch (err) {
          showToast('error', 'Failed to load volunteers');
        }
      };
      fetchVolunteers();
    }
  }, [assignTaskOpen, user]);

  // Fetch events (only scheduled & ongoing)
  useEffect(() => {
    if (assignTaskOpen && user) {
      const fetchEvents = async () => {
        try {
          const res = await axiosInstance.get('/events?status=scheduled,ongoing');
          setEvents(res.data.data || []);
        } catch (err) {
          showToast('error', 'Failed to load events');
          setEvents([]);
        }
      };
      fetchEvents();
    }
  }, [assignTaskOpen, user]);

  const handleWardChange = (wardId) => {
    const ward = wards.find((w) => w._id === wardId);
    setSelectedWard(ward);
    setFormData((prev) => ({ ...prev, ward: wardId, localities: [] }));
  };

  const toggleLocality = (locality) => {
    setFormData((prev) => ({
      ...prev,
      localities: prev.localities.includes(locality)
        ? prev.localities.filter((l) => l !== locality)
        : [...prev.localities, locality],
    }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setFormData({ ...formData, phoneNumber: value });
    }
  };

  const handleVolunteerSubmit = async (e) => {
    e.preventDefault();

    if (formData.phoneNumber.length !== 10) {
      showToast('error', 'Phone number must be exactly 10 digits');
      return;
    }

    if (formData.localities.length === 0) {
      showToast('error', 'Please select at least one locality');
      return;
    }

    try {
      await axiosInstance.post('/volunteers', formData);
      showToast('success', 'Volunteer added successfully!');
      setAddVolunteerOpen(false);
      setRefreshKey((prev) => prev + 1);
      resetVolunteerForm();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add volunteer';
      showToast('error', msg);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();

    if (!taskFormData.task_title || !taskFormData.description || !taskFormData.event || taskFormData.assign_to.length === 0) {
      showToast('error', 'Please fill all fields and select at least one volunteer');
      return;
    }

    try {
      const payload = {
        task_title: taskFormData.task_title,
        description: taskFormData.description,
        assign_to: taskFormData.assign_to, // array
        event: taskFormData.event,
      };

      await axiosInstance.post('/tasks/bulk', payload);

      showToast('success', `Task assigned to ${taskFormData.assign_to.length} volunteer(s)!`);
      setAssignTaskOpen(false);
      setRefreshKey((prev) => prev + 1);
      resetTaskForm();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to assign tasks';
      showToast('error', msg);
    }
  };

  const resetVolunteerForm = () => {
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      ward: '',
      localities: [],
    });
    setSelectedWard(null);
  };

  const resetTaskForm = () => {
    setTaskFormData({
      task_title: '',
      description: '',
      assign_to: [],
      event: '',
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Volunteer Management</h1>
          <p className="text-muted-foreground">
            Manage your campaign team and track performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button onClick={() => setAddVolunteerOpen(true)} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Add Volunteer
          </Button>
          <Button onClick={() => setAssignTaskOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Assign Task
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <div className="xl:col-span-2">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <TeamMembers refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </div>
        <div className="h-full">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <Assigntask refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Volunteer Modal */}
      <Dialog open={addVolunteerOpen} onOpenChange={setAddVolunteerOpen}>
        <DialogContent className="max-w-md sm:max-w-lg p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Add New Volunteer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVolunteerSubmit} className="space-y-3 p-6 pt-0">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Phone Number</Label>
              <Input
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                placeholder="10-digit number"
                maxLength={10}
                inputMode="numeric"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength="6"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Ward</Label>
              <Select onValueChange={handleWardChange} value={formData.ward}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your ward" />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((ward) => (
                    <SelectItem key={ward._id} value={ward._id}>
                      {ward.ward_name} ({ward.ward_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedWard && selectedWard.localities?.length > 0 && (
              <div className="space-y-1">
                <Label>Select Localities</Label>
                <div className="grid grid-cols-2 gap-2 mt-1 max-h-32 overflow-y-auto">
                  {selectedWard.localities.map((loc) => (
                    <label
                      key={loc}
                      className="flex items-center space-x-2 p-1 rounded hover:bg-accent"
                    >
                      <Checkbox
                        checked={formData.localities.includes(loc)}
                        onCheckedChange={() => toggleLocality(loc)}
                      />
                      <span className="text-sm">{loc}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setAddVolunteerOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formData.localities.length === 0 || formData.phoneNumber.length !== 10}
              >
                Add Volunteer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Task Modal - MULTI SELECT */}
      <Dialog open={assignTaskOpen} onOpenChange={setAssignTaskOpen}>
        <DialogContent className="max-w-md sm:max-w-lg p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Assign New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4 p-6 pt-0">
            <div className="space-y-1">
              <Label>Task Title</Label>
              <Input
                value={taskFormData.task_title}
                onChange={(e) => setTaskFormData({ ...taskFormData, task_title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                rows={4}
                placeholder="Enter task details..."
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Related Event (Scheduled/Ongoing)</Label>
              <Select
                onValueChange={(value) => setTaskFormData({ ...taskFormData, event: value })}
                value={taskFormData.event}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((evt) => (
                    <SelectItem key={evt._id} value={evt._id}>
                      {evt.eventTitle} - {new Date(evt.date).toLocaleDateString()} {evt.time} ({evt.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign To (Select Multiple Volunteers)</Label>
              <div className="border rounded-lg p-3 max-h-64 overflow-y-auto bg-muted/20">
                {volunteers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No volunteers available
                  </p>
                ) : (
                  volunteers.map((vol) => (
                    <label
                      key={vol._id}
                      className="flex items-center space-x-3 p-3 hover:bg-accent/50 rounded-md cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={taskFormData.assign_to.includes(vol._id)}
                        onCheckedChange={(checked) => {
                          setTaskFormData((prev) => ({
                            ...prev,
                            assign_to: checked
                              ? [...prev.assign_to, vol._id]
                              : prev.assign_to.filter((id) => id !== vol._id),
                          }));
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{vol.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {vol.email} • {vol.ward?.ward_name || 'No ward'}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {taskFormData.assign_to.length > 0 && (
                <p className="text-sm font-medium text-primary">
                  {taskFormData.assign_to.length} volunteer(s) selected
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAssignTaskOpen(false);
                  resetTaskForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !taskFormData.task_title ||
                  !taskFormData.description ||
                  !taskFormData.event ||
                  taskFormData.assign_to.length === 0
                }
              >
                Assign to {taskFormData.assign_to.length || 0} Volunteer(s)
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;