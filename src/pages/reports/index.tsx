import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReportsPage() {
    return (
        <div className="p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Reports - Temporarily Disabled</CardTitle>
                    <CardDescription>Charts are temporarily disabled for debugging purposes</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        The reports page is temporarily disabled while we fix a chart rendering issue.
                        Please check back soon.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
