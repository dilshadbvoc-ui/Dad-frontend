import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { syncToken } from '@/utils/mobileBridge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SSOCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        const dataParam = searchParams.get('data');
        if (dataParam) {
            try {
                const userInfoStr = decodeURIComponent(dataParam);
                const userInfo = JSON.parse(userInfoStr);

                if (userInfo && userInfo.token) {
                    // Save to localStorage
                    localStorage.setItem('userInfo', JSON.stringify(userInfo));

                    // Sync token
                    syncToken(userInfo.token);

                    toast.success('Successfully logged in via SSO');

                    // Redirect to dashboard
                    navigate('/dashboard');
                } else {
                    setError('Invalid token data received');
                }
            } catch (err) {
                console.error('SSO Parse Error', err);
                setError('Failed to process login data');
            }
        } else {
            setError('No login data received');
        }
    }, [searchParams, navigate]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="text-red-500 font-medium mb-4">{error}</div>
                <button
                    onClick={() => navigate('/login')}
                    className="text-blue-600 hover:underline"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500">Completing secure sign-in...</p>
        </div>
    );
};

export default SSOCallback;
