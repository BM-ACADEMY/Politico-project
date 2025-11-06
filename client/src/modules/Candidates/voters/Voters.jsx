import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/modules/Common/context/AuthContext';
import axiosInstance from '@/modules/Common/axios/axios';
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
import {
  Badge,
} from '@/components/ui/badge';
import { Edit, Trash2, Plus, Eye } from 'lucide-react';
import { showToast } from '@/modules/Common/toast/customToast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const Voters = () => {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState({ voter_image: '', aadhar_image: '' });
  const [wards, setWards] = useState([]);
  const [voters, setVoters] = useState([]);
  const [counts, setCounts] = useState({ total: 0, neutral: 0, supporter: 0, opposition: 0 });
  const [currentVoter, setCurrentVoter] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [localities, setLocalities] = useState([]);
  const [addressOptions, setAddressOptions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    fathers_name: '',
    dob: '',
    phone: '',
    voter_id: '',
    voter_image: null,
    aadhar_number: '',
    aadhar_image: null,
    support: 'neutral',
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
  const [filters, setFilters] = useState({ ward: 'all', support: 'all' });

  useEffect(() => {
    fetchWards();
  }, []);

  useEffect(() => {
    fetchVoters();
  }, [filters]);

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
      const params = new URLSearchParams();
      if (filters.ward !== 'all') {
        params.append('ward', filters.ward);
      }
      if (filters.support !== 'all') {
        params.append('support', filters.support);
      }
      const response = await axiosInstance.get(`/voters?${params}`);
      setVoters(response.data.voters);
      setCounts(response.data.counts);
    } catch (error) {
      showToast('error', 'Failed to fetch voters');
    }
  };

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

  const handleLocalityChange = (value) => {
    setFormData((prev) => ({ ...prev, address: { ...prev.address, locality: value } }));
    if (selectedWard) {
      const filteredAddresses = selectedWard.address_details
        .filter((detail) => detail.locality === value)
        .map((detail) => ({ street: detail.street, postal_code: detail.postal_code }));
      setAddressOptions(filteredAddresses);
    }
  };

  const handleAddressOptionChange = (value) => {
    const option = addressOptions.find((opt) => `${opt.street} - ${opt.postal_code}` === value);
    if (option) {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, street: option.street, postal_code: option.postal_code, city: selectedWard?.district || '' },
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

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, phone: value }));
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

  const handleSupportChange = (value) => {
    setFormData((prev) => ({ ...prev, support: value }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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
      support: 'neutral',
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
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      showToast('error', 'Phone number must be 10 digits.');
      setLoading(false);
      return;
    }
    if (!currentVoter && (!formData.voter_image || !formData.aadhar_image)) {
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
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      } else {
        submitData.append(key, formData[key]);
      }
    });

    const config = {
      headers: {
        'Content-Type': undefined,
      },
      withCredentials: true,
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
      fetchVoters();
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Operation failed');
      console.error('Submit error:', error.response);
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
      voter_image: null,
      aadhar_number: voter.aadhar_number,
      aadhar_image: null,
      support: voter.support,
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

  const handleViewImages = (voter) => {
    setSelectedImages({
      voter_image: voter.voter_image,
      aadhar_image: voter.aadhar_image,
    });
    setViewImageOpen(true);
  };

  const getSupportBadge = (support) => {
    switch (support) {
      case 'neutral': return { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' };
      case 'supporter': return { variant: 'default', color: 'bg-green-100 text-green-800' };
      case 'opposition': return { variant: 'destructive', color: 'bg-red-100 text-red-800' };
      default: return { variant: 'secondary', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Voter Registry</h1>
        <div className="flex flex-col sm:flex-row gap-2">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="phone">Phone (10 digits)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="1234567890"
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
                    <Label htmlFor="support">Support Status</Label>
                    <Select value={formData.support} onValueChange={handleSupportChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Support" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="supporter">Supporter</SelectItem>
                        <SelectItem value="opposition">Opposition</SelectItem>
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
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address Details</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                      <div className="md:col-span-3">
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="voter_image">Voter Card Image {currentVoter ? '(Optional)' : '(Required)'}</Label>
                    <Input
                      id="voter_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'voter_image')}
                      required={!currentVoter}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neutral</CardTitle>
            <Eye className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.neutral}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supporters</CardTitle>
            <Edit className="h-4 w-4 " />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold ">{counts.supporter}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opposition</CardTitle>
            <Trash2 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.opposition}</div>
          </CardContent>
        </Card>
      </div>

      <div className="inline-flex space-x-4 mb-4">
        <div className="space-y-2">
          <Label>Ward Filter</Label>
          <Select value={filters.ward} onValueChange={(value) => handleFilterChange('ward', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Wards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wards</SelectItem>
              {wards.map((ward) => (
                <SelectItem key={ward._id} value={ward._id}>
                  {ward.ward_name} ({ward.ward_number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Support Filter</Label>
          <Select value={filters.support} onValueChange={(value) => handleFilterChange('support', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Supports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="supporter">Supporter</SelectItem>
              <SelectItem value="opposition">Opposition</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
                    e.target.nextSibling.style.display = 'block';
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
                    e.target.nextSibling.style.display = 'block';
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

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Father Name</TableHead>
              <TableHead>DOB</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Voter ID</TableHead>
              <TableHead>Support</TableHead>
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
                <TableCell>
                  <Badge className={getSupportBadge(voter.support).color} variant={getSupportBadge(voter.support).variant}>
                    {voter.support.charAt(0).toUpperCase() + voter.support.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{voter.ward?.ward_name}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {`${voter.address.house_no}, ${voter.address.locality}, ${voter.address.street}, ${voter.address.city} - ${voter.address.postal_code}`}
                </TableCell>
                <TableCell>{voter.aadhar_number}</TableCell>
                <TableCell className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewImages(voter)}
                  >
                    <Eye className="w-4 h-4" />
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
      </div>
      {voters.length === 0 && (
        <p className="text-center text-muted-foreground mt-6">No records found.</p>
      )}
    </div>
  );
};

export default Voters;