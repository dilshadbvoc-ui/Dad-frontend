import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/shared/Logo';
import SEO from '@/components/shared/SEO';
// import { Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { data } = await api.post('/auth/login', { email, password });
            const sanitizedData = { ...data };
            if (sanitizedData.profileImage && sanitizedData.profileImage.includes('null')) {
                sanitizedData.profileImage = null;
            }
            if (sanitizedData.avatar && sanitizedData.avatar.includes('null')) {
                sanitizedData.avatar = null;
            }
            localStorage.setItem('userInfo', JSON.stringify(sanitizedData));
            // Small delay for animation
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (err: unknown) {
            console.error("Login Error Full:", err);
            console.error("Login Error Response:", (err as { response?: unknown })?.response);
            console.error("Login Error Data:", (err as { response?: { data?: unknown } })?.response?.data);

            let errorMessage = 'Login failed';
            const error = err as { response?: { data?: { message?: string }, status?: number }, request?: unknown, message?: string };

            if (error.response) {
                // Server responded with a status code outside 2xx
                errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = 'Network Error: Cannot reach server. Check your connection or API configuration.';
            } else {
                // Something else happened
                errorMessage = error.message || 'Unknown Error';
            }

            setError(errorMessage);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <SEO
                title="Login"
                description="Securely access your Pype CRM account. Manage your sales pipeline and leads with ease."
            />
            {/* Image Section */}
            <div className="hidden lg:block relative h-full bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 mix-blend-multiply z-10" />
                <img
                    src="/login-bg.png"
                    alt="Login Background"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="relative z-20 h-full flex flex-col justify-between p-12 text-white">
                    <div className="flex items-center gap-2">
                        <Logo size="lg" className="text-white" />
                    </div>
                    <div className="space-y-4 max-w-md">
                        <blockquote className="text-2xl font-medium leading-relaxed">
                            "Streamline your sales process and close deals faster with our intelligent CRM solution."
                        </blockquote>
                        <div className="text-sm text-slate-300">
                            Powering growth for modern sales teams.
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="flex items-center justify-center p-4 lg:p-12 bg-background data-[theme=dark]:bg-background">
                <Card className="w-full max-w-[400px] shadow-lg border-0 bg-card shadow-sm">
                    <CardHeader className="space-y-1 text-center lg:text-left px-6 pt-6">
                        <CardTitle className="text-3xl font-bold tracking-tight">
                            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">Welcome Back</span>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access your account
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4 px-6 pb-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-white dark:bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-white dark:bg-background"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                    {error}
                                </div>
                            )}

                            <Button
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                    </CardContent>

                </Card>
            </div >
        </div >
    );
};

export default Login;
