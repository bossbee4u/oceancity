import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Driver, Truck, Trailer, Company } from '@/types/database';
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
import { Plus, Pencil, Trash2, Search, X, Edit3, UserX, ChevronDown, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { FloatingMenuButton } from '@/components/FloatingMenuButton';

const Drivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    driverStatus: [] as string[],
    waqalaStatus: [] as string[],
    gatepassStatus: [] as string[]
  });
  
  // Mobile view state
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    code: '',
    full_name: '',
    phone: '',
    gatepass: '',
    waqala: '',
    truck_id: '',
    trailer_id: '',
    company_id: '',
    status: 'active' as 'active' | 'vacation' | 'cancelled',
  });

  // Confirmation dialog state for reassignment
  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    type: '' as 'truck' | 'trailer' | '',
    vehicleId: '',
    vehicleName: '',
    currentDriverName: '',
    newAssignment: { truck_id: '', trailer_id: '' }
  });

  useEffect(() => {
    fetchDrivers();
    fetchTrucks();
    fetchTrailers();
    fetchCompanies();
  }, []);

  // Helper function to calculate document status based on date
  const getDocumentStatus = (dateString: string | null): 'active' | 'expiring' | 'expired' => {
    if (!dateString) return 'expired';
    
    const docDate = new Date(dateString);
    const today = new Date();
    const diffTime = docDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'expiring'; // Expiring within 30 days
    return 'active';
  };

  // Helper function to get status badge for document status
  const getDocumentStatusBadge = (status: 'active' | 'expiring' | 'expired') => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: 'default',
      expiring: 'secondary',
      expired: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        trucks:truck_id(truck_number),
        trailers:trailer_id(trailer_number),
        companies:company_id(short_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching drivers');
    } else {
      setDrivers(data as any[] || []);
    }
  };

  const fetchTrucks = async () => {
    const { data, error } = await supabase
      .from('trucks')
      .select('id, truck_number')
      .eq('status', 'active')
      .order('truck_number');

    if (error) {
      toast.error('Error fetching trucks');
    } else {
      setTrucks(data || []);
    }
  };

  const fetchTrailers = async () => {
    const { data, error } = await supabase
      .from('trailers')
      .select('id, trailer_number')
      .eq('status', 'active')
      .order('trailer_number');

    if (error) {
      toast.error('Error fetching trailers');
    } else {
      setTrailers(data || []);
    }
  };

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, short_name, full_name')
      .order('short_name');

    if (error) {
      toast.error('Error fetching companies');
    } else {
      setCompanies(data || []);
    }
  };

  // Check if truck or trailer is already assigned to another driver
  const checkExistingAssignment = async (vehicleType: 'truck' | 'trailer', vehicleId: string) => {
    if (!vehicleId) return null;

    const column = vehicleType === 'truck' ? 'truck_id' : 'trailer_id';
    const { data, error } = await supabase
      .from('drivers')
      .select('id, full_name, code')
      .eq(column, vehicleId)
      .neq('id', editingDriver?.id || ''); // Exclude current driver if editing

    if (error) {
      console.error('Error checking assignment:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  };

  // Handle truck/trailer selection with confirmation
  const handleVehicleSelection = async (vehicleType: 'truck' | 'trailer', vehicleId: string) => {
    if (!vehicleId) {
      // If clearing selection, just update form data
      setFormData(prev => ({
        ...prev,
        [vehicleType === 'truck' ? 'truck_id' : 'trailer_id']: ''
      }));
      return;
    }

    // Check if vehicle is already assigned
    const existingAssignment = await checkExistingAssignment(vehicleType, vehicleId);
    
    if (existingAssignment) {
      // Get vehicle name
      const vehicleList = vehicleType === 'truck' ? trucks : trailers;
      const vehicle = vehicleList.find(v => v.id === vehicleId);
      const vehicleName = vehicleType === 'truck' 
        ? (vehicle as any)?.truck_number 
        : (vehicle as any)?.trailer_number;

      // Show confirmation dialog
      setConfirmationDialog({
        isOpen: true,
        type: vehicleType,
        vehicleId,
        vehicleName: vehicleName || 'Unknown',
        currentDriverName: `${existingAssignment.code} - ${existingAssignment.full_name}`,
        newAssignment: {
          truck_id: vehicleType === 'truck' ? vehicleId : formData.truck_id,
          trailer_id: vehicleType === 'trailer' ? vehicleId : formData.trailer_id
        }
      });
    } else {
      // No conflict, update form data directly
      setFormData(prev => ({
        ...prev,
        [vehicleType === 'truck' ? 'truck_id' : 'trailer_id']: vehicleId
      }));
    }
  };

  // Handle confirmation dialog approval
  const handleConfirmReassignment = async () => {
    const { type, vehicleId, newAssignment } = confirmationDialog;
    
    try {
      // Find the current driver who has this vehicle assigned
      const column = type === 'truck' ? 'truck_id' : 'trailer_id';
      const { data: currentDrivers, error: findError } = await supabase
        .from('drivers')
        .select('id')
        .eq(column, vehicleId)
        .neq('id', editingDriver?.id || '');

      if (findError) throw findError;

      // Remove vehicle from current driver(s)
      if (currentDrivers && currentDrivers.length > 0) {
        for (const driver of currentDrivers) {
          const updateData = { [column]: null };
          const { error: updateError } = await supabase
            .from('drivers')
            .update(updateData)
            .eq('id', driver.id);

          if (updateError) throw updateError;
        }
      }

      // Update form data with new assignment
      setFormData(prev => ({
        ...prev,
        truck_id: newAssignment.truck_id,
        trailer_id: newAssignment.trailer_id
      }));

      // Close confirmation dialog
      setConfirmationDialog({
        isOpen: false,
        type: '',
        vehicleId: '',
        vehicleName: '',
        currentDriverName: '',
        newAssignment: { truck_id: '', trailer_id: '' }
      });

      toast.success(`${type === 'truck' ? 'Truck' : 'Trailer'} reassigned successfully`);
      
      // Refresh drivers list to show updated assignments
      fetchDrivers();
    } catch (error: unknown) {
      toast.error(`Error reassigning ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Filtered drivers based on search and filter criteria
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      // Search filter (code, name, phone)
      const searchMatch = searchTerm === '' || 
        driver.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (driver.phone && driver.phone.toLowerCase().includes(searchTerm.toLowerCase()));

      // Driver status filter - if no filters selected, show all
      const statusMatch = activeFilters.driverStatus.length === 0 || 
        activeFilters.driverStatus.includes(driver.status);

      // Waqala status filter - if no filters selected, show all
      const waqalaStatus = getDocumentStatus(driver.waqala);
      const waqalaMatch = activeFilters.waqalaStatus.length === 0 || 
        activeFilters.waqalaStatus.includes(waqalaStatus);

      // Gatepass status filter - if no filters selected, show all
      const gatepassStatus = getDocumentStatus(driver.gatepass);
      const gatepassMatch = activeFilters.gatepassStatus.length === 0 || 
        activeFilters.gatepassStatus.includes(gatepassStatus);

      return searchMatch && statusMatch && waqalaMatch && gatepassMatch;
    });
  }, [drivers, searchTerm, activeFilters]);

  const clearFilters = () => {
    setSearchTerm('');
    setActiveFilters({
      driverStatus: [],
      waqalaStatus: [],
      gatepassStatus: []
    });
  };

  const hasActiveFilters = searchTerm !== '' || 
    activeFilters.driverStatus.length > 0 || 
    activeFilters.waqalaStatus.length > 0 || 
    activeFilters.gatepassStatus.length > 0;

  // Multi-filter helper functions
  const toggleFilter = (category: keyof typeof activeFilters, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const getActiveFilterCount = () => {
    return activeFilters.driverStatus.length + 
           activeFilters.waqalaStatus.length + 
           activeFilters.gatepassStatus.length;
  };

  // Toggle card expansion for mobile view
  const toggleCardExpansion = (driverId: string) => {
    const newExpandedCards = new Set(expandedCards);
    if (newExpandedCards.has(driverId)) {
      newExpandedCards.delete(driverId);
    } else {
      newExpandedCards.add(driverId);
    }
    setExpandedCards(newExpandedCards);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prepare data for submission, converting empty strings to null
      const submitData = {
        ...formData,
        gatepass: formData.gatepass || null,
        waqala: formData.waqala || null,
        truck_id: formData.truck_id || null,
        trailer_id: formData.trailer_id || null,
        company_id: formData.company_id || null,
      };

      if (editingDriver) {
        const { error } = await supabase
          .from('drivers')
          .update(submitData)
          .eq('id', editingDriver.id);

        if (error) throw error;
        toast.success('Driver updated successfully');
      } else {
        const { error } = await supabase
          .from('drivers')
          .insert([submitData]);

        if (error) throw error;
        toast.success('Driver created successfully');
      }

      setIsDialogOpen(false);
      setEditingDriver(null);
      setFormData({ code: '', full_name: '', phone: '', gatepass: '', waqala: '', truck_id: '', trailer_id: '', company_id: '', status: 'active' });
      fetchDrivers();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error saving driver');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    const { error } = await supabase.from('drivers').delete().eq('id', id);

    if (error) {
      toast.error('Error deleting driver');
    } else {
      toast.success('Driver deleted successfully');
      fetchDrivers();
    }
  };

  const openEditDialog = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      code: driver.code,
      full_name: driver.full_name,
      phone: driver.phone || '',
      gatepass: driver.gatepass ? new Date(driver.gatepass).toISOString().split('T')[0] : '',
      waqala: driver.waqala ? new Date(driver.waqala).toISOString().split('T')[0] : '',
      truck_id: driver.truck_id || '',
      trailer_id: driver.trailer_id || '',
      company_id: driver.company_id || '',
      status: driver.status,
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: 'default',
      vacation: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };



  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-40 bg-card border-b border-border">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Drivers</h1>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { 
                    setEditingDriver(null); 
                    setFormData({ code: '', full_name: '', phone: '', gatepass: '', waqala: '', truck_id: '', trailer_id: '', company_id: '', status: 'active' }); 
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Driver
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="code">Code</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gatepass">Gate Pass Date</Label>
                        <Input
                          id="gatepass"
                          type="date"
                          value={formData.gatepass}
                          onChange={(e) => setFormData({ ...formData, gatepass: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="waqala">Waqala Date</Label>
                        <Input
                          id="waqala"
                          type="date"
                          value={formData.waqala}
                          onChange={(e) => setFormData({ ...formData, waqala: e.target.value })}
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
                            <SelectItem value="vacation">Vacation</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="truck_id">Truck</Label>
                        <Select value={formData.truck_id || undefined} onValueChange={(value) => handleVehicleSelection('truck', value || '')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a truck (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {trucks.map((truck) => (
                              <SelectItem key={truck.id} value={truck.id}>
                                {truck.truck_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="trailer_id">Trailer</Label>
                        <Select value={formData.trailer_id || undefined} onValueChange={(value) => handleVehicleSelection('trailer', value || '')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a trailer (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {trailers.map((trailer) => (
                              <SelectItem key={trailer.id} value={trailer.id}>
                                {trailer.trailer_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="company_id">Company</Label>
                        <Select value={formData.company_id || undefined} onValueChange={(value) => setFormData({ ...formData, company_id: value || '' })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a company (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.short_name} - {company.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" className="w-full md:w-auto">
                        {editingDriver ? 'Update' : 'Create'} Driver
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <div className="p-6">
            {/* Search and Filter Section */}
            <div className="mb-6">
              <div className="flex gap-2 sm:gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search by code, name, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filter and Clear Filters Buttons */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {/* Multi-Filter Component */}
                  <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <Filter className="h-4 w-4" />
                      {getActiveFilterCount() > 0 && (
                        <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {getActiveFilterCount()}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="font-medium text-sm">Filter Options</div>
                      
                      {/* Driver Status Filters */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Driver Status</Label>
                        <div className="space-y-2">
                          {['active', 'vacation', 'cancelled'].map((status) => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox
                                id={`driver-${status}`}
                                checked={activeFilters.driverStatus.includes(status)}
                                onCheckedChange={() => toggleFilter('driverStatus', status)}
                              />
                              <Label
                                htmlFor={`driver-${status}`}
                                className="text-sm font-normal capitalize cursor-pointer"
                              >
                                {status}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Waqala Status Filters */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Waqala Status</Label>
                        <div className="space-y-2">
                          {['active', 'expiring', 'expired'].map((status) => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox
                                id={`waqala-${status}`}
                                checked={activeFilters.waqalaStatus.includes(status)}
                                onCheckedChange={() => toggleFilter('waqalaStatus', status)}
                              />
                              <Label
                                htmlFor={`waqala-${status}`}
                                className="text-sm font-normal capitalize cursor-pointer"
                              >
                                {status}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Gatepass Status Filters */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Gatepass Status</Label>
                        <div className="space-y-2">
                          {['active', 'expiring', 'expired'].map((status) => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox
                                id={`gatepass-${status}`}
                                checked={activeFilters.gatepassStatus.includes(status)}
                                onCheckedChange={() => toggleFilter('gatepassStatus', status)}
                              />
                              <Label
                                htmlFor={`gatepass-${status}`}
                                className="text-sm font-normal capitalize cursor-pointer"
                              >
                                {status}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <Button variant="outline" size="icon" onClick={clearFilters}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Gate Pass</TableHead>
                    <TableHead>Waqala</TableHead>
                    <TableHead>Truck</TableHead>
                    <TableHead>Trailer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.code}</TableCell>
                      <TableCell>{driver.full_name}</TableCell>
                      <TableCell>{driver.phone || '-'}</TableCell>
                      <TableCell>
                           <span className={`${
                             getDocumentStatus(driver.gatepass) === 'expired' ? 'text-red-500' :
                             getDocumentStatus(driver.gatepass) === 'expiring' ? 'text-orange-500' :
                             ''
                           }`}>
                             {formatDate(driver.gatepass)}
                           </span>
                         </TableCell>
                         <TableCell>
                           <span className={`${
                             getDocumentStatus(driver.waqala) === 'expired' ? 'text-red-500' :
                             getDocumentStatus(driver.waqala) === 'expiring' ? 'text-orange-500' :
                             ''
                           }`}>
                             {formatDate(driver.waqala)}
                           </span>
                         </TableCell>
                      <TableCell>{(driver as any).trucks?.truck_number || '-'}</TableCell>
                      <TableCell>{(driver as any).trailers?.trailer_number || '-'}</TableCell>
                      <TableCell>{(driver as any).companies?.short_name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${
                            driver.status === 'active' ? 'bg-green-500' :
                            driver.status === 'vacation' ? 'bg-orange-500' :
                            driver.status === 'cancelled' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}></div>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              onClick={() => openEditDialog(driver)}
                              title="Edit driver"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                              onClick={() => handleDelete(driver.id)}
                              title="Delete driver"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredDrivers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {hasActiveFilters ? 'No drivers match the current filters.' : 'No drivers found.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {filteredDrivers.map((driver) => (
                <div key={driver.id} className="bg-white border rounded-lg shadow-sm">
                  {/* Mobile Header - Always Visible */}
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer"
                    onClick={() => toggleCardExpansion(driver.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full shadow-sm ${
                        driver.status === 'active' ? 'bg-green-500' :
                        driver.status === 'vacation' ? 'bg-orange-500' :
                        driver.status === 'cancelled' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">{driver.full_name}</h3>
                        <p className="text-xs text-gray-500">Code: {driver.code}</p>
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
                            openEditDialog(driver);
                          }}
                          title="Edit driver"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(driver.id);
                          }}
                          title="Delete driver"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                      <ChevronDown 
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          expandedCards.has(driver.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Mobile Details - Expandable */}
                  {expandedCards.has(driver.id) && (
                    <div className="px-3 pb-3 border-t bg-gray-50">
                      <div className="grid grid-cols-1 gap-2 pt-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Phone:</span>
                          <span className="text-sm text-gray-900">{driver.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Gate Pass:</span>
                          <span className={`text-sm ${
                            getDocumentStatus(driver.gatepass) === 'expired' ? 'text-red-500' :
                            getDocumentStatus(driver.gatepass) === 'expiring' ? 'text-orange-500' :
                            'text-gray-900'
                          }`}>
                            {formatDate(driver.gatepass)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Waqala:</span>
                          <span className={`text-sm ${
                            getDocumentStatus(driver.waqala) === 'expired' ? 'text-red-500' :
                            getDocumentStatus(driver.waqala) === 'expiring' ? 'text-orange-500' :
                            'text-gray-900'
                          }`}>
                            {formatDate(driver.waqala)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Truck:</span>
                          <span className="text-sm text-gray-900">{(driver as any).trucks?.truck_number || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Trailer:</span>
                          <span className="text-sm text-gray-900">{(driver as any).trailers?.trailer_number || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Company:</span>
                          <span className="text-sm text-gray-900">{(driver as any).companies?.short_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Status:</span>
                          <span className="text-sm text-gray-900 capitalize">{driver.status}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {filteredDrivers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {hasActiveFilters ? 'No drivers match the current filters.' : 'No drivers found.'}
                </div>
              )}
            </div>
          </div>
        </main>
        <FloatingMenuButton />

        {/* Confirmation Dialog for Vehicle Reassignment */}
        <Dialog open={confirmationDialog.isOpen} onOpenChange={(open) => {
          if (!open) {
            setConfirmationDialog({
              isOpen: false,
              type: '',
              vehicleId: '',
              vehicleName: '',
              currentDriverName: '',
              newAssignment: { truck_id: '', trailer_id: '' }
            });
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Vehicle Reassignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The {confirmationDialog.type} <strong>{confirmationDialog.vehicleName}</strong> is currently assigned to:
              </p>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{confirmationDialog.currentDriverName}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Do you want to reassign this {confirmationDialog.type} to the current driver? This will remove it from the previous driver.
              </p>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmationDialog({
                    isOpen: false,
                    type: '',
                    vehicleId: '',
                    vehicleName: '',
                    currentDriverName: '',
                    newAssignment: { truck_id: '', trailer_id: '' }
                  })}
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmReassignment}>
                  Reassign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default Drivers;
