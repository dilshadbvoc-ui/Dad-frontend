import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/shared/Logo';
import SEO from '@/components/shared/SEO';
import { Sparkles } from 'lucide-react';
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
            {/* Visual Section - CSS Mesh Gradient & Animated Elements */}
            <div className="hidden lg:flex relative h-full overflow-hidden bg-[#0A0C10] flex-col justify-between p-12 text-white">
                {/* Dynamic Mesh Gradient Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse-soft" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse-soft" style={{ animationDelay: '-5s' }} />
                    <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[100px] animate-pulse-soft" style={{ animationDelay: '-10s' }} />
                </div>

                {/* Decorative Elements */}
                <div className="absolute inset-0 z-0 opacity-30">
                    <div className="absolute top-[15%] left-[10%] w-64 h-64 rounded-full border border-white/10 animate-float" />
                    <div className="absolute bottom-[20%] right-[15%] w-96 h-96 rounded-full border border-white/5 animate-float" style={{ animationDelay: '-7s' }} />
                    <div className="absolute top-[40%] right-[20%] w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/10 to-transparent animate-float" style={{ animationDelay: '-12s' }} />
                </div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

                <div className="relative z-10 flex items-center gap-2">
                    <Logo size="lg" className="text-white" />
                </div>

                <div className="relative z-10 space-y-8 max-w-lg">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-xs font-medium text-indigo-200">
                            <Sparkles className="w-3.5 h-3.5" />
                            Next-Gen Sales Intelligence
                        </div>
                        <h2 className="text-5xl font-bold tracking-tight leading-[1.1]">
                            Accelerate your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Sales Velocity.</span>
                        </h2>
                    </div>

                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl space-y-4">
                        <blockquote className="text-lg font-medium text-slate-200 leading-relaxed italic">
                            "The transition from spreadsheets to Pype CRM was the single best decision for our sales team's productivity."
                        </blockquote>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
                            <div>
                                <div className="text-sm font-bold text-white">Sarah Jenkins</div>
                                <div className="text-xs text-slate-400">Head of Sales @ GrowthScale</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 uppercase tracking-widest font-bold">
                    <span>© 2026 PYPE CRM</span>
                    <div className="flex gap-6">
                        <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
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
