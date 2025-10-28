import React, { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import { AuthContext } from '@/modules/Common/context/AuthContext';
import axiosInstance from '@/modules/Common/axios/axios';
import { showToast } from '@/modules/Common/toast/customToast';

const Candidates = () => {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCandidateId, setCurrentCandidateId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [parties, setParties] = useState([]);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    photo: null, // File object
    photoPreview: '', // URL for preview
    password: '',
    confirmPassword: '',
    party: '',
    gender: '',
    dob: '',
  });

  // Fetch parties and candidates
  useEffect(() => {
    fetchCandidates();
    fetchParties();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await axiosInstance.get('/candidates');
      setCandidates(res.data);
    } catch (error) {
      showToast('error', 'Failed to load candidates');
    }
  };

  const fetchParties = async () => {
    try {
      const res = await axiosInstance.get('/party');
      setParties(res.data);
    } catch (error) {
      showToast('error', 'Failed to load parties');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        photo: file,
        photoPreview: URL.createObjectURL(file),
      }));
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      phone: '',
      email: '',
      photo: null,
      photoPreview: '',
      password: '',
      confirmPassword: '',
      party: '',
      gender: '',
      dob: '',
    });
    setEditMode(false);
    setCurrentCandidateId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password && form.password !== form.confirmPassword) {
      showToast('error', 'Passwords do not match!');
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    formData.append('party', form.party);
    formData.append('gender', form.gender);
    formData.append('dob', form.dob);
// In handleSubmit
formData.append('created_by', user?.id || '');

    if (!editMode || form.password) {
      formData.append('password', form.password);
    }

    if (form.photo) {
      formData.append('photo', form.photo);
    }

    try {
      let response;
      if (editMode) {
        response = await axiosInstance.put(`/candidates/${currentCandidateId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('success', 'Candidate updated successfully');
      } else {
        response = await axiosInstance.post('/candidates', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('success', 'Candidate created successfully');
      }

      fetchCandidates();
      resetForm();
      setOpen(false);
    } catch (error) {
      const msg = error.response?.data?.message || 'Operation failed';
      showToast('error', msg);
    }
  };

  const handleEdit = (candidate) => {
    setForm({
      name: candidate.name,
      phone: candidate.phone,
      email: candidate.email,
      photo: null,
      photoPreview: candidate.photo || '',
      password: '',
      confirmPassword: '',
      party: candidate.party?._id || '',
      gender: candidate.gender,
      dob: candidate.dob ? new Date(candidate.dob).toISOString().split('T')[0] : '',
    });
    setEditMode(true);
    setCurrentCandidateId(candidate._id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;

    try {
      await axiosInstance.delete(`/candidates/${id}`);
      setCandidates((prev) => prev.filter((c) => c._id !== id));
      showToast('success', 'Candidate deleted');
    } catch (error) {
      showToast('error', 'Failed to delete candidate');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Candidates Management</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Candidate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Candidate' : 'Create New Candidate'}</DialogTitle>
              <DialogDescription>
                {editMode
                  ? 'Update candidate details. User account will be synced.'
                  : 'Fill in details to create a candidate. A user account with role "candidate" will be created.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" name="name" value={form.name} onChange={handleInputChange} className="col-span-3" required />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone</Label>
                  <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleInputChange} className="col-span-3" required />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleInputChange} className="col-span-3" required />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Photo</Label>
                  <div className="col-span-3">
                    {form.photoPreview ? (
                      <div className="flex items-center gap-2 mb-2">
                        <img src={form.photoPreview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                        <Button type="button" variant="ghost" size="sm" onClick={() => setForm(prev => ({ ...prev, photo: null, photoPreview: '' }))}>
                          Remove
                        </Button>
                      </div>
                    ) : null}
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center border-2 border-dashed rounded-md p-3 hover:bg-gray-50">
                        <Upload className="w-5 h-5 mr-2" />
                        <span>Upload Photo</span>
                      </div>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>

                {!editMode && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">Password</Label>
                      <Input id="password" name="password" type="password" value={form.password} onChange={handleInputChange} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="confirmPassword" className="text-right">Confirm</Label>
                      <Input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleInputChange} className="col-span-3" required />
                    </div>
                  </>
                )}

                {editMode && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-xs text-muted-foreground">Password</Label>
                    <p className="col-span-3 text-xs text-muted-foreground">Leave blank to keep current password</p>
                  </div>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="party" className="text-right">Party</Label>
                  <div className="col-span-3">
                    <Select onValueChange={(value) => handleSelectChange('party', value)} value={form.party}>
                      <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                      <SelectContent>
                        {parties.map((party) => (
                          <SelectItem key={party._id} value={party._id}>
                            <div className="flex items-center gap-2">
                              {party.logo ? (
                                <img src={party.logo} alt={party.parties_name} className="w-5 h-5 rounded object-cover" />
                              ) : (
                                <div className="w-5 h-5 bg-gray-200 rounded" />
                              )}
                              <span>{party.parties_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gender" className="text-right">Gender</Label>
                  <div className="col-span-3">
                    <Select onValueChange={(value) => handleSelectChange('gender', value)} value={form.gender}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dob" className="text-right">DOB</Label>
                  <Input id="dob" name="dob" type="date" value={form.dob} onChange={handleInputChange} className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editMode ? 'Update' : 'Create'} Candidate</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableCaption>List of all registered candidates</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Photo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Party</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>DOB</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No candidates found.
              </TableCell>
            </TableRow>
          ) : (
            candidates.map((candidate) => (
              <TableRow key={candidate._id}>
                <TableCell>
                  {candidate.photo ? (
                    <img src={candidate.photo} alt={candidate.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs">No</div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{candidate.name}</TableCell>
                <TableCell>{candidate.phone}</TableCell>
                <TableCell>{candidate.email}</TableCell>
                <TableCell>
                  {candidate.party ? (
                    <div className="flex items-center gap-2">
                      {candidate.party.logo && (
                        <img src={candidate.party.logo} alt={candidate.party.parties_name} className="w-5 h-5 rounded object-cover" />
                      )}
                      <span>{candidate.party.parties_name}</span>
                    </div>
                  ) : 'Independent'}
                </TableCell>
                <TableCell>{candidate.gender}</TableCell>
                <TableCell>{candidate.dob ? new Date(candidate.dob).toLocaleDateString() : '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(candidate)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(candidate._id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default Candidates;