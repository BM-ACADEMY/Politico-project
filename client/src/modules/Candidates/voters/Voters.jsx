import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '@/modules/Common/context/AuthContext';
import axiosInstance from '@/modules/Common/axios/axios';
import * as XLSX from 'xlsx';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Plus, Eye, MoreHorizontal, Upload, Download, MessageSquare } from 'lucide-react';
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
  const [importOpen, setImportOpen] = useState(false);
  const [viewImageOpen, setViewImageOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false); // New state for message dialog
  const [selectedImages, setSelectedImages] = useState({ voter_image: '', aadhar_image: '' });
  const [selectedVoterForMessage, setSelectedVoterForMessage] = useState(null); // New state for selected voter in message dialog
  const [wards, setWards] = useState([]);
  const [voters, setVoters] = useState([]);
  const [counts, setCounts] = useState({ total: 0, neutral: 0, supporters: 0, opposition: 0 });
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
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [filters, setFilters] = useState({ ward: 'all', support: 'all', created_by: 'all' });
  const [uniqueCreators, setUniqueCreators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState(''); // New state for message input

  useEffect(() => {
    fetchWards();
  }, []);

  useEffect(() => {
    fetchVoters();
  }, [filters]);

  const filteredVoters = useMemo(() => {
    if (!searchTerm) return voters;
    const term = searchTerm.toLowerCase();
    return voters.filter((voter) => {
      const dobStr = new Date(voter.dob).toLocaleDateString();
      const addressStr = `${voter.address.house_no}, ${voter.address.locality}, ${voter.address.street}, ${voter.address.city} - ${voter.address.postal_code}`;
      return (
        voter.name.toLowerCase().includes(term) ||
        voter.fathers_name.toLowerCase().includes(term) ||
        dobStr.includes(term) ||
        voter.phone.includes(term) ||
        voter.voter_id.toLowerCase().includes(term) ||
        voter.support.toLowerCase().includes(term) ||
        (voter.ward?.ward_name || '').toLowerCase().includes(term) ||
        addressStr.toLowerCase().includes(term) ||
        voter.aadhar_number.includes(term) ||
        (voter.message && voter.message.some(msg => msg.toLowerCase().includes(term))) // Search in messages too
      );
    });
  }, [voters, searchTerm]);

  const fetchWards = async () => {
    try {
      const response = await axiosInstance.get('/voters/wards');
      setWards(response.data.wards);
    } catch (error) {
      console.log(error);
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
      if (filters.created_by !== 'all') {
        params.append('created_by', filters.created_by);
      }
      const response = await axiosInstance.get(`/voters?${params}`);
      setVoters(response.data.voters);
      setCounts(response.data.stats);

      const creators = response.data.voters.reduce((acc, voter) => {
        if (voter.created_by?._id && !acc.some(c => c._id === voter.created_by._id)) {
          acc.push(voter.created_by);
        }
        return acc;
      }, []);
      setUniqueCreators(creators);
    } catch (error) {
      console.log(error);
      showToast('error', 'Failed to fetch voters');
    }
  };

  // Updated downloadTemplate using the second Excel file's structure
  const downloadTemplate = () => {
    // Use the data from voter_import_template (2).xlsx
    const templateData = [
      {
        'Name': 'John Doe',
        "Father's Name": 'Jane Doe',
        'DOB': '1990-01-01',
        'Phone': '1234567890',
        'Voter ID': 'ABC1234567',
        'Aadhar Number': '123456789012',
        'Support': 'Neutral',
        'Ward Name': 'reddiyarpalayam',
        'House No': '12A',
        'Locality': 'pudhu nagar',
        'Street': '1st cross',
        'City': 'puducherry',
        'Postal Code': '605010'
      },
      {
        'Name': 'Jane Smith',
        "Father's Name": 'John Smith',
        'DOB': '1985-05-15',
        'Phone': '0987654321',
        'Voter ID': 'DEF9876543',
        'Aadhar Number': '987654321098',
        'Support': 'Supporter',
        'Ward Name': 'reddiyarpalayam',
        'House No': '34B',
        'Locality': 'pudhu nagar',
        'Street': '2nd',
        'City': 'puducherry',
        'Postal Code': '605010'
      }
    ];

    // Create worksheet for data
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Instructions sheet (same as in voter_import_template (2).xlsx)
    const instructions = [
      ['Template for Voter Import'],
      ['Instructions:'],
      ['- Fill in the data starting from row 3.'],
      ['- DOB: Use YYYY-MM-DD format.'],
      ['- Phone: 10 digits only.'],
      ['- Voter ID: 3 uppercase letters + 7 digits (e.g., ABC1234567).'],
      ['- Aadhar Number: 12 digits.'],
      ['- Support: Neutral, Supporter, or Opposition.'],
      ['- Ward Name: Exact match with ward names (e.g., reddiyarpalayam).'],
      ['- Ensure Locality and Street match the ward\'s address details.'],
      [''], // empty row
      ['Data starts here:']
    ];
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructions);

    // Create workbook and append sheets
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');
    XLSX.utils.book_append_sheet(wb, ws, 'Voters');

    // Write file
    XLSX.writeFile(wb, 'voter_import_template.xlsx');
    showToast('success', 'Template downloaded successfully');
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

  const handleFileSelect = (e) => {
    setImportFile(e.target.files?.[0] || null);
  };

  // New handler for submitting a message
  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      showToast('error', 'Message cannot be empty');
      return;
    }

    setLoading(true);
    try {
      // Append new message to the existing array
      const updatedMessages = [...(selectedVoterForMessage.message || []), newMessage.trim()];
      const updateData = { message: updatedMessages };

      const submitData = new FormData();
      Object.keys(updateData).forEach((key) => {
        submitData.append(key, JSON.stringify(updateData[key]));
      });

      const config = {
        headers: {
          'Content-Type': undefined,
        },
        withCredentials: true,
      };

      await axiosInstance.put(`/voters/${selectedVoterForMessage._id}`, submitData, config);
      showToast('success', 'Message added successfully');
      setMessageOpen(false);
      setNewMessage('');
      setSelectedVoterForMessage(null);
      fetchVoters(); // Refresh voters to update messages
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to add message');
      console.error('Submit message error:', error.response);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      showToast('error', 'Please select an Excel file');
      return;
    }

    setImportLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const data = await importFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      if (jsonData.length === 0) {
        showToast('error', 'No data found in the Excel file');
        return;
      }

      const dataRows = jsonData.filter(row => row['Name'] && row['Name'].toString().trim() !== '');

      const promises = dataRows.map(async (row) => {
        try {
          const cleanPhone = (row['Phone'] || '').toString().replace(/\D/g, '').slice(0, 10);
          const cleanVoterId = (row['Voter ID'] || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
          const cleanAadhar = (row['Aadhar Number'] || '').toString().replace(/\D/g, '').slice(0, 12);
          let formattedAadhar = '';
          if (cleanAadhar.length === 12) {
            formattedAadhar = `${cleanAadhar.slice(0, 4)} ${cleanAadhar.slice(4, 8)} ${cleanAadhar.slice(8, 12)}`;
          }

          const wardMatch = wards.find((w) =>
            (row['Ward Name'] || '').toString().toLowerCase().includes(w.ward_name.toLowerCase())
          );
          if (!wardMatch) {
            return { success: false, reason: 'Ward not found' };
          }

          const locality = row['Locality'] || '';
          if (!wardMatch.localities.includes(locality)) {
            return { success: false, reason: 'Invalid locality' };
          }

          const street = row['Street'] || '';
          const postalCode = row['Postal Code'] || '';
          const addressDetail = wardMatch.address_details.find(
            (d) => d.locality === locality && d.street === street && d.postal_code === postalCode
          );
          if (!addressDetail) {
            return { success: false, reason: 'Invalid address details' };
          }

          const supportMap = {
            'Neutral': 'neutral',
            'Supporter': 'supporter',
            'Opposition': 'opposition',
          };
          const support = supportMap[(row['Support'] || 'Neutral').toString()] || 'neutral';

          if (!row['Name'] || !row["Father's Name"] || !cleanPhone || cleanPhone.length !== 10 || !cleanVoterId || cleanVoterId.length !== 10 || !cleanAadhar || cleanAadhar.length !== 12) {
            return { success: false, reason: 'Missing or invalid required fields' };
          }

          let dob = '';
          if (row['DOB']) {
            const date = new Date(row['DOB']);
            if (!isNaN(date.getTime())) {
              dob = date.toISOString().split('T')[0];
            }
          }
          if (!dob) {
            return { success: false, reason: 'Invalid DOB' };
          }

          const voterData = {
            name: row['Name'].toString().trim(),
            fathers_name: row["Father's Name"].toString().trim(),
            dob,
            phone: cleanPhone,
            voter_id: cleanVoterId,
            aadhar_number: formattedAadhar,
            support,
            ward: wardMatch._id,
            address: {
              house_no: (row['House No'] || '').toString().trim(),
              locality,
              street,
              city: (row['City'] || wardMatch.district).toString().trim(),
              postal_code: postalCode,
            },
          };

          const submitData = new FormData();
          Object.keys(voterData).forEach((key) => {
            if (key === 'address') {
              Object.keys(voterData.address).forEach((addrKey) => {
                submitData.append(`address[${addrKey}]`, voterData.address[addrKey]);
              });
            } else {
              submitData.append(key, voterData[key]);
            }
          });

          const config = {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true,
          };

          await axiosInstance.post('/voters', submitData, config);
          return { success: true };

        } catch (err) {
          console.error('Import error for row:', row, err);
          return { success: false, reason: err.response?.data?.message || 'Unknown error' };
        }
      });

      const results = await Promise.all(promises);
      successCount = results.filter((r) => r.success).length;
      errorCount = results.length - successCount;

      showToast(
        successCount > 0 ? 'success' : 'error',
        `Import completed: ${successCount} successful, ${errorCount} failed`
      );

      fetchVoters();
    } catch (error) {
      console.error('Import error:', error);
      showToast('error', 'Failed to process Excel file');
    } finally {
      setImportLoading(false);
      setImportFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      setImportOpen(false);
    }
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
      console.log(error);
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

  // New handler for opening message dialog
  const handleAddMessage = (voter) => {
    setSelectedVoterForMessage(voter);
    setNewMessage('');
    setMessageOpen(true);
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
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>

          <Dialog open={importOpen} onOpenChange={(o) => { setImportOpen(o); if (!o) setImportFile(null); }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Voters from Excel</DialogTitle>
                <DialogDescription>
                  Upload an Excel file (.xlsx or .xls) with voter data. Use the downloaded template for correct format.
                  <br />
                  <span className="text-xs text-muted-foreground block mt-1">
                    Note: Images are not imported; upload them manually after import.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={importLoading}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={handleImport}
                  disabled={!importFile || importLoading}
                  className="ml-auto"
                >
                  {importLoading ? 'Importing...' : 'Import Voters'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Voter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
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
            <div className="text-2xl font-bold ">{counts.supporters}</div>
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

      <div className="flex flex-col lg:flex-row gap-4 mb-4 flex-wrap">
        <div className="w-full lg:w-auto flex-1 min-w-[200px] flex flex-col gap-1.5">
          <Label>Search</Label>
          <Input
            placeholder="Search by Name, Father Name, DOB, Phone, Voter ID, Support, Ward, Address, Aadhar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="w-full lg:w-auto flex-1 min-w-[200px] flex flex-col gap-1.5">
          <Label>Ward Filter</Label>
          <Select value={filters.ward} onValueChange={(value) => handleFilterChange('ward', value)}>
            <SelectTrigger className="w-full">
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

        <div className="w-full lg:w-auto flex-1 min-w-[200px] flex flex-col gap-1.5">
          <Label>Support Filter</Label>
          <Select value={filters.support} onValueChange={(value) => handleFilterChange('support', value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Supports" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Supports</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="supporter">Supporter</SelectItem>
              <SelectItem value="opposition">Opposition</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full lg:w-auto flex-1 min-w-[200px] flex flex-col gap-1.5">
          <Label>Created By Filter</Label>
          <Select value={filters.created_by} onValueChange={(value) => handleFilterChange('created_by', value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Creators" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Creators</SelectItem>
              {uniqueCreators.map((creator) => (
                <SelectItem key={creator._id} value={creator._id}>
                  {creator.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* New Dialog for Adding Message */}
      <Dialog open={messageOpen} onOpenChange={(o) => { setMessageOpen(o); if (!o) { setNewMessage(''); setSelectedVoterForMessage(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Message for {selectedVoterForMessage?.name}</DialogTitle>
            <DialogDescription>
              Add a message or note for this voter. Messages are stored as an array and can be used for communication or notes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitMessage} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newMessage">Message</Label>
              <Textarea
                id="newMessage"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Enter your message here..."
                rows={4}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="ml-auto" disabled={loading || !newMessage.trim()}>
                {loading ? 'Sending...' : 'Add Message'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewImageOpen} onOpenChange={setViewImageOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:max-w-6xl">
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
                  className="w-full max-w-md h-auto rounded-lg border object-contain"
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
                  className="w-full max-w-md h-auto rounded-lg border object-contain"
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
        <Table className="min-w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="max-w-[8rem] truncate">Name</TableHead>
              <TableHead className="max-w-[8rem] truncate hidden sm:table-cell">Father Name</TableHead>
              <TableHead className="max-w-[5rem] truncate hidden sm:table-cell">DOB</TableHead>
              <TableHead className="max-w-[6rem] truncate">Phone</TableHead>
              <TableHead className="max-w-[8rem] truncate">Voter ID</TableHead>
              <TableHead className="w-[6rem]">Support</TableHead>
              <TableHead className="max-w-[6rem] truncate hidden md:table-cell">Ward</TableHead>
              <TableHead className="max-w-[12rem] truncate">Address</TableHead>
              <TableHead className="max-w-[8rem] truncate hidden lg:table-cell">Aadhar</TableHead>
              <TableHead className="max-w-[8rem] truncate hidden md:table-cell">Created By</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVoters.map((voter) => (
              <TableRow key={voter._id} className="hover:bg-muted/50">
                <TableCell className="max-w-[8rem] truncate font-medium" title={voter.name}>{voter.name}</TableCell>
                <TableCell className="max-w-[8rem] truncate hidden sm:table-cell" title={voter.fathers_name}>{voter.fathers_name}</TableCell>
                <TableCell className="max-w-[5rem] truncate hidden sm:table-cell">{new Date(voter.dob).toLocaleDateString()}</TableCell>
                <TableCell className="max-w-[6rem] truncate" title={voter.phone}>{voter.phone}</TableCell>
                <TableCell className="max-w-[8rem] truncate font-mono" title={voter.voter_id}>{voter.voter_id}</TableCell>
                <TableCell>
                  <Badge className={getSupportBadge(voter.support).color} variant={getSupportBadge(voter.support).variant}>
                    {voter.support.charAt(0).toUpperCase() + voter.support.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[6rem] truncate hidden md:table-cell">{voter.ward?.ward_name}</TableCell>
                <TableCell className="max-w-[12rem] truncate" title={`${voter.address.house_no}, ${voter.address.locality}, ${voter.address.street}, ${voter.address.city} - ${voter.address.postal_code}`}>
                  {`${voter.address.house_no}, ${voter.address.locality}, ${voter.address.street}, ${voter.address.city} - ${voter.address.postal_code}`}
                </TableCell>
                <TableCell className="max-w-[8rem] truncate hidden lg:table-cell" title={voter.aadhar_number}>{voter.aadhar_number}</TableCell>
                <TableCell className="max-w-[8rem] truncate hidden md:table-cell" title={voter.created_by?.name}>{voter.created_by?.name}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewImages(voter)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Images
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAddMessage(voter)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Add Message
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(voter)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(voter._id)}
                        className="focus:bg-destructive focus:text-destructive-foreground"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filteredVoters.length === 0 && (
        <p className="text-center text-muted-foreground mt-6">
          {searchTerm ? 'No voters found matching the search.' : 'No records found.'}
        </p>
      )}
    </div>
  );
};

export default Voters;