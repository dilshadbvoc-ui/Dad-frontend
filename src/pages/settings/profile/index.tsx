import { useState, useEffect, useRef } from "react"
import { useMutation } from "@tanstack/react-query"
import { getProfile, updateProfile, changePassword, uploadImage, type ProfileUpdateData } from "@/services/settingsService"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Lock, Save, Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profileImage?: string;
}

export default function ProfileSettingsPage() {
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getProfile().then(data => { setProfile(data); setLoading(false) }).catch(() => setLoading(false))
    }, [])

    const updateMutation = useMutation({
        mutationFn: (data: ProfileUpdateData) => updateProfile(data),
        onSuccess: () => toast.success('Profile updated'),
        onError: () => toast.error('Failed to update profile')
    })

    const passwordMutation = useMutation({
        mutationFn: (data: { currentPassword: string; newPassword: string }) => changePassword(data),
        onSuccess: () => { toast.success('Password changed'); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }) },
        onError: () => toast.error('Failed to change password')
    })

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile) return
        updateMutation.mutate({
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
            profileImage: profile.profileImage
        })
    }

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        passwordMutation.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const data = await uploadImage(file);
            setProfile(prev => prev ? { ...prev, profileImage: data.url } : null);
            toast.success('Image uploaded successfully. Don\'t forget to save changes.');
        } catch (error) {
            toast.error('Failed to upload image');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Profile Settings</h1>
                            <p className="text-gray-500">Manage your personal information</p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center p-16"><div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" /></div>
                        ) : (
                            <>
                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Personal Information</CardTitle><CardDescription>Update your name and contact details</CardDescription></CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                                            {/* Profile Image Section */}
                                            <div className="flex items-center gap-6">
                                                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                    <Avatar className="h-24 w-24 border-2 border-primary/20">
                                                        <AvatarImage src={`http://localhost:5000${profile?.profileImage}`} className="object-cover" />
                                                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                                            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {uploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">Profile Picture</h3>
                                                    <p className="text-sm text-gray-500">Click to upload a new photo. JPG, PNG or GIF.</p>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label>First Name</Label><Input value={profile?.firstName || ''} onChange={e => setProfile(p => p ? { ...p, firstName: e.target.value } : null)} /></div>
                                                <div><Label>Last Name</Label><Input value={profile?.lastName || ''} onChange={e => setProfile(p => p ? { ...p, lastName: e.target.value } : null)} /></div>
                                            </div>
                                            <div><Label>Email</Label><Input value={profile?.email || ''} disabled className="bg-gray-100" /></div>
                                            <div><Label>Phone</Label><Input value={profile?.phone || ''} onChange={e => setProfile(p => p ? { ...p, phone: e.target.value } : null)} /></div>
                                            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600"><Save className="h-4 w-4 mr-2" />Save Changes</Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Change Password</CardTitle><CardDescription>Update your password</CardDescription></CardHeader>
                                    <CardContent>
                                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                            <div><Label>Current Password</Label><Input type="password" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} required /></div>
                                            <div><Label>New Password</Label><Input type="password" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} required /></div>
                                            <div><Label>Confirm New Password</Label><Input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} required /></div>
                                            <Button type="submit" variant="outline">Change Password</Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
