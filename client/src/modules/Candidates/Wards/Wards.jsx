import React, { useState, useContext, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Edit, Trash, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AuthContext } from "@/modules/Common/context/AuthContext";
import { showToast } from "@/modules/Common/toast/customToast";
import axiosInstance from "@/modules/Common/axios/axios";

const Wards = () => {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [wards, setWards] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [editingWard, setEditingWard] = useState(null);

  // ---------- Ward Form ----------
  const [wardForm, setWardForm] = useState({
    ward_name: "",
    ward_number: "",
    district: "",
    state: "",
    population: "",
    candidate_id: "",
  });

  const [localitiesInput, setLocalitiesInput] = useState("");
  const [localities, setLocalities] = useState([]);
  const [addressDetails, setAddressDetails] = useState([
    { locality: "", street: "", postal_code: "" },
  ]);

  // ---------- Edit Form ----------
  const [editWardForm, setEditWardForm] = useState({
    ward_name: "",
    ward_number: "",
    district: "",
    state: "",
    population: "",
    candidate_id: "",
  });
  const [editLocalitiesInput, setEditLocalitiesInput] = useState("");
  const [editLocalities, setEditLocalities] = useState([]);
  const [editAddressDetails, setEditAddressDetails] = useState([]);

  // ---------- Fetch Data ----------
  const fetchCandidates = async () => {
    try {
      const res = await axiosInstance.get("/candidates");
      setCandidates(res.data || []);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    }
  };

  const fetchWards = async () => {
    setFetching(true);
    setError("");
    try {
      const res = await axiosInstance.get("/wards");
      setWards(res.data.wards || []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to fetch wards";
      setError(msg);
      showToast("error", msg);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchWards();
    fetchCandidates();
  }, []);

  // ---------- Create Ward Handlers ----------
  const handleWardChange = (e) => {
    const { name, value } = e.target;
    setWardForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCandidateChange = (value) => {
    setWardForm((prev) => ({ ...prev, candidate_id: value }));
  };

  const handleAddLocalities = () => {
    const newLocs = localitiesInput
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (newLocs.length === 0) {
      showToast("error", "Please enter at least one locality");
      return;
    }

    setLocalities((prev) => [...new Set([...prev, ...newLocs])]);
    setLocalitiesInput("");
    showToast("success", `${newLocs.length} locality(ies) added`);
  };

  const removeLocality = (loc) => {
    // Check if any address uses this locality
    const usedInAddresses = addressDetails.some(addr => addr.locality === loc);
    if (usedInAddresses) {
      showToast("warning", `Cannot remove locality "${loc}" as it is used in addresses.`);
      return;
    }

    setLocalities((prev) => prev.filter((l) => l !== loc));
    showToast("info", `Removed locality "${loc}".`);
  };

  const handleAddressChange = (index, field, value) => {
    const updated = [...addressDetails];
    updated[index][field] = value;
    setAddressDetails(updated);
  };

  const addAddressRow = () => {
    setAddressDetails((prev) => [
      ...prev,
      { locality: "", street: "", postal_code: "" },
    ]);
  };

  const removeAddressRow = (index) => {
    if (addressDetails.length > 1) {
      setAddressDetails((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Safety: Check if user is authenticated
    if (!user) {
      showToast("error", "You must be logged in to create a ward.");
      return;
    }

    if (
      !wardForm.ward_name ||
      !wardForm.ward_number ||
      !wardForm.district ||
      !wardForm.state ||
      !wardForm.population ||
      !wardForm.candidate_id
    ) {
      showToast("error", "Please fill all required fields including candidate");
      return;
    }

    if (localities.length === 0) {
      showToast("error", "Please add at least one locality");
      return;
    }

    const hasEmptyAddress = addressDetails.some(
      (addr) => !addr.locality || !addr.street || !addr.postal_code
    );
    if (hasEmptyAddress) {
      showToast("error", "Please fill all address fields completely");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ward_name: wardForm.ward_name,
        ward_number: Number(wardForm.ward_number),
        candidate_id: wardForm.candidate_id,
        district: wardForm.district,
        state: wardForm.state,
        population: Number(wardForm.population),
        localities,
        address_details: addressDetails,
        // DO NOT SEND created_by → Backend sets it from req.user.id
      };

      await axiosInstance.post("/wards", payload);
      showToast("success", "Ward created successfully!");

      resetCreateForm();
      setOpen(false);
      fetchWards();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create ward";
      showToast("error", msg);
      console.error("Ward creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setWardForm({
      ward_name: "",
      ward_number: "",
      district: "",
      state: "",
      population: "",
      candidate_id: "",
    });
    setLocalities([]);
    setLocalitiesInput("");
    setAddressDetails([{ locality: "", street: "", postal_code: "" }]);
  };

  // ---------- Edit Ward ----------
  const openEditModal = (ward) => {
    setEditingWard(ward);
    setEditWardForm({
      ward_name: ward.ward_name || "",
      ward_number: ward.ward_number || "",
      district: ward.district || "",
      state: ward.state || "",
      population: ward.population || "",
      candidate_id: ward.candidate_id?._id || "",
    });
    setEditLocalities(ward.localities || []);
    setEditLocalitiesInput("");
    setEditAddressDetails(ward.address_details || []);
    setEditOpen(true);
  };

  const editHandleWardChange = (e) => {
    const { name, value } = e.target;
    setEditWardForm((prev) => ({ ...prev, [name]: value }));
  };

  const editHandleCandidateChange = (value) => {
    setEditWardForm((prev) => ({ ...prev, candidate_id: value }));
  };

  const editHandleAddLocalities = () => {
    const newLocs = editLocalitiesInput
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (newLocs.length === 0) {
      showToast("error", "Please enter at least one locality");
      return;
    }

    setEditLocalities((prev) => [...new Set([...prev, ...newLocs])]);
    setEditLocalitiesInput("");
    showToast("success", `${newLocs.length} locality(ies) added`);
  };

  const editRemoveLocality = (loc) => {
    // Check if any address uses this locality
    const usedInAddresses = editAddressDetails.some(addr => addr.locality === loc);
    if (usedInAddresses) {
      showToast("warning", `Cannot remove locality "${loc}" as it is used in addresses.`);
      return;
    }

    setEditLocalities((prev) => prev.filter((l) => l !== loc));
    showToast("info", `Removed locality "${loc}".`);
  };

  const handleEditAddressChange = (index, field, value) => {
    const updated = [...editAddressDetails];
    updated[index][field] = value;
    setEditAddressDetails(updated);
  };

  const addEditAddressRow = () => {
    setEditAddressDetails((prev) => [
      ...prev,
      { locality: "", street: "", postal_code: "" },
    ]);
  };

  const removeEditAddressRow = (index) => {
    if (editAddressDetails.length > 1) {
      setEditAddressDetails((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleUpdateWard = async () => {
    if (
      !editWardForm.ward_name ||
      !editWardForm.ward_number ||
      !editWardForm.district ||
      !editWardForm.state ||
      !editWardForm.population ||
      (user?.role !== "candidate" && !editWardForm.candidate_id)
    ) {
      showToast("error", "Please fill all required fields" + (user?.role !== "candidate" ? " including candidate" : ""));
      return;
    }

    if (editLocalities.length === 0) {
      showToast("error", "Please add at least one locality");
      return;
    }

    const hasEmptyAddress = editAddressDetails.some(
      (addr) => !addr.locality || !addr.street || !addr.postal_code
    );
    if (hasEmptyAddress) {
      showToast("error", "Please fill all address fields completely");
      return;
    }

    setEditLoading(true);
    try {
      const payload = {
        ward_name: editWardForm.ward_name,
        ward_number: Number(editWardForm.ward_number),
        district: editWardForm.district,
        state: editWardForm.state,
        population: Number(editWardForm.population),
        localities: editLocalities,
        address_details: editAddressDetails,
      };

      if (user?.role !== "candidate") {
        payload.candidate_id = editWardForm.candidate_id;
      }

      await axiosInstance.put(`/wards/${editingWard._id}`, payload);
      showToast("success", "Ward updated successfully!");
      setEditOpen(false);
      fetchWards();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update ward";
      showToast("error", msg);
      // Enhanced: If authorization error, suggest checking permissions
      if (msg.includes("authorized")) {
        showToast("info", "You may not have permission to edit this ward. Contact an admin if needed.");
      }
    } finally {
      setEditLoading(false);
    }
  };

  // ---------- Delete Ward ----------
  const handleDeleteWard = async (wardId) => {
    if (!window.confirm("Are you sure you want to delete this ward?")) return;

    try {
      await axiosInstance.delete(`/wards/${wardId}`);
      showToast("success", "Ward deleted successfully");
      fetchWards();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete ward";
      showToast("error", msg);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Wards Management</h1>

        {/* Create Ward Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Ward
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Ward</DialogTitle>
              <DialogDescription>
                Select candidate → Add localities → Create address details
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Ward Details + Candidate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ward_name">Ward Name *</Label>
                  <Input
                    id="ward_name"
                    name="ward_name"
                    value={wardForm.ward_name}
                    onChange={handleWardChange}
                    placeholder="e.g., Central Ward"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ward_number">Ward Number *</Label>
                  <Input
                    id="ward_number"
                    name="ward_number"
                    type="number"
                    value={wardForm.ward_number}
                    onChange={handleWardChange}
                    placeholder="e.g., 101"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="candidate_id">Candidate *</Label>
                  <Select value={wardForm.candidate_id} onValueChange={handleCandidateChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Select Candidate --" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((candidate) => (
                        <SelectItem key={candidate._id} value={candidate._id}>
                          {candidate.name} ({candidate.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    name="district"
                    value={wardForm.district}
                    onChange={handleWardChange}
                    placeholder="e.g., Mumbai Suburban"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={wardForm.state}
                    onChange={handleWardChange}
                    placeholder="e.g., Maharashtra"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="population">Population *</Label>
                  <Input
                    id="population"
                    name="population"
                    type="number"
                    value={wardForm.population}
                    onChange={handleWardChange}
                    placeholder="e.g., 45000"
                    required
                  />
                </div>
              </div>

              {/* Localities */}
              <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
                <Label>Step 1: Add Localities *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Andheri, Bandra, Juhu"
                    value={localitiesInput}
                    onChange={(e) => setLocalitiesInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddLocalities()
                    }
                  />
                  <Button type="button" onClick={handleAddLocalities}>
                    Add
                  </Button>
                </div>
                {localities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {localities.map((loc) => (
                      <Badge key={loc} variant="secondary" className="flex items-center gap-1">
                        {loc}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removeLocality(loc)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Address Details */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Step 2: Address Details</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addAddressRow}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Address
                  </Button>
                </div>

                {addressDetails.map((addr, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-gray-50"
                  >
                    <div>
                      <Label>Locality *</Label>
                      <Select value={addr.locality} onValueChange={(value) => handleAddressChange(index, "locality", value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="-- Select --" />
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
                      <Label>Street *</Label>
                      <Input
                        value={addr.street}
                        onChange={(e) =>
                          handleAddressChange(index, "street", e.target.value)
                        }
                        placeholder="Main Road"
                        required
                      />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Postal Code *</Label>
                        <Input
                          value={addr.postal_code}
                          onChange={(e) =>
                            handleAddressChange(
                              index,
                              "postal_code",
                              e.target.value
                            )
                          }
                          placeholder="400001"
                          required
                        />
                      </div>
                      {addressDetails.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => removeAddressRow(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Ward"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Ward Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ward</DialogTitle>
            <DialogDescription>
              Update ward details, localities, and addresses for: <strong>{editingWard?.ward_name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Ward Details + Candidate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_ward_name">Ward Name *</Label>
                <Input
                  id="edit_ward_name"
                  name="ward_name"
                  value={editWardForm.ward_name}
                  onChange={editHandleWardChange}
                  placeholder="e.g., Central Ward"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_ward_number">Ward Number *</Label>
                <Input
                  id="edit_ward_number"
                  name="ward_number"
                  type="number"
                  value={editWardForm.ward_number}
                  onChange={editHandleWardChange}
                  placeholder="e.g., 101"
                  required
                />
              </div>
              {user?.role === "candidate" ? (
                <div>
                  <Label>Candidate</Label>
                  <Input
                    value={`${editingWard?.candidate_id?.name || "N/A"} (${editingWard?.candidate_id?.email || ""})`}
                    disabled
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="edit_candidate_id">Candidate *</Label>
                  <Select value={editWardForm.candidate_id} onValueChange={editHandleCandidateChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Select Candidate --" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((candidate) => (
                        <SelectItem key={candidate._id} value={candidate._id}>
                          {candidate.name} ({candidate.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="edit_district">District *</Label>
                <Input
                  id="edit_district"
                  name="district"
                  value={editWardForm.district}
                  onChange={editHandleWardChange}
                  placeholder="e.g., Mumbai Suburban"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_state">State *</Label>
                <Input
                  id="edit_state"
                  name="state"
                  value={editWardForm.state}
                  onChange={editHandleWardChange}
                  placeholder="e.g., Maharashtra"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_population">Population *</Label>
                <Input
                  id="edit_population"
                  name="population"
                  type="number"
                  value={editWardForm.population}
                  onChange={editHandleWardChange}
                  placeholder="e.g., 45000"
                  required
                />
              </div>
            </div>

            {/* Localities */}
            <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
              <Label>Localities *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Andheri, Bandra, Juhu"
                  value={editLocalitiesInput}
                  onChange={(e) => setEditLocalitiesInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && editHandleAddLocalities()
                  }
                />
                <Button type="button" onClick={editHandleAddLocalities}>
                  Add
                </Button>
              </div>
              {editLocalities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editLocalities.map((loc) => (
                    <Badge key={loc} variant="secondary" className="flex items-center gap-1">
                      {loc}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => editRemoveLocality(loc)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Address Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Address Details</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addEditAddressRow}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Address
                </Button>
              </div>

              {editAddressDetails.map((addr, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-gray-50"
                >
                  <div>
                    <Label>Locality *</Label>
                    <Select value={addr.locality} onValueChange={(value) => handleEditAddressChange(index, "locality", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="-- Select --" />
                      </SelectTrigger>
                      <SelectContent>
                        {editLocalities.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Street *</Label>
                    <Input
                      value={addr.street}
                      onChange={(e) =>
                        handleEditAddressChange(index, "street", e.target.value)
                      }
                      placeholder="Main Road"
                      required
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label>Postal Code *</Label>
                      <Input
                        value={addr.postal_code}
                        onChange={(e) =>
                          handleEditAddressChange(
                            index,
                            "postal_code",
                            e.target.value
                          )
                        }
                        placeholder="400001"
                        required
                      />
                    </div>
                    {editAddressDetails.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => removeEditAddressRow(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateWard} disabled={editLoading}>
                {editLoading ? "Updating..." : "Update Ward"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wards Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableCaption>
            {fetching
              ? "Loading wards..."
              : error
              ? `Error: ${error}`
              : `${wards.length} ward(s) found`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Ward Name</TableHead>
              <TableHead>Ward #</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Population</TableHead>
              <TableHead>Addresses</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fetching ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : wards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No wards found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              wards.map((ward) => (
                <TableRow key={ward._id}>
                  <TableCell className="font-medium">
                    {ward.ward_name}
                  </TableCell>
                  <TableCell>{ward.ward_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {ward.candidate_id?.photo && (
                        <img
                          src={`${import.meta.env.VITE_BASE_URL}/Uploads/candidateimages/${ward.candidate_id.photo}`}
                          alt={ward.candidate_id.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <span>{ward.candidate_id?.name || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{ward.district}</TableCell>
                  <TableCell>{ward.population.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {ward.address_details?.length || 0} address(es)
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(ward)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteWard(ward._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Wards;