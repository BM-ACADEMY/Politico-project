// Voters.jsx (minor tweak: add error handling for broken images in modal)
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/modules/Common/context/AuthContext'; // Assuming AuthContext provides user and axios
import axiosInstance from '@/modules/Common/axios/axios'; // Updated to axiosInstance
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
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, Plus, Eye } from 'lucide-react';
import { showToast } from '@/modules/Common/toast/customToast';
// Assuming toast utility

const Voters = () => {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [viewImageOpen, setViewImageOpen] = useState(false); // New state for image modal
  const [selectedImages, setSelectedImages] = useState({ voter_image: '', aadhar_image: '' }); // Store image URLs for viewing
  const [wards, setWards] = useState([]);
  const [voters, setVoters] = useState([]); // Renamed from people
  const [currentVoter, setCurrentVoter] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [localities, setLocalities] = useState([]);
  const [addressOptions, setAddressOptions] = useState([]); // For street/postal_code per locality
  const [formData, setFormData] = useState({
    name: '',
    fathers_name: '',
    dob: '',
    phone: '',
    voter_id: '',
    voter_image: null,
    aadhar_number: '',
    aadhar_image: null,
    ward: '',
    address: {
      house_no: '',
      locality: '',
      street: '',
      city: '',
      postal_code: '',
    },
  });
  const [loading, setLoading] = useState(false);

  // Fetch wards on mount
  useEffect(() => {
    fetchWards();
  }, []);

  // Fetch voters on mount
  useEffect(() => {
    fetchVoters();
  }, []);

  const fetchWards = async () => {
    try {
      const response = await axiosInstance.get('/voters/wards');
      setWards(response.data.wards);
    } catch (error) {
      showToast('error', 'Failed to fetch wards');
    }
  };

  const fetchVoters = async () => {
    try {
      const response = await axiosInstance.get('/voters');
      setVoters(response.data.voters);
    } catch (error) {
      showToast('error', 'Failed to fetch voters');
    }
  };

  // On ward change: set selectedWard, populate localities
  const handleWardChange = (value) => {
    const ward = wards.find((w) => `${w.ward_name} (${w.ward_number})` === value);
    setSelectedWard(ward);
    setFormData((prev) => ({ ...prev, ward: ward?._id || '' }));
    setLocalities(ward?.localities || []);
    setAddressOptions([]);
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, locality: '', street: '', postal_code: '' },
    }));
  };

  // On locality change: filter address_details for streets/postal_codes
  const handleLocalityChange = (value) => {
    setFormData((prev) => ({ ...prev, address: { ...prev.address, locality: value } }));
    if (selectedWard) {
      const filteredAddresses = selectedWard.address_details
        .filter((detail) => detail.locality === value)
        .map((detail) => ({ street: detail.street, postal_code: detail.postal_code }));
      setAddressOptions(filteredAddresses);
    }
  };

  // On address option change (street/postal_code)
  const handleAddressOptionChange = (value) => {
    const option = addressOptions.find((opt) => `${opt.street} - ${opt.postal_code}` === value);
    if (option) {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, street: option.street, postal_code: option.postal_code, city: selectedWard?.district || '' }, // Assume city from district
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('address.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleVoterIdChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, voter_id: value }));
  };

  const handleAadharChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    let formatted = '';
    if (value.length <= 4) {
      formatted = value;
    } else if (value.length <= 8) {
      formatted = `${value.slice(0, 4)} ${value.slice(4)}`;
    } else {
      formatted = `${value.slice(0, 4)} ${value.slice(4, 8)} ${value.slice(8, 12)}`;
    }
    setFormData((prev) => ({ ...prev, aadhar_number: formatted }));
  };

  const handleFileChange = (e, key) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.files?.[0] || null }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      fathers_name: '',
      dob: '',
      phone: '',
      voter_id: '',
      voter_image: null,
      aadhar_number: '',
      aadhar_image: null,
      ward: '',
      address: {
        house_no: '',
        locality: '',
        street: '',
        city: '',
        postal_code: '',
      },
    });
    setSelectedWard(null);
    setLocalities([]);
    setAddressOptions([]);
    setCurrentVoter(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    const cleanVoterId = formData.voter_id.replace(/[^A-Z0-9]/g, '');
    if (cleanVoterId.length !== 10 || !/^[A-Z]{3}\d{7}$/.test(cleanVoterId)) {
      showToast('error', 'Voter ID must be 3 uppercase letters followed by 7 digits.');
      setLoading(false);
      return;
    }
    const cleanAadhar = formData.aadhar_number.replace(/\D/g, '');
    if (cleanAadhar.length !== 12) {
      showToast('error', 'Aadhar number must be 12 digits.');
      setLoading(false);
      return;
    }
    if (!currentVoter && (!formData.voter_image || !formData.aadhar_image)) { // Only require for create
      showToast('error', 'Images are required for new voters.');
      setLoading(false);
      return;
    }

    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === 'address') {
        Object.keys(formData.address).forEach((addrKey) => {
          submitData.append(`address[${addrKey}]`, formData.address[addrKey]);
        });
      } else if (key === 'voter_image' || key === 'aadhar_image') {
        if (formData[key]) { // Only append if file exists
          submitData.append(key, formData[key]);
        }
      } else {
        submitData.append(key, formData[key]);
      }
    });

    // Config to override default Content-Type for FormData (let browser set multipart/form-data with boundary)
    const config = {
      headers: {
        'Content-Type': undefined, // This removes the default 'application/json' and allows axios to set multipart/form-data
      },
      withCredentials: true, // Ensure cookies are sent
    };

    try {
      if (currentVoter) {
        await axiosInstance.put(`/voters/${currentVoter._id}`, submitData, config);
        showToast('success', 'Voter updated successfully');
      } else {
        await axiosInstance.post('/voters', submitData, config);
        showToast('success', 'Voter added successfully');
      }
      setOpen(false);
      resetForm();
      fetchVoters(); // Refresh list
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Operation failed');
      console.error('Submit error:', error.response); // For debugging
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (voter) => {
    setCurrentVoter(voter);
    const ward = wards.find((w) => w._id === voter.ward._id);
    setSelectedWard(ward);
    setLocalities(ward?.localities || []);
    const filteredAddresses = ward?.address_details
      ?.filter((detail) => detail.locality === voter.address.locality)
      ?.map((detail) => ({ street: detail.street, postal_code: detail.postal_code })) || [];
    setAddressOptions(filteredAddresses);
    setFormData({
      name: voter.name,
      fathers_name: voter.fathers_name,
      dob: voter.dob.split('T')[0],
      phone: voter.phone,
      voter_id: voter.voter_id,
      voter_image: null, // Re-upload for edit (optional)
      aadhar_number: voter.aadhar_number,
      aadhar_image: null,
      ward: voter.ward._id,
      address: voter.address,
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await axiosInstance.delete(`/voters/${id}`);
      showToast('success', 'Voter deleted successfully');
      fetchVoters();
    } catch (error) {
      showToast('error', 'Delete failed');
    }
  };

  // New handler for viewing images
  const handleViewImages = (voter) => {
    setSelectedImages({
      voter_image: voter.voter_image,
      aadhar_image: voter.aadhar_image,
    });
    setViewImageOpen(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Voter Registry</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Voter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentVoter ? 'Edit Voter' : 'Add Voter'}</DialogTitle>
              <DialogDescription>
                Enter the details for the voter.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fathers_name">Father's Name</Label>
                  <Input
                    id="fathers_name"
                    name="fathers_name"
                    value={formData.fathers_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voter_id">Voter ID (3 letters + 7 digits)</Label>
                  <Input
                    id="voter_id"
                    name="voter_id"
                    value={formData.voter_id}
                    onChange={handleVoterIdChange}
                    placeholder="ABC1234567"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ward">Ward</Label>
                  <Select value={selectedWard ? `${selectedWard.ward_name} (${selectedWard.ward_number})` : ''} onValueChange={handleWardChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((ward) => (
                        <SelectItem key={ward._id} value={`${ward.ward_name} (${ward.ward_number})`}>
                          {ward.ward_name} ({ward.ward_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aadhar_number">Aadhar Number</Label>
                  <Input
                    id="aadhar_number"
                    name="aadhar_number"
                    value={formData.aadhar_number}
                    onChange={handleAadharChange}
                    placeholder="1234 5678 9012"
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Address Details</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="house_no">House No.</Label>
                      <Input
                        id="house_no"
                        name="address.house_no"
                        value={formData.address.house_no}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="locality">Locality</Label>
                      <Select value={formData.address.locality} onValueChange={handleLocalityChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Locality" />
                        </SelectTrigger>
                        <SelectContent>
                          {localities.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="street">Street & Postal</Label>
                      <Select value={`${formData.address.street} - ${formData.address.postal_code}`} onValueChange={handleAddressOptionChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Address Option" />
                        </SelectTrigger>
                        <SelectContent>
                          {addressOptions.map((opt, idx) => (
                            <SelectItem key={idx} value={`${opt.street} - ${opt.postal_code}`}>
                              {opt.street} - {opt.postal_code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="voter_image">Voter Card Image {currentVoter ? '(Optional)' : '(Required)'}</Label>
                  <Input
                    id="voter_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'voter_image')}
                    required={!currentVoter}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="aadhar_image">Aadhar Card Image {currentVoter ? '(Optional)' : '(Required)'}</Label>
                  <Input
                    id="aadhar_image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'aadhar_image')}
                    required={!currentVoter}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="ml-auto" disabled={loading}>
                  {loading ? 'Processing...' : (currentVoter ? 'Save Changes' : 'Add')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* New Dialog for Viewing Images (added onError for broken images) */}
      <Dialog open={viewImageOpen} onOpenChange={setViewImageOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Voter Images</DialogTitle>
            <DialogDescription>
              Uploaded images for the selected voter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedImages.voter_image && (
              <div className="space-y-2">
                <h3 className="font-semibold">Voter Card Image</h3>
                <img
                  src={selectedImages.voter_image}
                  alt="Voter Card"
                  className="w-full max-w-md h-auto rounded-lg border"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block'; // Show fallback message
                  }}
                />
                <p className="text-sm text-muted-foreground hidden">Image not available.</p>
              </div>
            )}
            {selectedImages.aadhar_image && (
              <div className="space-y-2">
                <h3 className="font-semibold">Aadhar Card Image</h3>
                <img
                  src={selectedImages.aadhar_image}
                  alt="Aadhar Card"
                  className="w-full max-w-md h-auto rounded-lg border"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block'; // Show fallback message
                  }}
                />
                <p className="text-sm text-muted-foreground hidden">Image not available.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewImageOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Father Name</TableHead>
            <TableHead>DOB</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Voter ID</TableHead>
            <TableHead>Ward</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Aadhar Number</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {voters.map((voter) => (
            <TableRow key={voter._id}>
              <TableCell>{voter.name}</TableCell>
              <TableCell>{voter.fathers_name}</TableCell>
              <TableCell>{new Date(voter.dob).toLocaleDateString()}</TableCell>
              <TableCell>{voter.phone}</TableCell>
              <TableCell>{voter.voter_id}</TableCell>
              <TableCell>{voter.ward?.ward_name}</TableCell>
              <TableCell className="max-w-xs truncate">
                {`${voter.address.house_no}, ${voter.address.locality}, ${voter.address.street}, ${voter.address.city} - ${voter.address.postal_code}`}
              </TableCell>
              <TableCell>{voter.aadhar_number}</TableCell>
              <TableCell className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewImages(voter)}
                >
                  <Eye className="w-4 h-4" />
                  View Images
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(voter)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(voter._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {voters.length === 0 && (
        <p className="text-center text-muted-foreground mt-6">No records found.</p>
      )}
    </div>
  );
};

export default Voters;