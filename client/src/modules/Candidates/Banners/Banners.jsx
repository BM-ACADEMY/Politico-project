import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Upload, AlertTriangle } from 'lucide-react'; // Adjust path as needed
import { AuthContext } from '@/modules/Common/context/AuthContext';
import axiosInstance from '@/modules/Common/axios/axios';
import { toast } from 'react-toastify';

const Banners = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [file, setFile] = useState(null);
  // New states for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBanners();
  }, [user, navigate]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/banners');
      setBanners(response.data.data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to fetch banners');
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // For create mode, require file; for edit mode, file is optional
    if (!editMode && !file) {
      toast.error('Please select an image file');
      return;
    }

    const formData = new FormData();
    if (file) {
      formData.append('image', file);
    }

    try {
      setUploading(true);
      const url = editMode ? `/banners/${currentBanner._id}` : '/banners';
      const method = editMode ? 'put' : 'post';
      await axiosInstance[method](url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(editMode ? 'Banner updated successfully' : 'Banner created successfully');
      setOpen(false);
      setFile(null);
      setEditMode(false);
      setCurrentBanner(null);
      fetchBanners();
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error(error.response?.data?.message || 'Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (banner) => {
    setEditMode(true);
    setCurrentBanner(banner);
    setFile(null); // Reset file for edit
    setOpen(true);
  };

  // Updated handleDelete to open confirmation dialog
  const handleDelete = (id) => {
    setBannerToDelete(id);
    setDeleteDialogOpen(true);
  };

  // New function to confirm and execute delete
  const confirmDelete = async () => {
    if (!bannerToDelete) return;

    try {
      await axiosInstance.delete(`/banners/${bannerToDelete}`);
      toast.success('Banner deleted successfully');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      // Handle specific error cases
      if (error.response?.status === 404) {
        toast.error('Banner not found or you are not authorized to delete it');
      } else {
        toast.error('Failed to delete banner');
      }
    } finally {
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading banners...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Banners</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              {editMode ? 'Edit Banner' : 'Add Banner'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
              <DialogDescription>
                {editMode ? 'Update the banner image (optional).' : 'Upload a new banner image.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="image">Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required={!editMode}
                  />
                  {editMode && currentBanner?.image && (
                    <div className="mt-2">
                      <img
                        src={currentBanner.image}
                        alt="Current banner"
                        className="w-full h-32 object-cover rounded"
                      />
                      <p className="text-sm text-muted-foreground">
                        Current image (will be replaced only if new file selected)
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={uploading || (!editMode && !file)}
                >
                  {uploading ? 'Uploading...' : editMode ? 'Update' : 'Upload'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No banners found.
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner._id}>
                  <TableCell>
                    <img
                      src={banner.image}
                      alt="Banner"
                      className="w-20 h-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{banner.createdBy?.name || 'Unknown'}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(banner.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(banner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(banner._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* New Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this banner?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setBannerToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Banners;