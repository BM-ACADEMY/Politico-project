'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Plus, Upload, Edit, Trash2 } from 'lucide-react';
import axiosInstance from '@/modules/Common/axios/axios';

export default function Parties() {
  const [parties, setParties] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [partyLogoFile, setPartyLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingParty, setEditingParty] = useState(null);
  const itemsPerPage = 5;

  // ---------- FETCH ----------
  const fetchParties = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/party');
      setParties(res.data);
    } catch (err) {
      console.log(err);
      
      setError('Failed to load parties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  // ---------- LOGO PREVIEW ----------
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPartyLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setPartyName('');
    setPartyLogoFile(null);
    setLogoPreview(null);
    setError('');
  };

  // ---------- CREATE ----------
  const handleCreateParty = async () => {
    if (!partyName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('parties_name', partyName.trim());
      if (partyLogoFile) formData.append('logo', partyLogoFile);

      const res = await axiosInstance.post('/party', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Ensure the logo URL is stored from the response
      const newParty = res.data.party;
      setParties((prev) => [...prev, newParty]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error('Create error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to create party');
    } finally {
      setLoading(false);
    }
  };

  // ---------- EDIT ----------
  const handleEditClick = (party) => {
    setEditingParty(party);
    setPartyName(party.parties_name);
    setLogoPreview(party.logo || null);
    setPartyLogoFile(null);
    setIsEditDialogOpen(true);
  };

  const handleUpdateParty = async () => {
    if (!partyName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('parties_name', partyName.trim());
      if (partyLogoFile) formData.append('logo', partyLogoFile);

      const res = await axiosInstance.put(
        `/party/${editingParty._id}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      const updatedParty = res.data.updatedParty;
      setParties((prev) =>
        prev.map((p) => (p._id === editingParty._id ? updatedParty : p))
      );
      setIsEditDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error('Update error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update party');
    } finally {
      setLoading(false);
    }
  };

  // ---------- DELETE ----------
  const handleDeleteParty = async (id) => {
    if (!window.confirm('Are you sure you want to delete this party?')) return;

    try {
      await axiosInstance.delete(`/party/${id}`);
      setParties((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete party');
    }
  };

  // ---------- PAGINATION ----------
  const totalPages = Math.ceil(parties.length / itemsPerPage);
  const paginatedParties = parties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      {/* ---------- HEADER ---------- */}
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Parties
          </h1>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Party</span>
          </Button>
        </div>

        {/* ---------- GLOBAL ERROR ---------- */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* ---------- LOADING ---------- */}
        {loading && !parties.length && (
          <div className="text-center py-12 text-gray-500">
            Loading parties...
          </div>
        )}

        {/* ---------- TABLE ---------- */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Logo</TableHead>
                  <TableHead>Party Name</TableHead>
                  <TableHead className="w-32 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedParties.length > 0 ? (
                  paginatedParties.map((party) => (
                    <TableRow key={party._id}>
                      <TableCell>
                        {party.logo ? (
                          <img
                            src={party.logo}
                            alt={party.parties_name}
                            className="w-12 h-12 object-cover rounded-full border"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              console.error('Image load failed:', party.logo);
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        {!party.logo && (
                          <div className="w-12 h-12 bg-gray-200 border-2 border-dashed rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-500">
                              No Logo
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {party.parties_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClick(party)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteParty(party._id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-12 text-gray-500"
                    >
                      No parties found. Click "Add Party" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ---------- PAGINATION ---------- */}
          {totalPages > 1 && (
            <div className="border-t px-4 py-3">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={
                        currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                      }
                    />
                  </PaginationItem>

                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, i) => i + 1
                  )
                    .slice(
                      Math.max(0, currentPage - 3),
                      Math.min(totalPages, currentPage + 2)
                    )
                    .map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => e.preventDefault()}
                      >
                        ...
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage === totalPages
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* ---------- CREATE DIALOG ---------- */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Party</DialogTitle>
            <DialogDescription>
              Enter the party name and upload a logo (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Party Name</Label>
              <Input
                id="create-name"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="Enter party name"
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-logo">Party Logo (optional)</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-full border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 border-2 border-dashed rounded-full" />
                )}
                <label className="cursor-pointer">
                  <Input
                    id="create-logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                    disabled={loading}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateParty}
              disabled={!partyName.trim() || loading}
            >
              {loading ? 'Creating…' : 'Create Party'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- EDIT DIALOG ---------- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Party</DialogTitle>
            <DialogDescription>
              Update the party name and logo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Party Name</Label>
              <Input
                id="edit-name"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="Enter party name"
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-logo">Party Logo (optional)</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-full border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 border-2 border-dashed rounded-full" />
                )}
                <label className="cursor-pointer">
                  <Input
                    id="edit-logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                    disabled={loading}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Change Logo
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateParty}
              disabled={!partyName.trim() || loading}
            >
              {loading ? 'Updating…' : 'Update Party'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}