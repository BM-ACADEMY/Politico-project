'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea'; // Added for description
import { Checkbox } from '@/components/ui/checkbox'; // Added import
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
  const [assignTaskOpen, setAssignTaskOpen] = useState(false); // New modal state
  const [refreshKey, setRefreshKey] = useState(0);
  const [wards, setWards] = useState([]);
  const [volunteers, setVolunteers] = useState([]); // For task assignment
  const [selectedWard, setSelectedWard] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    ward: '',
    localities: [],
  });
  const [taskFormData, setTaskFormData] = useState({ // New form for task
    task_title: '',
    description: '',
    assign_to: '',
  });

  // Fetch wards when volunteer modal opens
  useEffect(() => {
    if (addVolunteerOpen && user) {
      const fetchWards = async () => {
        try {
          const res = await axiosInstance.get('/wards');
          setWards(res.data.wards || []);
        } catch (err) {
          showToast('error', 'Failed to load your wards');
        }
      };
      fetchWards();
    }
  }, [addVolunteerOpen, user]);

  // Fetch volunteers when task modal opens (role-based, e.g., user's created or ward)
  useEffect(() => {
    if (assignTaskOpen && user) {
      const fetchVolunteers = async () => {
        try {
          const res = await axiosInstance.get('/volunteers'); // Backend handles role-based filter
          setVolunteers(res.data || []);
        } catch (err) {
          showToast('error', 'Failed to load volunteers');
        }
      };
      fetchVolunteers();
    }
  }, [assignTaskOpen, user]);

  // Handle ward selection for volunteer
  const handleWardChange = (wardId) => {
    const ward = wards.find((w) => w._id === wardId);
    setSelectedWard(ward);
    setFormData((prev) => ({ ...prev, ward: wardId, localities: [] }));
  };

  // Handle locality toggle for volunteer
  const toggleLocality = (locality) => {
    setFormData((prev) => ({
      ...prev,
      localities: prev.localities.includes(locality)
        ? prev.localities.filter((l) => l !== locality)
        : [...prev.localities, locality],
    }));
  };

  // Restrict phone number to digits only for volunteer
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setFormData({ ...formData, phoneNumber: value });
    }
  };

  // Submit volunteer form
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

  // Submit task form
  const handleTaskSubmit = async (e) => {
    e.preventDefault();

    if (!taskFormData.task_title || !taskFormData.description || !taskFormData.assign_to) {
      showToast('error', 'All task fields are required');
      return;
    }

    try {
      await axiosInstance.post('/tasks', taskFormData);
      showToast('success', 'Task assigned successfully!');
      setAssignTaskOpen(false);
      setRefreshKey((prev) => prev + 1); // Refresh tasks list
      resetTaskForm();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to assign task';
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
      assign_to: '',
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6"> {/* Responsive padding */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Volunteer Management</h1>
          <p className="text-muted-foreground">
            Manage your campaign team and track performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"> {/* Responsive buttons */}
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

      {/* Main Content - More responsive grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6"> {/* Added xl breakpoint */}
        {/* Team Members */}
        <div className="xl:col-span-2">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <TeamMembers refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        <div className="h-full">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <Assigntask refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Volunteer Modal - Adjusted for gaps */}
      <Dialog open={addVolunteerOpen} onOpenChange={setAddVolunteerOpen}>
        <DialogContent className="max-w-md sm:max-w-lg p-0"> {/* Increased width responsive, removed internal padding */}
          <DialogHeader className="p-6 pb-4"> {/* Adjusted padding */}
            <DialogTitle>Add New Volunteer</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleVolunteerSubmit} className="space-y-3 p-6 pt-0"> {/* Padding without header overlap */}
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
                      className="flex items-center space-x-2 p-1 rounded"
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
              <Button type="submit" disabled={formData.localities.length === 0}>
                Add Volunteer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Task Modal (New) - Adjusted for gaps */}
      <Dialog open={assignTaskOpen} onOpenChange={setAssignTaskOpen}>
        <DialogContent className="max-w-md sm:max-w-lg p-0"> {/* Increased width responsive, removed internal padding */}
          <DialogHeader className="p-6 pb-4"> {/* Adjusted padding */}
            <DialogTitle>Assign New Task</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleTaskSubmit} className="space-y-3 p-6 pt-0"> {/* Padding without header overlap */}
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
                rows={3}
                placeholder="Enter task details..."
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Assign To (Volunteer)</Label>
              <Select onValueChange={(value) => setTaskFormData({ ...taskFormData, assign_to: value })} value={taskFormData.assign_to}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a volunteer" />
                </SelectTrigger>
                <SelectContent>
                  {volunteers.map((vol) => (
                    <SelectItem key={vol._id} value={vol._id}>
                      {vol.name} ({vol.email}) - {vol.ward?.ward_name || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setAssignTaskOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!taskFormData.assign_to}>
                Assign Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;