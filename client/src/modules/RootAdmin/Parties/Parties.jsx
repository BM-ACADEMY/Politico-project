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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Plus, Upload } from 'lucide-react';

interface Party {
  id: number;
  logo: string;
  name: string;
}

export default function Parties() {
  const [parties, setParties] = useState<Party[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [partyLogo, setPartyLogo] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('parties');
    if (stored) {
      setParties(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage whenever parties change
  useEffect(() => {
    localStorage.setItem('parties', JSON.stringify(parties));
  }, [parties]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPartyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateParty = () => {
    if (!partyName.trim()) return;

    const newParty: Party = {
      id: Date.now(),
      logo: partyLogo || '',
      name: partyName.trim(),
    };

    setParties((prev) => [...prev, newParty]);
    setIsDialogOpen(false);
    setPartyName('');
    setPartyLogo(null);
  };

  // Pagination logic
  const totalPages = Math.ceil(parties.length ?? 0 / itemsPerPage);
  const paginatedParties = parties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Parties</h1>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Party</span>
          </Button>
        </div>

        {/* Responsive Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Logo</TableHead>
                  <TableHead>Party Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedParties.length > 0 ? (
                  paginatedParties.map((party) => (
                    <TableRow key={party.id}>
                      <TableCell>
                        {party.logo ? (
                          <img
                            src={party.logo}
                            alt={party.name}
                            className="w-12 h-12 object-cover rounded-full border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 border-2 border-dashed rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-500">No Logo</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{party.name}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-gray-500">
                      No parties added yet. Click "Add Party" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
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
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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

                  {totalPages > 5 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* Add Party Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Party</DialogTitle>
            <DialogDescription>
              Enter the party name and upload a logo (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Party Name</Label>
              <Input
                id="name"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="Enter party name"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logo">Party Logo (optional)</Label>
              <div className="flex items-center gap-4">
                {partyLogo ? (
                  <img
                    src={partyLogo}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-full border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 border-2 border-dashed rounded-full" />
                )}
                <label className="cursor-pointer">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateParty} disabled={!partyName.trim()}>
              Create Party
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}