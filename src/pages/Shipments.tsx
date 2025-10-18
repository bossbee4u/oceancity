import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Edit3, UserX, Package, Truck, MapPin, ChevronDown, Check, ChevronsUpDown, Search, Filter, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { Shipment, Driver, Truck, Trailer, Company } from "@/types/database";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AppSidebar } from "@/components/AppSidebar";
import { FloatingMenuButton } from "@/components/FloatingMenuButton";

interface ShipmentWithRelations extends Shipment {
  driver?: Driver;
  truck?: Truck;
  trailer?: Trailer;
  company?: Company;
  customer?: Company;
}

export default function Shipments() {
  const [shipments, setShipments] = useState<ShipmentWithRelations[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<ShipmentWithRelations | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [driverSearchOpen, setDriverSearchOpen] = useState(false);
  const [driverSearchValue, setDriverSearchValue] = useState("");
  
  // Filter states
  const [activeFilters, setActiveFilters] = useState({
    status: [] as string[],
    dateRange: "" as string
  });
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    doc_no: "",
    loading_date: "",
    driver_id: "",
    truck_id: "",
    trailer_id: "",
    company_id: "",
    customer_id: "",
    origin: "",
    destination: "",
    amount: "",
    gross_weight: "",
    net_weight: "",
    status: "waiting" as "waiting" | "submitted"
  });

  useEffect(() => {
    fetchShipments();
    fetchRelatedData();
  }, []);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from("shipments")
        .select(`
          *,
          driver:drivers(*),
          truck:trucks(*),
          trailer:trailers(*),
          company:companies!shipments_company_id_fkey(*),
          customer:companies!shipments_customer_id_fkey(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch shipments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      const [driversRes, trucksRes, trailersRes, companiesRes] = await Promise.all([
        supabase.from("drivers").select("*").eq("status", "active"),
        supabase.from("trucks").select("*").eq("status", "active"),
        supabase.from("trailers").select("*").eq("status", "active"),
        supabase.from("companies").select("*")
      ]);

      if (driversRes.error) throw driversRes.error;
      if (trucksRes.error) throw trucksRes.error;
      if (trailersRes.error) throw trailersRes.error;
      if (companiesRes.error) throw companiesRes.error;

      setDrivers(driversRes.data || []);
      setTrucks(trucksRes.data || []);
      setTrailers(trailersRes.data || []);
      setCompanies(companiesRes.data || []);
    } catch (error) {
      console.error("Error fetching related data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const shipmentData = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        gross_weight: formData.gross_weight ? parseFloat(formData.gross_weight) : null,
        net_weight: formData.net_weight ? parseFloat(formData.net_weight) : null,
        driver_id: formData.driver_id || null,
        truck_id: formData.truck_id || null,
        trailer_id: formData.trailer_id || null,
        customer_id: formData.customer_id || null,
      };

      if (editingShipment) {
        const { error } = await supabase
          .from("shipments")
          .update(shipmentData)
          .eq("id", editingShipment.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Shipment updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("shipments")
          .insert([shipmentData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Shipment created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingShipment(null);
      resetForm();
      fetchShipments();
    } catch (error: unknown) {
      console.error("Error saving shipment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save shipment",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (shipment: ShipmentWithRelations) => {
    setEditingShipment(shipment);
    setFormData({
      doc_no: shipment.doc_no,
      loading_date: shipment.loading_date,
      driver_id: shipment.driver_id || "",
      truck_id: shipment.truck_id || "",
      trailer_id: shipment.trailer_id || "",
      company_id: shipment.company_id,
      customer_id: shipment.customer_id || "",
      origin: shipment.origin,
      destination: shipment.destination,
      amount: shipment.amount?.toString() || "",
      gross_weight: shipment.gross_weight?.toString() || "",
      net_weight: shipment.net_weight?.toString() || "",
      status: shipment.status
    });
    
    // Set driver search value for editing
    if (shipment.driver_id && shipment.driver) {
      setDriverSearchValue(`${shipment.driver.code} - ${shipment.driver.full_name}`);
    } else {
      setDriverSearchValue("");
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("shipments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shipment deleted successfully",
      });
      fetchShipments();
    } catch (error: unknown) {
      console.error("Error deleting shipment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete shipment",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      doc_no: "",
      loading_date: "",
      driver_id: "",
      truck_id: "",
      trailer_id: "",
      company_id: "",
      customer_id: "",
      origin: "",
      destination: "",
      amount: "",
      gross_weight: "",
      net_weight: "",
      status: "waiting"
    });
    setDriverSearchValue("");
  };

  const handleDriverSelect = (driverId: string) => {
    const selectedDriver = drivers.find(driver => driver.id === driverId);
    if (selectedDriver) {
      setFormData(prev => ({
        ...prev,
        driver_id: driverId,
        truck_id: selectedDriver.truck_id || "",
        trailer_id: selectedDriver.trailer_id || ""
      }));
      setDriverSearchValue(`${selectedDriver.code} - ${selectedDriver.full_name}`);
      setDriverSearchOpen(false);
    }
  };

  const getDateRange = (range: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case "today":
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case "thisWeek":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return { start: startOfWeek, end: endOfWeek };
      case "lastWeek":
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 7);
        return { start: lastWeekStart, end: lastWeekEnd };
      case "thisMonth":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return { start: startOfMonth, end: endOfMonth };
      case "previousMonth":
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: prevMonthStart, end: prevMonthEnd };
      default:
        return null;
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    // Search filter
    const searchMatch = searchTerm === '' || 
      shipment.doc_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.company?.short_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.driver?.full_name.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter - if no filters selected, show all
    const statusMatch = activeFilters.status.length === 0 || 
      activeFilters.status.includes(shipment.status);

    // Date filter
    let dateMatch = true;
    if (activeFilters.dateRange) {
      const dateRange = getDateRange(activeFilters.dateRange);
      if (dateRange) {
        const shipmentDate = new Date(shipment.loading_date);
        dateMatch = shipmentDate >= dateRange.start && shipmentDate < dateRange.end;
      }
    }

    return searchMatch && statusMatch && dateMatch;
  });

  const toggleCardExpansion = (shipmentId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shipmentId)) {
        newSet.delete(shipmentId);
      } else {
        newSet.add(shipmentId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="secondary">Waiting</Badge>;
      case "submitted":
        return <Badge variant="default">Submitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "waiting":
        return <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" title="Waiting"></div>;
      case "submitted":
        return <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" title="Submitted"></div>;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-500 shadow-sm" title={status}></div>;
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        size="lg" 
        message="Loading shipments..." 
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
                <h1 className="text-xl font-semibold">Shipments</h1>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setEditingShipment(null); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Shipment
                  </Button>
                </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingShipment ? "Edit Shipment" : "Add New Shipment"}
              </DialogTitle>
              <DialogDescription>
                {editingShipment ? "Update shipment details" : "Create a new shipment entry"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doc_no">Document Number *</Label>
                  <Input
                    id="doc_no"
                    value={formData.doc_no}
                    onChange={(e) => setFormData({ ...formData, doc_no: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loading_date">Loading Date *</Label>
                  <Input
                    id="loading_date"
                    type="date"
                    value={formData.loading_date}
                    onChange={(e) => setFormData({ ...formData, loading_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">Origin *</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination *</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_id">Company *</Label>
                  <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
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
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driver_id">Driver *</Label>
                  <Popover open={driverSearchOpen} onOpenChange={setDriverSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={driverSearchOpen}
                        className="w-full justify-between"
                      >
                        {driverSearchValue || "Select driver..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search drivers..." />
                        <CommandList>
                          <CommandEmpty>No driver found.</CommandEmpty>
                          <CommandGroup>
                            {drivers.map((driver) => (
                              <CommandItem
                                key={driver.id}
                                value={`${driver.code} - ${driver.full_name}`}
                                onSelect={() => handleDriverSelect(driver.id)}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    formData.driver_id === driver.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {driver.code} - {driver.full_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="truck_display">Assigned Truck</Label>
                  <Input
                    id="truck_display"
                    value={
                      formData.truck_id 
                        ? trucks.find(truck => truck.id === formData.truck_id)?.truck_number + " - " + 
                          trucks.find(truck => truck.id === formData.truck_id)?.type || "Unknown Truck"
                        : "No truck assigned"
                    }
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trailer_display">Assigned Trailer</Label>
                  <Input
                    id="trailer_display"
                    value={
                      formData.trailer_id 
                        ? trailers.find(trailer => trailer.id === formData.trailer_id)?.trailer_number + " - " + 
                          trailers.find(trailer => trailer.id === formData.trailer_id)?.type || "Unknown Trailer"
                        : "No trailer assigned"
                    }
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gross_weight">Gross Weight</Label>
                  <Input
                    id="gross_weight"
                    type="number"
                    step="0.01"
                    value={formData.gross_weight}
                    onChange={(e) => setFormData({ ...formData, gross_weight: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="net_weight">Net Weight</Label>
                  <Input
                    id="net_weight"
                    type="number"
                    step="0.01"
                    value={formData.net_weight}
                    onChange={(e) => setFormData({ ...formData, net_weight: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value: "waiting" | "submitted") => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingShipment ? "Update" : "Create"} Shipment
                </Button>
              </DialogFooter>
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
                      placeholder="Search shipments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filter and Clear Filters Buttons */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {/* Filter Button */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="relative">
                        <Filter className="h-4 w-4" />
                        {(activeFilters.status.length > 0 || activeFilters.dateRange) && (
                          <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                            {activeFilters.status.length + (activeFilters.dateRange ? 1 : 0)}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-4">
                    {/* Date Filter */}
                    <div>
                      <h4 className="font-medium text-sm mb-3">Date Range</h4>
                      <div className="space-y-2">
                        {[
                          { value: "today", label: "Today" },
                          { value: "thisWeek", label: "This Week" },
                          { value: "lastWeek", label: "Last Week" },
                          { value: "thisMonth", label: "This Month" },
                          { value: "previousMonth", label: "Previous Month" }
                        ].map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`date-${option.value}`}
                              checked={activeFilters.dateRange === option.value}
                              onCheckedChange={(checked) => {
                                setActiveFilters(prev => ({
                                  ...prev,
                                  dateRange: checked ? option.value : ""
                                }));
                              }}
                            />
                            <label
                              htmlFor={`date-${option.value}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <h4 className="font-medium text-sm mb-3">Status</h4>
                      <div className="space-y-2">
                        {["waiting", "submitted"].map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              id={`status-${status}`}
                              checked={activeFilters.status.includes(status)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setActiveFilters(prev => ({
                                    ...prev,
                                    status: [...prev.status, status]
                                  }));
                                } else {
                                  setActiveFilters(prev => ({
                                    ...prev,
                                    status: prev.status.filter(s => s !== status)
                                  }));
                                }
                              }}
                            />
                            <label
                              htmlFor={`status-${status}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                            >
                              {status}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear Filters Button */}
              {(activeFilters.status.length > 0 || activeFilters.dateRange || searchTerm) && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    setSearchTerm('');
                    setActiveFilters({ status: [], dateRange: "" });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {filteredShipments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No shipments found
                </div>
              ) : (
                filteredShipments.map((shipment) => (
                  <div key={shipment.id} className="bg-white border rounded-lg shadow-sm">
                    {/* Mobile Header - Always Visible */}
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer"
                      onClick={() => toggleCardExpansion(shipment.id)}
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIndicator(shipment.status)}
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{shipment.driver?.full_name || "No Driver"}</h3>
                          <p className="text-xs text-gray-500">Doc: {shipment.doc_no}</p>
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
                              handleEdit(shipment);
                            }}
                            title="Edit shipment"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                title="Delete shipment"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the shipment.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(shipment.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform ${
                            expandedCards.has(shipment.id) ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                    
                    {/* Mobile Details - Expandable */}
                    {expandedCards.has(shipment.id) && (
                      <div className="px-3 pb-3 border-t bg-gray-50">
                        <div className="grid grid-cols-1 gap-2 pt-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">Route:</span>
                            <span className="text-sm text-gray-900 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {shipment.origin} → {shipment.destination}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">Loading Date:</span>
                            <span className="text-sm text-gray-900">
                              {formatDate(shipment.loading_date)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">Truck:</span>
                            <span className="text-sm text-gray-900">
                              {shipment.truck ? shipment.truck.truck_number : "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">Amount:</span>
                            <span className="text-sm text-gray-900">
                              {shipment.amount ? `AED ${shipment.amount.toFixed(2)}` : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doc No</TableHead>
                  <TableHead>Loading Date</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No shipments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{shipment.doc_no}</TableCell>
                      <TableCell>{formatDate(shipment.loading_date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {shipment.origin} → {shipment.destination}
                        </div>
                      </TableCell>
                      <TableCell>{shipment.driver?.full_name || "-"}</TableCell>
                      <TableCell>
                        {shipment.truck ? (
                          <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {shipment.truck.truck_number}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{shipment.amount ? `AED ${shipment.amount.toFixed(2)}` : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getStatusIndicator(shipment.status)}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={() => handleEdit(shipment)}
                            title="Edit shipment"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Delete shipment"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the shipment.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(shipment.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          </div>
        </main>
        <FloatingMenuButton />
      </div>
    </SidebarProvider>
  );
}