import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/shared/Logo';
import SEO from '@/components/shared/SEO';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { saveAndroidToken, saveAndroidApiUrl } from '@/utils/androidBridge';
import { API_URL } from '@/config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

      if (autoLogin) {
        localStorage.setItem('autoLogin', 'true');
      } else {
        localStorage.removeItem('autoLogin');
      }
      
      // Always sync the session token to Android native SharedPreferences
      saveAndroidToken(sanitizedData.token);
      saveAndroidApiUrl(API_URL);

      // Clear previous user's cached data before navigating to prevent cross-user data leakage
      queryClient.clear();
      window.dispatchEvent(new CustomEvent('auth-refresh', { detail: sanitizedData }));
      // Small delay for animation
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err: unknown) {
      // 1. Production-grade diagnostic logging
      console.error("====== LOGIN ERROR DIAGNOSTICS ======");
      console.error("Original Error Object:", err);
      
      const isAxiosError = err && typeof err === 'object' && ('isAxiosError' in err || 'config' in err);
      console.error("Is Axios/API Error:", !!isAxiosError);

      if (isAxiosError) {
        const apiError = err as {
          message?: string;
          code?: string;
          config?: { url?: string; method?: string; baseURL?: string; headers?: Record<string, string> };
          response?: { status?: number; data?: unknown; headers?: Record<string, string> };
          request?: unknown;
        };

        console.error("Error Message:", apiError.message);
        console.error("Error Code:", apiError.code);
        console.error("Requested Endpoint:", `${apiError.config?.baseURL || ''}${apiError.config?.url || ''}`);
        console.error("Request Method:", apiError.config?.method?.toUpperCase());
        
        if (apiError.response) {
          console.error("HTTP Response Status:", apiError.response.status);
          console.error("HTTP Response Data:", apiError.response.data);
          console.error("HTTP Response Headers:", apiError.response.headers);
        } else if (apiError.request) {
          console.error("No response received from server. Request details:", apiError.request);
          console.error("Troubleshooting Advice: This usually happens when the backend server is crashed/offline, there is a local CORS policy mismatch, or there is a Mixed Content block (HTTPS requesting HTTP).");
        }
      } else {
        const standardError = err as { message?: string; stack?: string };
        console.error("Non-API Error Message:", standardError.message || String(err));
        if (standardError.stack) {
          console.error("Non-API Error Stack:", standardError.stack);
        }
      }
      console.error("=====================================");

      // 2. User-facing UI error message resolution
      let errorMessage = 'Login failed';
      const parsedError = err as { 
        response?: { 
          data?: { message?: string; error?: string }; 
          status?: number 
        }; 
        request?: unknown; 
        message?: string; 
        code?: string 
      };

      if (parsedError.response) {
        // Server returned an error code (4xx, 5xx)
        errorMessage = parsedError.response.data?.message || parsedError.response.data?.error || `Server error (${parsedError.response.status})`;
      } else if (parsedError.request) {
        // Request made but no response returned
        if (parsedError.code === 'ERR_NETWORK') {
          errorMessage = 'Network Error: Cannot connect to the server. Please verify the backend service is running and CORS allows this origin.';
        } else {
          errorMessage = 'Network Error: Connection timed out or server unreachable. Please try again.';
        }
      } else {
        // Other unexpected errors
        errorMessage = parsedError.message || 'Unknown Error';
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] font-poppins! lg:min-h-screen grid lg:grid-cols-2 bg-[#F9FAEF] lg:p-0 gap-6">
      <SEO
        title="Login"
        description="Securely access your Pype CRM account. Manage your sales pipeline and leads with ease."
      />
      {/* Visual Section — brand-green panel */}
      <div className="hidden lg:flex relative h-full overflow-hidden rounded-[0px] bg-gradient-to-br from-[hsl(var(--chart-5))] to-[hsl(94_48%_34%)] flex-col justify-between p-12 text-white">
        {/* Decorative rounded squares */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-16 h-16 rounded-2xl bg-white/10 rotate-12" />
          <div className="absolute top-24 left-32 w-10 h-10 rounded-xl bg-white/10 -rotate-6" />
          <div className="absolute top-16 right-16 w-8 h-8 rounded-lg bg-white/10 rotate-45" />
          <div className="absolute bottom-40 right-10 w-20 h-20 rounded-2xl bg-white/10 rotate-12" />
          <div className="absolute bottom-24 left-8 w-24 h-24 rounded-3xl bg-white/10 -rotate-12" />
          <div className="absolute bottom-56 left-24 w-9 h-9 rounded-lg bg-white/10 rotate-6" />
          {/* Wavy connecting lines */}
          <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 500 700" fill="none" preserveAspectRatio="none">
            <path d="M40 60 C 200 140, 120 260, 320 220 S 420 420, 250 480 S 60 600, 180 660" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative z-10">
          <Logo size="md" showText variant="onColor" />
        </div>

        <div className="relative z-10 space-y-3 max-w-md">
          <p className="text-[13px] ml-0.5 font-poppins font-semibold tracking-[0.2em] uppercase text-white/70">
            Sales &bull; Automation &bull; Growth
          </p>
          <h2 className="text-5xl font-poppins! font-semibold! text-white tracking-tight leading-[1.1]">
            Build Stronger<br />
            Customer<br />
            <span className="text-white/80">Relationships.</span>
          </h2>
          <p className="text-white ml-0.5 font-poppins text-[15px] leading-relaxed max-w-[20rem]">
            A simple, powerful CRM to manage leads, automate follow-ups and drive more revenue - all in one place.
          </p>
          <div className="w-10 ml-1 h-px bg-white/40" />
          <p className="text-[13px] ml-0.5 font-poppins font-semibold tracking-[0.2em] uppercase text-white">
            Organize &bull; Automate &bull; Grow
          </p>
        </div>

        <div className="relative font-poppins z-10 text-xs text-white">
          © 2026 Pype CRM. All rights reserved.
        </div>
      </div>

      {/* Form Section */}
      <div className="flex min-h-[100dvh] lg:min-h-full items-center justify-center px-4 py-6 lg:p-12">
        <Card className="w-full max-w-[420px] border border-[#79bc46]/40 bg-white rounded-[12px]!">
          <CardHeader className="space-y-2 text-center px-8 pt-10">
            <div className="flex justify-center mb-2">
              <Logo size="md" showText />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Welcome <span className="text-[hsl(var(--chart-5))]">Back</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in to continue to your account
            </p>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border border-input bg-white pl-10 h-11 rounded-[10px] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#79bc46]/40 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                {/* Hidden field for accessibility/password managers - moved before password for better browser detection */}
                <input type="text" name="username" value={email} readOnly style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex={-1} autoComplete="username" aria-hidden="true" />
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border border-input bg-white pl-10 pr-10 h-11 rounded-[10px] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-[#79bc46]/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  {error}
                </div>
              )}

              <div className="flex items-center space-x-2 py-1">
                <Checkbox
                  id="autoLogin"
                  className="min-h-5! min-w-5! md:min-h-4! md:min-w-4! data-[state=checked]:bg-[hsl(var(--chart-5))] data-[state=checked]:border-[hsl(var(--chart-5))]"
                  checked={autoLogin}
                  onCheckedChange={(checked) => setAutoLogin(checked as boolean)}
                />
                <Label
                  htmlFor="autoLogin"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remember me for 30 days
                </Label>
              </div>

              <Button
                className="w-full h-11 rounded-[10px] bg-[hsl(var(--chart-5))] text-white hover:bg-[hsl(94_48%_38%)] transition-all duration-300 gap-2 font-semibold"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

        </Card>
      </div >
    </div >
  );
};

export default Login;
