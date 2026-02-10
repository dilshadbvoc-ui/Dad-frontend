import React, { useState, useEffect } from 'react';
import { getAdAccounts, getMetaCampaigns, createMetaCampaign, type Campaign } from '../../services/marketingService';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

const AdsManager: React.FC = () => {
    const [adAccounts, setAdAccounts] = useState<{ id: string; name: string; account_id: string }[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(false);
    const [metaConnected, setMetaConnected] = useState(true);
    const [newCampaign, setNewCampaign] = useState({ name: '', objective: 'OUTCOME_LEADS' });

    useEffect(() => {
        fetchAdAccounts();
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            fetchCampaigns(selectedAccount);
        }
    }, [selectedAccount]);

    const fetchAdAccounts = async () => {
        try {
            const res = await getAdAccounts();

            // Check for explicit not connected signal (even with 200 OK)
            if (res.code === 'META_NOT_CONNECTED') {
                setMetaConnected(false);
                return;
            }

            if (res.data && res.data.data) {
                setAdAccounts(res.data.data);
                if (res.data.data.length > 0) {
                    setSelectedAccount(res.data.data[0].id);
                }
            } else if (res.data) {
                // Handle direct array vs wrapper
                const accounts = Array.isArray(res.data) ? res.data : res.data.data || [];
                setAdAccounts(accounts);
                if (accounts.length > 0) {
                    setSelectedAccount(accounts[0].id);
                }
            }
            setMetaConnected(true);
        } catch (error: unknown) {
            const err = error as { response?: { status: number; data?: { code?: string } } };
            // Fallback for older API versions or if 400 persists
            if (err.response?.status === 400 && err.response?.data?.code === 'META_NOT_CONNECTED') {
                setMetaConnected(false);
            } else {
                console.error('Failed to fetch ad accounts', error);
                toast.error('Failed to load Ad Accounts.');
            }
        }
    };

    const fetchCampaigns = async (accountId: string) => {
        if (!accountId) return;
        setLoading(true);
        try {
            const res = await getMetaCampaigns(accountId);
            setCampaigns(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch campaigns', error);
            toast.error('Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCampaign = async () => {
        if (!selectedAccount) return;
        try {
            await createMetaCampaign(selectedAccount, {
                name: newCampaign.name,
                objective: newCampaign.objective,
                status: 'PAUSED',
                special_ad_categories: [] // This might need a proper type or cast if strict
            } as Partial<Campaign> & Record<string, unknown>);
            // Re-evaluating: Campaign interface doesn't have special_ad_categories. I'll add Record<string, unknown> to createMetaCampaign to allow extended props.

            toast.success('Campaign Created Successfully!');
            fetchCampaigns(selectedAccount);
            setNewCampaign({ name: '', objective: 'OUTCOME_LEADS' });
        } catch {
            toast.error('Failed to create campaign');
        }
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Facebook Ads Manager</h1>

            {!metaConnected && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
                    <p className="font-bold">Meta Account Not Connected</p>
                    <p>Please connect your Facebook account in Settings to manage ads.</p>
                </div>
            )}

            {/* Account Selector */}
            <div className="w-[300px]">
                <Label>Select Ad Account</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                        {adAccounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>
                                {acc.name} ({acc.account_id})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Create Campaign */}
            <Card>
                <CardHeader>
                    <CardTitle>Create New Campaign</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Campaign Name</Label>
                            <Input
                                value={newCampaign.name}
                                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                placeholder="e.g. Summer Sale 2026"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Objective</Label>
                            <Select
                                value={newCampaign.objective}
                                onValueChange={(val) => setNewCampaign({ ...newCampaign, objective: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OUTCOME_LEADS">Leads</SelectItem>
                                    <SelectItem value="OUTCOME_TRAFFIC">Traffic</SelectItem>
                                    <SelectItem value="OUTCOME_SALES">Sales</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button onClick={handleCreateCampaign} disabled={!newCampaign.name || loading}>
                        {loading ? 'Processing...' : 'Create Campaign'}
                    </Button>
                </CardContent>
            </Card>

            {/* Campaign List */}
            <Card>
                <CardHeader>
                    <CardTitle>Existing Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Loading campaigns...</p>
                    ) : campaigns.length === 0 ? (
                        <p className="text-muted-foreground">No campaigns found.</p>
                    ) : (
                        <div className="space-y-2">
                            {campaigns.map((camp) => (
                                <div key={camp.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <p className="font-semibold">{camp.name}</p>
                                        <p className="text-sm text-gray-500">ID: {camp.id} | Status: {camp.status}</p>
                                    </div>
                                    <div className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        {camp.objective || 'N/A'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdsManager;
