import React, { useState, useEffect } from 'react';
import { Plus, Search, UserCog, Edit3, UserX, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/database';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'manager' as 'admin' | 'manager',
  });
  const [usernameError, setUsernameError] = useState('');
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [usernameValidationStatus, setUsernameValidationStatus] = useState<'idle' | 'checking' | 'available' | 'exists'>('idle');

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data || []).map(user => ({
        ...user,
        role: user.role as 'admin' | 'manager'
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Cleanup timeout on unmount
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  // Validate username uniqueness
  const validateUsername = async (username: string) => {
    if (!username.trim()) {
      setUsernameError('');
      setUsernameValidationStatus('idle');
      return true;
    }

    setIsValidatingUsername(true);
    setUsernameValidationStatus('checking');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', username.trim())
        .limit(1);

      if (error) throw error;

      // If editing, exclude current user from uniqueness check
      const existingUser = data?.[0];
      
      if (existingUser && (!editingUser || existingUser.id !== editingUser.id)) {
        setUsernameError('Username already exists. Please choose a different username.');
        setUsernameValidationStatus('exists');
        return false;
      }

      setUsernameError('');
      setUsernameValidationStatus('available');
      return true;
    } catch (error) {
      console.error('Error validating username:', error);
      setUsernameError('Error validating username. Please try again.');
      setUsernameValidationStatus('idle');
      return false;
    } finally {
      setIsValidatingUsername(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username before submission (final check to minimize race conditions)
    const isUsernameValid = await validateUsername(formData.username);
    if (!isUsernameValid) {
      return;
    }
    
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            username: formData.username,
            full_name: formData.full_name,
            email: formData.email,
            role: formData.role,
          })
          .eq('id', editingUser.id);

        if (error) throw error;
        toast.success('User updated successfully');
      } else {
        // Create new authenticated user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: null, // Disable email verification redirect
            data: {
              username: formData.username,
              full_name: formData.full_name,
              role: formData.role,
            }
          }
        });

        if (authError) {
          // Handle specific auth errors
          if (authError.message?.includes('User already registered')) {
            throw new Error('A user with this email already exists');
          }
          throw authError;
        }

        if (authData.user) {
          // Update the user's profile with additional information
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              username: formData.username,
              full_name: formData.full_name,
              email: formData.email,
              role: formData.role,
            });

          if (profileError) throw profileError;

          toast.success('User created successfully! They can now log in with their credentials.');
        }
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({ username: '', full_name: '', email: '', password: '', role: 'manager' });
      setUsernameError('');
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error saving user:', error);
      
      // Handle specific errors
      if (error?.message?.includes('User already registered') || error?.message?.includes('email already exists')) {
        toast.error('A user with this email already exists.');
      } else if (error?.code === '23505' && error?.message?.includes('profiles_username_key')) {
        setUsernameError('Username already exists. Please choose a different username.');
        toast.error('Username already exists. Please choose a different username.');
      } else if (error?.message?.includes('Password should be at least 6 characters')) {
        toast.error('Password should be at least 6 characters long.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to save user. Please try again.');
      }
    }
  };

  // Handle delete user
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Handle edit user
  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'manager',
      password: '', // Always empty for editing users
    });
    setUsernameError('');
    setUsernameValidationStatus('idle');
    setIsDialogOpen(true);
  };

  // Handle add new user
  const handleAddNew = () => {
    setEditingUser(null);
    setFormData({ username: '', full_name: '', email: '', role: 'manager', password: '' });
    setUsernameError('');
    setUsernameValidationStatus('idle');
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
              <h1 className="text-xl font-semibold">Users</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => {
                          const newUsername = e.target.value;
                          setFormData({ ...formData, username: newUsername });
                          
                          // Clear previous error and timeout
                          setUsernameError('');
                          setUsernameValidationStatus('idle');
                          if (validationTimeout) {
                            clearTimeout(validationTimeout);
                          }
                          
                          // Debounced validation
                          if (newUsername.trim()) {
                            const timeout = setTimeout(() => validateUsername(newUsername), 500);
                            setValidationTimeout(timeout);
                          }
                        }}
                        placeholder="Enter username"
                        className={`pr-10 ${
                          usernameValidationStatus === 'exists' 
                            ? 'border-orange-500 focus:border-orange-500' 
                            : usernameValidationStatus === 'available'
                            ? 'border-green-500 focus:border-green-500'
                            : usernameError 
                            ? 'border-red-500 focus:border-red-500' 
                            : ''
                        }`}
                        required
                      />
                      {/* Validation status icon */}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {usernameValidationStatus === 'checking' && (
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        )}
                        {usernameValidationStatus === 'available' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {usernameValidationStatus === 'exists' && (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                    {/* Status messages */}
                    {usernameValidationStatus === 'checking' && (
                      <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Checking username availability...
                      </p>
                    )}
                    {usernameValidationStatus === 'available' && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Username is available
                      </p>
                    )}
                    {usernameValidationStatus === 'exists' && (
                      <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Username already exists. Please choose a different username.
                      </p>
                    )}
                    {usernameError && usernameValidationStatus === 'idle' && (
                      <p className="text-sm text-red-600 mt-1">{usernameError}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  {!editingUser && (
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password"
                        required
                        minLength={6}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Minimum 6 characters required
                      </p>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value: 'admin' | 'manager') => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={!!usernameError || isValidatingUsername}
                    >
                      {editingUser ? 'Update' : 'Create'}
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <LoadingSpinner 
              size="md" 
              message="Loading users..." 
              fullScreen={false} 
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${
                            user.role === 'admin' 
                              ? 'text-blue-700 bg-blue-50 px-2 py-1 rounded-md' 
                              : 'text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md'
                          }`}>
                            {user.role === 'admin' ? 'Administrator' : 'Manager'}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              onClick={() => handleEdit(user)}
                              title="Edit user"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                              onClick={() => handleDelete(user.id)}
                              title="Delete user"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2">
                {filteredUsers.map((user) => {
                  const isExpanded = expandedCards.has(user.id);
                  return (
                    <div key={user.id} className="bg-white border rounded-lg shadow-sm">
                        <div 
                          className="flex items-center justify-between p-3 cursor-pointer"
                          onClick={() => toggleCardExpansion(user.id)}
                        >
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${user.role === 'admin' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                              <div>
                                <h3 className="font-medium text-gray-900 text-sm">{user.username}</h3>
                                <p className="text-xs text-gray-500">{user.full_name}</p>
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
                                    handleEdit(user);
                                  }}
                                  title="Edit user"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(user.id);
                                  }}
                                  title="Delete user"
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
                                  <span className="text-sm text-gray-900">{user.full_name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium text-gray-600">Email:</span>
                                  <span className="text-sm text-gray-900">{user.email}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium text-gray-600">Created:</span>
                                  <span className="text-sm text-gray-900">{formatDate(user.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                    </div>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
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