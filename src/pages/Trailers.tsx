import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trailer } from '@/types/database';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Pencil, Trash2, Edit3, UserX, Search, X, Filter, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { FloatingMenuButton } from '@/components/FloatingMenuButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const Trailers = () => {
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrailer, setEditingTrailer] = useState<Trailer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Filter states
  const [activeFilters, setActiveFilters] = useState({
    expiryStatus: [] as string[],
  });

  const [formData, setFormData] = useState({
    trailer_number: '',
    type: '',
    model: '',
    color: '',
    status: '',
    expiry_date: '',
  });

  // Fetch trailers from database
  const fetchTrailers = async () => {
    try {
      const { data, error } = await supabase
        .from('trailers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrailers(data || []);
    } catch (error: unknown) {
      console.error('Error fetching trailers:', error);
      toast.error('Failed to fetch trailers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrailers();
  }, []);

  // Calculate expiry status
  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring';
    return 'active';
  };

  // Filter and search logic
  const filteredTrailers = useMemo(() => {
    return trailers.filter(trailer => {
      // Search filter
      const matchesSearch = 
        trailer.trailer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trailer.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trailer.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trailer.color.toLowerCase().includes(searchTerm.toLowerCase());

      // Expiry status filter
      const expiryStatus = getExpiryStatus(trailer.expiry_date);
      const matchesExpiryStatus = activeFilters.expiryStatus.length === 0 || 
        activeFilters.expiryStatus.includes(expiryStatus);

      return matchesSearch && matchesExpiryStatus;
    });
  }, [trailers, searchTerm, activeFilters]);

  // Filter management
  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: checked 
        ? [...prev[filterType as keyof typeof prev], value]
        : prev[filterType as keyof typeof prev].filter(item => item !== value)
    }));
  };

  const clearFilters = () => {
    setActiveFilters({
      expiryStatus: [],
    });
  };

  const hasActiveFilters = Object.values(activeFilters).some(filter => filter.length > 0);
  const getActiveFilterCount = () => Object.values(activeFilters).reduce((sum, filter) => sum + filter.length, 0);

  // Form management
  const resetForm = () => {
    setFormData({
      trailer_number: '',
      type: '',
      model: '',
      color: '',
      status: '',
      expiry_date: '',
    });
    setEditingTrailer(null);
  };

  const openEditDialog = (trailer: Trailer) => {
    setEditingTrailer(trailer);
    setFormData({
      trailer_number: trailer.trailer_number,
      type: trailer.type,
      model: trailer.model,
      color: trailer.color,
      status: trailer.status,
      expiry_date: trailer.expiry_date,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTrailer) {
        // Update existing trailer
        const { error } = await supabase
          .from('trailers')
          .update({
            trailer_number: formData.trailer_number,
            type: formData.type,
            model: formData.model,
            color: formData.color,
            status: formData.status,
            expiry_date: formData.expiry_date,
          })
          .eq('id', editingTrailer.id);

        if (error) throw error;
        toast.success('Trailer updated successfully');
      } else {
        // Create new trailer
        const { error } = await supabase
          .from('trailers')
          .insert([{
            trailer_number: formData.trailer_number,
            type: formData.type,
            model: formData.model,
            color: formData.color,
            status: formData.status,
            expiry_date: formData.expiry_date,
          }]);

        if (error) throw error;
        toast.success('Trailer created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTrailers();
    } catch (error: unknown) {
      console.error('Error saving trailer:', error);
      toast.error('Failed to save trailer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trailer?')) return;

    try {
      const { error } = await supabase
        .from('trailers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Trailer deleted successfully');
      fetchTrailers();
    } catch (error: unknown) {
      console.error('Error deleting trailer:', error);
      toast.error('Failed to delete trailer');
    }
  };

  // Mobile card expansion
  const toggleCardExpansion = (trailerId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trailerId)) {
        newSet.delete(trailerId);
      } else {
        newSet.add(trailerId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <LoadingSpinner 
        size="lg" 
        message="Loading trailers..." 
        fullScreen={true} 
      />
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-40 bg-card border-b border-border">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Trailers</h1>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Trailer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl w-[95vw] sm:w-full mx-auto p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle>{editingTrailer ? 'Edit' : 'Add New'} Trailer</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="trailer_number" className="text-sm font-medium">Trailer Number</Label>
                        <Input
                          id="trailer_number"
                          value={formData.trailer_number}
                          onChange={(e) => setFormData({ ...formData, trailer_number: e.target.value })}
                          placeholder="Enter trailer number"
                          className="h-10 sm:h-11"
                          required
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                          <SelectTrigger className="h-10 sm:h-11">
                            <SelectValue placeholder="Select trailer type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Box">Box</SelectItem>
                            <SelectItem value="Flatbed">Flatbed</SelectItem>
                            <SelectItem value="Curtainside">Curtainside</SelectItem>
                            <SelectItem value="TIR Box">TIR Box</SelectItem>
                            <SelectItem value="TIR BL">TIR BL</SelectItem>
                            <SelectItem value="Balmer">Balmer</SelectItem>
                            <SelectItem value="Reefer">Reefer</SelectItem>
                            <SelectItem value="Reefer TIR">Reefer TIR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="model" className="text-sm font-medium">Model</Label>
                        <Input
                          id="model"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          placeholder="Enter trailer model"
                          className="h-10 sm:h-11"
                          required
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="color" className="text-sm font-medium">Color</Label>
                        <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                          <SelectTrigger className="h-10 sm:h-11">
                            <SelectValue placeholder="Select trailer color" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="red">Red</SelectItem>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="white">White</SelectItem>
                            <SelectItem value="black">Black</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                            <SelectItem value="orange">Orange</SelectItem>
                            <SelectItem value="yellow">Yellow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger className="h-10 sm:h-11">
                            <SelectValue placeholder="Select trailer status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="empty">Empty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="expiry_date" className="text-sm font-medium">Expiry Date</Label>
                        <Input
                          id="expiry_date"
                          type="date"
                          value={formData.expiry_date}
                          onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                          className="h-10 sm:h-11"
                          required
                        />
                      </div>
                    </div>
                    <div className="pt-2 sm:pt-4">
                      <Button type="submit" className="w-full h-11 sm:h-12 text-base font-medium">
                        {editingTrailer ? 'Update' : 'Create'} Trailer
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <div className="p-6">
            {/* Search and Filter Section */}
            <div className="flex gap-2 mb-6">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by trailer number, type, model, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                          {getActiveFilterCount()}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-3">Expiry Status</h4>
                        <div className="space-y-2">
                          {['active', 'expiring', 'expired'].map((status) => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox
                                id={`expiry-status-${status}`}
                                checked={activeFilters.expiryStatus.includes(status)}
                                onCheckedChange={(checked) => 
                                  handleFilterChange('expiryStatus', status, checked as boolean)
                                }
                              />
                              <Label 
                                htmlFor={`expiry-status-${status}`} 
                                className="text-sm font-normal capitalize cursor-pointer"
                              >
                                {status === 'expiring' ? 'Expiring (≤30 days)' : status}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead>Trailer Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrailers.map((trailer) => {
                      const expiryStatus = getExpiryStatus(trailer.expiry_date);
                      return (
                        <TableRow key={trailer.id}>
                          <TableCell className="font-medium">{trailer.trailer_number}</TableCell>
                          <TableCell className="capitalize">{trailer.type.replace('_', ' ')}</TableCell>
                          <TableCell>{trailer.model}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: trailer.color.toLowerCase() }}
                                title={trailer.color}
                              ></div>
                              <span className="capitalize">{trailer.color}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span 
                              className={
                                expiryStatus === 'active' ? 'text-black' :
                                expiryStatus === 'expiring' ? 'text-orange-600 font-medium' : 'text-red-600 font-medium'
                              }
                            >
                              {formatDate(trailer.expiry_date)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                          className={`w-3 h-3 rounded-full ${
                            trailer.status === 'active' ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          title={`Status: ${trailer.status}`}
                        ></div>
                              <div className="flex items-center gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  onClick={() => openEditDialog(trailer)}
                                  title="Edit trailer"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  onClick={() => handleDelete(trailer.id)}
                                  title="Delete trailer"
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {filteredTrailers.map((trailer) => {
                const expiryStatus = getExpiryStatus(trailer.expiry_date);
                return (
                  <div key={trailer.id} className="bg-white border rounded-lg shadow-sm">
                    {/* Mobile Header - Always Visible */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer"
                      onClick={() => toggleCardExpansion(trailer.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            trailer.status === 'active' ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                          title={`Status: ${trailer.status}`}
                        ></div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{trailer.trailer_number}</h3>
                          <p className="text-xs text-gray-500">Model: {trailer.model}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(trailer);
                              }}
                              title="Edit trailer"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(trailer.id);
                              }}
                              title="Delete trailer"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <ChevronDown 
                          className={`h-4 w-4 text-gray-400 transition-transform ${
                            expandedCards.has(trailer.id) ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Mobile Details - Expandable */}
                    {expandedCards.has(trailer.id) && (
                      <div className="px-3 pb-3 border-t bg-gray-50">
                        <div className="grid grid-cols-1 gap-2 pt-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">Type:</span>
                            <span className="text-sm text-gray-900 capitalize">{trailer.type.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">Model:</span>
                            <span className="text-sm text-gray-900">{trailer.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">Color:</span>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: trailer.color.toLowerCase() }}
                              ></div>
                              <span className="text-sm text-gray-900 capitalize">{trailer.color}</span>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">Expiry Date:</span>
                            <span 
                              className={`text-sm ${
                                expiryStatus === 'active' ? 'text-black' :
                                expiryStatus === 'expiring' ? 'text-orange-600 font-medium' : 'text-red-600 font-medium'
                              }`}
                            >
                              {formatDate(trailer.expiry_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
        <FloatingMenuButton />
      </div>
    </SidebarProvider>
  );
};

export default Trailers;