import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, Edit3, UserX, ChevronDown, ChevronUp } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { FloatingMenuButton } from '@/components/FloatingMenuButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Company } from '@/types/database';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    short_name: '',
    full_name: '',
  });

  // Fetch companies from database
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Filter companies based on search term
  const filteredCompanies = companies.filter(company =>
    company.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCompany) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            short_name: formData.short_name,
            full_name: formData.full_name,
          })
          .eq('id', editingCompany.id);

        if (error) throw error;
        toast.success('Company updated successfully');
      } else {
        // Create new company
        const { error } = await supabase
          .from('companies')
          .insert([{
            short_name: formData.short_name,
            full_name: formData.full_name,
          }]);

        if (error) throw error;
        toast.success('Company created successfully');
      }

      setIsDialogOpen(false);
      setEditingCompany(null);
      setFormData({ short_name: '', full_name: '' });
      fetchCompanies();
    } catch (error: unknown) {
      console.error('Error saving company:', error);
      toast.error('Failed to save company');
    }
  };

  // Handle delete company
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Company deleted successfully');
      fetchCompanies();
    } catch (error: unknown) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    }
  };

  // Handle edit company
  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      short_name: company.short_name || '',
      full_name: company.full_name || '',
    });
    setIsDialogOpen(true);
  };

  // Handle add new company
  const handleAddNew = () => {
    setEditingCompany(null);
    setFormData({ short_name: '', full_name: '' });
    setIsDialogOpen(true);
  };

  // Toggle card expansion
  const toggleCardExpansion = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card border-b border-border">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Companies</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCompany ? 'Edit Company' : 'Add New Company'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="short_name">Short Name</Label>
                    <Input
                      id="short_name"
                      value={formData.short_name}
                      onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                      placeholder="Enter company short name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter company full name"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingCompany ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <LoadingSpinner 
              size="md" 
              message="Loading companies..." 
              fullScreen={false} 
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Short Name</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <Badge variant="outline">{company.code}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{company.short_name}</TableCell>
                        <TableCell>{company.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(company.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              onClick={() => handleEdit(company)}
                              title="Edit company"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                              onClick={() => handleDelete(company.id)}
                              title="Delete company"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredCompanies.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No companies found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2">
                {filteredCompanies.map((company) => {
                  const isExpanded = expandedCards.has(company.id);
                  return (
                    <div key={company.id} className="bg-white border rounded-lg shadow-sm">
                        <div 
                          className="flex items-center justify-between p-3 cursor-pointer"
                          onClick={() => toggleCardExpansion(company.id)}
                        >
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <div>
                                <h3 className="font-medium text-gray-900 text-sm">{company.short_name}</h3>
                                <p className="text-xs text-gray-500">Code: {company.code}</p>
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
                                    handleEdit(company);
                                  }}
                                  title="Edit company"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(company.id);
                                  }}
                                  title="Delete company"
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              </div>
                              <ChevronDown 
                                className={`h-4 w-4 text-gray-400 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="px-3 pb-3 border-t bg-gray-50">
                              <div className="grid grid-cols-1 gap-2 pt-3">
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium text-gray-600">Full Name:</span>
                                  <span className="text-sm text-gray-900">{company.full_name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium text-gray-600">Created:</span>
                                  <span className="text-sm text-gray-900">{formatDate(company.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                    </div>
                  );
                })}
                {filteredCompanies.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No companies found
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <FloatingMenuButton />
      </div>
    </SidebarProvider>
  );
}