import axiosInstance from '@/modules/Common/axios/axios';
import { AuthContext } from '@/modules/Common/context/AuthContext';
import { showToast } from '@/modules/Common/toast/customToast';
import React, { useState, useEffect, useContext } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const Joinus = () => {
  const { user } = useContext(AuthContext);
  const [joins, setJoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role.name !== 'candidate') {
      setError('Access denied. Only candidates can view join requests.');
      setLoading(false);
      return;
    }

    const fetchJoins = async () => {
      try {
        const response = await axiosInstance.get('/joinus');
        const allJoins = response.data;

        const userJoins = allJoins.filter(
          join => join.candidate_mobileNumber === user.phone
        );

        setJoins(userJoins);
      } catch (err) {
        console.error('Error fetching joins:', err);
        setError('Failed to fetch join requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchJoins();
  }, [user]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await axiosInstance.put(`/joinus/${id}/status`, { status: newStatus });
      setJoins(prev => prev.map(join => 
        join._id === id ? { ...join, status: newStatus } : join
      ));
      showToast('success', `Status updated to ${newStatus}.`);
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('error', 'Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this join request?')) return;

    try {
      await axiosInstance.delete(`/joinus/${id}`);
      setJoins(prev => prev.filter(join => join._id !== id));
      showToast('success', 'Join request deleted.');
    } catch (err) {
      console.error('Error deleting join:', err);
      showToast('error', 'Failed to delete join request.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading join requests...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Join Us Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {joins.length === 0 ? (
            <p className="text-gray-500">No join requests found for your mobile number.</p>
          ) : (
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Aadhar No</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {joins.map(join => (
                    <TableRow key={join._id}>
                      <TableCell>{join.name}</TableCell>
                      <TableCell>{join.aadharNo}</TableCell>
                      <TableCell>{join.phone}</TableCell>
                      <TableCell>{join.area}</TableCell>
                      <TableCell>{new Date(join.dob).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {join.image ? (
                          <img src={join.image} alt="Join" className="w-12 h-12 object-cover rounded" />
                        ) : 'No Image'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          join.status === 'pending' ? 'secondary' :
                          join.status === 'approved' ? 'default' : 'destructive'
                        }>
                          {join.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Select value={join.status} onValueChange={(value) => handleStatusUpdate(join._id, value)}>
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(join._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Joinus;