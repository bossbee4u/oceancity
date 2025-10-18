import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { FloatingMenuButton } from '@/components/FloatingMenuButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Calendar, Shield, Edit3, Save, X, Camera, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

const Profile = () => {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setIsEditing(false);
      
      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        email: profile.email || '',
      });
    }
    setIsEditing(false);
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const getPasswordValidationStatus = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      allValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { percentage: 0, color: 'bg-gray-200', label: '' };
    
    const validation = getPasswordValidationStatus(password);
    const validCount = [
      validation.minLength,
      validation.hasUpperCase,
      validation.hasLowerCase,
      validation.hasNumbers,
      validation.hasSpecialChar
    ].filter(Boolean).length;
    
    const percentage = (validCount / 5) * 100;
    
    if (percentage <= 20) return { percentage, color: 'bg-red-500', label: 'Very Weak' };
    if (percentage <= 40) return { percentage, color: 'bg-red-400', label: 'Weak' };
    if (percentage <= 60) return { percentage, color: 'bg-orange-500', label: 'Fair' };
    if (percentage <= 80) return { percentage, color: 'bg-orange-400', label: 'Good' };
    return { percentage, color: 'bg-green-500', label: 'Strong' };
  };

  const handleChangePassword = async () => {
    if (!user) return;

    // Validate passwords
    const passwordError = validatePassword(passwordData.newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    setPasswordLoading(true);
    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        return;
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success('Password changed successfully');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setImageUploading(true);
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      // Delete existing profile image if it exists
      if (profile.profile_image_url) {
        const oldFileName = profile.profile_image_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('profile-images')
            .remove([`${user.id}/${oldFileName}`]);
        }
      }

      // Upload the new image
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // Update the profile with the new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success('Profile image updated successfully');
      setImagePreview(null); // Clear preview
      
      // Refresh the page to show the new image
      window.location.reload();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      setImagePreview(null); // Clear preview on error
    } finally {
      setImageUploading(false);
    }
  };

  if (!profile) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-40 bg-card border-b border-border">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Profile</h1>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={loading} className="gap-2">
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={loading} className="gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </header>

          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Profile Header */}
              <div className="flex items-center space-x-6 pb-6 border-b border-border">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={imagePreview || profile?.profile_image_url} alt={profile?.full_name} />
                    <AvatarFallback className="text-xl">
                      {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="h-10 w-10" />}
                    </AvatarFallback>
                  </Avatar>
                  {imagePreview && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        id="profile-image-upload"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="absolute -bottom-2 -right-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 rounded-full p-0"
                          onClick={() => document.getElementById('profile-image-upload')?.click()}
                          disabled={imageUploading}
                        >
                          {imageUploading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </Button>
                        {imagePreview && !imageUploading && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => setImagePreview(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">{profile.full_name}</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                      <Shield className="h-3 w-3" />
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Enter your full name"
                        className="h-12"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{profile.full_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    {isEditing ? (
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Enter your username"
                        className="h-12"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <span className="text-sm">@{profile.username}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter your email"
                        className="h-12"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{profile.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{profile.role}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Change Password Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">Security</h3>
                  </div>
                  {!isChangingPassword && (
                    <Button
                      onClick={() => setIsChangingPassword(true)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Change Password
                    </Button>
                  )}
                </div>

                {isChangingPassword ? (
                  <div className="space-y-6 p-6 border rounded-lg bg-card">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            placeholder="Enter your current password"
                            className="h-12 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            placeholder="Enter your new password"
                            className="h-12 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                         {passwordData.newPassword && (
                           <div className="mt-3 space-y-2">
                             {(() => {
                               const strength = getPasswordStrength(passwordData.newPassword);
                               return (
                                 <div className="space-y-2">
                                   <div className="flex justify-between items-center">
                                     <span className="text-xs text-muted-foreground">Password Strength</span>
                                     <span className={`text-xs font-medium ${
                                       strength.percentage <= 20 ? 'text-red-500' :
                                       strength.percentage <= 40 ? 'text-red-400' :
                                       strength.percentage <= 60 ? 'text-orange-500' :
                                       strength.percentage <= 80 ? 'text-orange-400' :
                                       'text-green-500'
                                     }`}>
                                       {strength.label}
                                     </span>
                                   </div>
                                   <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                     <div 
                                       className={`h-full transition-all duration-300 ${
                                         strength.percentage <= 20 ? 'bg-red-500' :
                                         strength.percentage <= 40 ? 'bg-red-400' :
                                         strength.percentage <= 60 ? 'bg-orange-500' :
                                         strength.percentage <= 80 ? 'bg-orange-400' :
                                         'bg-green-500'
                                       }`}
                                       style={{ width: `${strength.percentage}%` }}
                                     />
                                   </div>
                                 </div>
                               );
                             })()}
                           </div>
                         )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            placeholder="Confirm your new password"
                            className="h-12 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {passwordData.confirmPassword && (
                          <div className="mt-2">
                            <div className={`flex items-center gap-2 text-xs ${
                              passwordData.newPassword === passwordData.confirmPassword 
                                ? 'text-green-600' 
                                : 'text-red-500'
                            }`}>
                              {passwordData.newPassword === passwordData.confirmPassword ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              <span>Passwords match</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleChangePassword}
                        disabled={passwordLoading}
                        className="gap-2"
                      >
                        {passwordLoading ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Changing...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Change Password
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCancelPasswordChange}
                        variant="outline"
                        disabled={passwordLoading}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-muted-foreground">
                          Last changed: {formatDate(user?.updated_at || new Date().toISOString())}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </main>
        <FloatingMenuButton />
      </div>
    </SidebarProvider>
  );
};

export default Profile;