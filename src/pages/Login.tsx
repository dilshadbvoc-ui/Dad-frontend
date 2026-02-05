import { useState } from 'react';
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
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Login failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 px-4">
            <Card className="w-full max-w-[400px] shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        <span className="bg-gradient-to-r from-purple-700 to-indigo-600 dark:from-purple-400 dark:to-indigo-300 bg-clip-text text-transparent">LEADHOSTIX</span>
                        <span className="text-amber-500 text-4xl font-extrabold">+</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
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
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                {error}
                            </div>
                        )}

                        <Button
                            className="w-full"
                            type="submit"
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                        <div className="mt-4 text-center">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-300 dark:border-gray-700" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-gray-950 px-2 text-gray-500">
                                        Or
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full mt-4"
                                type="button"
                                onClick={() => navigate('/sso-login')}
                            >
                                Login with SSO
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div >
    );
};

export default Login;
