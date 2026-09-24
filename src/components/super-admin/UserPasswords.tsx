import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function UserPasswords() {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-user-passwords'],
    queryFn: async () => {
      const res = await api.get('/super-admin/users/passwords');
      return res.data.data;
    }
  });

  const togglePassword = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Passwords</h2>
          <p className="text-muted-foreground text-sm">
            View stored plain text passwords for all users across organisations.
          </p>
        </div>
      </div>

      {data?.map((orgGroup: any) => (
        <Card key={orgGroup.organisationName} className="bg-card">
          <CardHeader>
            <CardTitle>{orgGroup.organisationName}</CardTitle>
            <CardDescription>{orgGroup.users.length} users</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Password</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgGroup.users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.password ? (
                        <div className="flex items-center space-x-2">
                          <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
                            {showPasswords[user.id] ? user.password : '••••••••'}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => togglePassword(user.id)}
                          >
                            {showPasswords[user.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">Not stored</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
