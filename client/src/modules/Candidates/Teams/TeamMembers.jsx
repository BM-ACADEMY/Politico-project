'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Search, User } from 'lucide-react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { AuthContext } from '@/modules/Common/context/AuthContext';
import axiosInstance from '@/modules/Common/axios/axios';
import { showToast } from '@/modules/Common/toast/customToast';

const TeamMembers = ({ refreshKey }) => { // ✅ Accept refreshKey as prop
  const { user } = useContext(AuthContext);
  const [volunteers, setVolunteers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Adjustable

  // ✅ Fetch user's volunteers (now role-based on backend)
  const fetchVolunteers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get('/volunteers');
      setVolunteers(res.data || []);
    } catch (err) {
      console.error('Fetch volunteers error:', err);
      showToast('error', 'Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch on mount and when refreshKey changes
  useEffect(() => {
    fetchVolunteers();
  }, [user, refreshKey]); // ✅ Add refreshKey to dependencies

  // ✅ Filter volunteers by name and status
  const filteredVolunteers = volunteers.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (v.status || 'active') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredVolunteers.length / itemsPerPage);
  const paginatedVolunteers = filteredVolunteers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4 px-4">
      <div>
        <h2 className="text-lg font-semibold mb-3">Team Members</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your volunteer team and track their performance
          {user?.role === 'admin' && ' (Admin view: All volunteers)'} {/* Optional: Show admin hint */}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search volunteers..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto"> {/* Scrollable container for responsiveness */}
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center"> {/* Reduced padding for height */}
              <div className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                <span>Loading volunteers...</span>
              </div>
            </CardContent>
          </Card>
        ) : paginatedVolunteers.length > 0 ? (
          paginatedVolunteers.map((vol) => (
           <Card key={vol._id || vol.id} className="p-4 hover:shadow-md transition-all">
  <div className="flex items-center justify-between">
    {/* LEFT SIDE */}
    <div className="flex items-start gap-4">
      {/* Avatar */}
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-gray-200 text-gray-800 text-sm font-medium">
          {vol.name?.charAt(0)?.toUpperCase() || 'V'}
        </AvatarFallback>
      </Avatar>

      {/* Volunteer Info */}
      <div className="min-w-0">
        {/* Name + Status + Rating */}
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm">{vol.name}</h3>

        </div>
           <p className="text-xs text-muted-foreground">
          {vol.email}
        </p>

        {/* Ward / Localities */}
        <p className="text-xs text-muted-foreground">
          {vol.ward
            ? `${vol.ward.ward_name}, ${vol.ward.ward_number}`
            : 'No ward info'}
        </p>

        {/* Localities */}
        <p className="text-xs text-muted-foreground truncate">
          {vol.localities?.join(', ') || 'No localities assigned'}
        </p>
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="text-right">
{vol.created_by && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <User className="w-3 h-3" />
            Created by: {vol.created_by.name || vol.created_by.email}
          </p>
        )}
      
    </div>
  </div>
</Card>

          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center"> {/* Reduced padding */}
              <p className="text-muted-foreground">
                No team members yet. Add your first volunteer!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} 
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      onClick={() => handlePageChange(page)} 
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              {totalPages > 5 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} 
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default TeamMembers;