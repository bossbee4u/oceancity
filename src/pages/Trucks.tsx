import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Truck as TruckType } from '@/types/database';
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

const Trucks = () => {
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<TruckType | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    truckStatus: [] as string[],
    expiryStatus: [] as string[]
  });
  
  // Mobile view state
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    truck_number: '',
    type: '',
    model: new Date().getFullYear(),
    expiry_date: '',
    status: 'active' as 'active' | 'empty',
    vg_id: '',
    tracking_link: '',
  });

  useEffect(() => {
    fetchTrucks();
  }, []);

  const fetchTrucks = async () => {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching trucks');
    } else {
      setTrucks(data as TruckType[] || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTruck) {
        const { error } = await supabase
          .from('trucks')
          .update(formData)
          .eq('id', editingTruck.id);

        if (error) throw error;
        toast.success('Truck updated successfully');
      } else {
        const { error } = await supabase
          .from('trucks')
          .insert([formData]);

        if (error) throw error;
        toast.success('Truck created successfully');
      }

      setIsDialogOpen(false);
      setEditingTruck(null);
      resetForm();
      fetchTrucks();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error saving truck');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this truck?')) return;

    const { error } = await supabase.from('trucks').delete().eq('id', id);

    if (error) {
      toast.error('Error deleting truck');
    } else {
      toast.success('Truck deleted successfully');
      fetchTrucks();
    }
  };

  const openEditDialog = (truck: TruckType) => {
    setEditingTruck(truck);
    setFormData({
      truck_number: truck.truck_number,
      type: truck.type,
      model: truck.model,
      expiry_date: truck.expiry_date,
      status: truck.status,
      vg_id: truck.vg_id || '',
      tracking_link: truck.tracking_link || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      truck_number: '',
      type: '',
      model: new Date().getFullYear(),
      expiry_date: '',
      status: 'active',
      vg_id: '',
      tracking_link: '',
    });
  };

  // Helper function to determine expiry status
  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'expired';
    } else if (diffDays <= 30) {
      return 'expiring';
    } else {
      return 'active';
    }
  };

  // Filter functions
  const filteredTrucks = useMemo(() => {
    return trucks.filter(truck => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        truck.truck_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.model.toString().includes(searchTerm);

      // Status filter
      const matchesStatus = activeFilters.truckStatus.length === 0 || 
        activeFilters.truckStatus.includes(truck.status);

      // Expiry status filter
      const expiryStatus = getExpiryStatus(truck.expiry_date);
      const matchesExpiryStatus = activeFilters.expiryStatus.length === 0 || 
        activeFilters.expiryStatus.includes(expiryStatus);

      return matchesSearch && matchesStatus && matchesExpiryStatus;
    });
  }, [trucks, searchTerm, activeFilters]);

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (filterType === 'truckStatus') {
        if (checked) {
          newFilters.truckStatus = [...newFilters.truckStatus, value];
        } else {
          newFilters.truckStatus = newFilters.truckStatus.filter(item => item !== value);
        }
      } else if (filterType === 'expiryStatus') {
        if (checked) {
          newFilters.expiryStatus = [...newFilters.expiryStatus, value];
        } else {
          newFilters.expiryStatus = newFilters.expiryStatus.filter(item => item !== value);
        }
      }
      return newFilters;
    });
  };

  const clearFilters = () => {
    setActiveFilters({
      truckStatus: [],
      expiryStatus: []
    });
    setSearchTerm('');
  };

  const hasActiveFilters = searchTerm !== '' || activeFilters.truckStatus.length > 0 || activeFilters.expiryStatus.length > 0;

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm !== '') count += 1;
    count += activeFilters.truckStatus.length;
    count += activeFilters.expiryStatus.length;
    return count;
  };

  const toggleCardExpansion = (truckId: string) => {
    const newExpandedCards = new Set(expandedCards);
    if (newExpandedCards.has(truckId)) {
      newExpandedCards.delete(truckId);
    } else {
      newExpandedCards.add(truckId);
    }
    setExpandedCards(newExpandedCards);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-40 bg-card border-b border-border">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Trucks</h1>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingTruck(null); resetForm(); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Truck
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTruck ? 'Edit Truck' : 'Add New Truck'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="truck_number">Truck Number</Label>
                      <Input
                        id="truck_number"
                        value={formData.truck_number}
                        onChange={(e) => setFormData({ ...formData, truck_number: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Input
                        id="type"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="model">Model (Year)</Label>
                      <Input
                        id="model"
                        type="number"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiry_date">Expiry Date</Label>
                      <Input
                        id="expiry_date"
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="empty">Empty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="vg_id">VG ID (Optional)</Label>
                      <Input
                        id="vg_id"
                        value={formData.vg_id}
                        onChange={(e) => setFormData({ ...formData, vg_id: e.target.value })}
                        placeholder="Enter VG ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tracking_link">Tracking Link (Optional)</Label>
                      <Input
                        id="tracking_link"
                        type="url"
                        value={formData.tracking_link}
                        onChange={(e) => setFormData({ ...formData, tracking_link: e.target.value })}
                        placeholder="Enter tracking link URL"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingTruck ? 'Update' : 'Create'} Truck
                    </Button>
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
                  placeholder="Search by truck number, type, or model..."
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
                        <h4 className="font-medium text-sm mb-3">Truck Status</h4>
                        <div className="space-y-2">
                          {['active', 'empty'].map((status) => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox
                                id={`truck-status-${status}`}
                                checked={activeFilters.truckStatus.includes(status)}
                                onCheckedChange={(checked) => 
                                  handleFilterChange('truckStatus', status, checked as boolean)
                                }
                              />
                              <Label 
                                htmlFor={`truck-status-${status}`} 
                                className="text-sm font-normal capitalize cursor-pointer"
                              >
                                {status}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
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
                      <TableHead>Truck Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrucks.map((truck) => {
                      const expiryStatus = getExpiryStatus(truck.expiry_date);
                      return (
                        <TableRow key={truck.id}>
                          <TableCell className="font-medium">{truck.truck_number}</TableCell>
                          <TableCell>{truck.type}</TableCell>
                          <TableCell>{truck.model}</TableCell>
                          <TableCell>
                            <span 
                              className={
                                expiryStatus === 'active' ? 'text-black' :
                                expiryStatus === 'expiring' ? 'text-orange-600 font-medium' : 'text-red-600 font-medium'
                              }
                            >
                              {formatDate(truck.expiry_date)}
                            </span>
                          </TableCell>
                          <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full shadow-sm ${
                              truck.status === 'active' ? 'bg-green-500' :
                              truck.status === 'empty' ? 'bg-orange-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                onClick={() => openEditDialog(truck)}
                                title="Edit truck"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                                onClick={() => handleDelete(truck.id)}
                                title="Delete truck"
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
              {filteredTrucks.map((truck) => (
                <div key={truck.id} className="bg-white border rounded-lg shadow-sm">
                  {/* Mobile Header - Always Visible */}
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer"
                    onClick={() => toggleCardExpansion(truck.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full shadow-sm ${
                        truck.status === 'active' ? 'bg-green-500' :
                        truck.status === 'empty' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">{truck.truck_number}</h3>
                        <p className="text-xs text-gray-500">Model: {truck.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(truck);
                          }}
                          title="Edit truck"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(truck.id);
                          }}
                          title="Delete truck"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                      <ChevronDown 
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          expandedCards.has(truck.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Mobile Details - Expandable */}
                  {expandedCards.has(truck.id) && (
                    <div className="px-3 pb-3 border-t bg-gray-50">
                      <div className="grid grid-cols-1 gap-2 pt-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Model:</span>
                          <span className="text-sm text-gray-900">{truck.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Expiry Date:</span>
                          <span className={`text-sm ${
                            getExpiryStatus(truck.expiry_date) === 'active' ? 'text-black' :
                            getExpiryStatus(truck.expiry_date) === 'expiring' ? 'text-orange-600 font-medium' : 'text-red-600 font-medium'
                          }`}>{formatDate(truck.expiry_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Status:</span>
                          <span className="text-sm text-gray-900 capitalize">{truck.status}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
        <FloatingMenuButton />
      </div>
    </SidebarProvider>
  );
};

export default Trucks;
