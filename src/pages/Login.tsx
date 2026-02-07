import { useState } from 'react';
import loginBg from '@/assets/login-bg.png';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            localStorage.setItem('userInfo', JSON.stringify(data));
            // Small delay for animation
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (err: unknown) {
            console.error("Login Error Full:", err);
            let errorMessage = 'Login failed';
            const error = err as { response?: { data?: { message?: string }, status?: number }, request?: unknown, message?: string };

            if (error.response) {
                // Server responded with a status code outside 2xx
            } else if (error.request) {
                // Request was made but no response received
                console.log("No response received. Possible Network/CORS issue.");
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
            {/* Image Section */}
            <div className="hidden lg:block relative h-full bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 mix-blend-multiply z-10" />
                <img
                    src={loginBg}
                    alt="Login Background"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="relative z-20 h-full flex flex-col justify-between p-12 text-white">
                    <div className="flex items-center gap-2">
                        {/* <div className="h-8 w-8 bg-white rounded-lg" /> */}
                        <span className="text-xl font-bold tracking-tight">LEADHOSTIX CRM</span>
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
            <div className="flex items-center justify-center p-4 lg:p-12 bg-gray-50 dark:bg-gray-950">
                <Card className="w-full max-w-[400px] shadow-lg border-0 bg-transparent shadow-none">
                    <CardHeader className="space-y-1 text-center lg:text-left px-0">
                        <CardTitle className="text-3xl font-bold tracking-tight">
                            <span className="bg-gradient-to-r from-purple-700 to-indigo-600 dark:from-purple-400 dark:to-indigo-300 bg-clip-text text-transparent">Welcome Back</span>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access your account
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4 px-0">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-white dark:bg-gray-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-white dark:bg-gray-900"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                    {error}
                                </div>
                            )}

                            <Button
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                                type="submit"
                                isLoading={isLoading}
                            >
                                Sign In
                            </Button>
                        </form>
                    </CardContent>

                </Card>
            </div >
        </div >
    );
};

export default Login;
