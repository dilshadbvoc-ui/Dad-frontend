import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { importLeads, type CreateLeadData } from "@/services/leadService"
import { getBranches } from "@/services/settingsService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { isAdmin, getUserInfo } from "@/lib/utils"

export function BulkImportLeads() {
    const [file, setFile] = useState<File | null>(null)
    const [previewCount, setPreviewCount] = useState<number>(0)
    const [parsedData, setParsedData] = useState<CreateLeadData[]>([])
    const [error, setError] = useState<string | null>(null)
    const [selectedBranchId, setSelectedBranchId] = useState<string>("")

    const queryClient = useQueryClient()
    const user = getUserInfo();
    const userBranchId = user?.branchId;

    // Allow branch selection if user is admin/super_admin
    const canSelectBranch = isAdmin(user);

    const { data: branchesData } = useQuery({
        queryKey: ['branches'],
        queryFn: getBranches,
        enabled: canSelectBranch
    })

    const branches = branchesData?.branches || [];

    const importMutation = useMutation({
        mutationFn: (data: CreateLeadData[]) => {
            // Attach branchId if selected or user has one
            const finalData = data.map(lead => ({
                ...lead,
                branchId: selectedBranchId || userBranchId || undefined
            }));
            return importLeads(finalData)
        },
        onSuccess: (data) => {
            toast.success(`Successfully imported ${data.count} leads`)
            setFile(null)
            setParsedData([])
            setPreviewCount(0)
            setSelectedBranchId(userBranchId || "")
            queryClient.invalidateQueries({ queryKey: ['leads'] })
        },
        onError: (err: { message: string }) => {
            toast.error(err.message || 'Failed to import leads')
            setError(err.message || 'Failed to import leads')
        }
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith('.csv')) {
            toast.error("Please upload a CSV file")
            return
        }

        setFile(selectedFile)
        setError(null)

        const text = await selectedFile.text()
        try {
            const data = parseCSV(text)
            if (data.length === 0) {
                setError("No data found in file")
                return
            }
            setParsedData(data)
            setPreviewCount(data.length)
        } catch (err) {
            setError("Failed to parse CSV file. Please ensure it is valid.")
            console.error(err)
        }
    }

    const parseCSV = (text: string): CreateLeadData[] => {
        const lines = text.split('\n')
        if (lines.length < 2) return []

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        const result = []

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue

            // Basic CSV regex to handle commas inside quotes would be better, but for now simple split
            // Or better: simple split but warn about limitations
            const currentLine = lines[i].split(',')

            if (currentLine.length < headers.length) continue

            const obj: Partial<CreateLeadData> = {}
            for (let j = 0; j < headers.length; j++) {
                // Remove potential quotes
                let val = currentLine[j]?.trim()
                if (val && val.startsWith('"') && val.endsWith('"')) {
                    val = val.substring(1, val.length - 1)
                }
                (obj as Record<string, unknown>)[headers[j]] = val
            }

            // Basic validation: needs at least firstName or lastName
            if (obj.firstName || obj.lastName || obj.email) {
                // Ensure source is present
                if (!obj.source) obj.source = 'import';
                result.push(obj as CreateLeadData)
            }
        }
        return result
    }

    const handleImport = () => {
        if (parsedData.length === 0) return
        importMutation.mutate(parsedData)
    }

    const handleDownloadTemplate = () => {
        const headers = "firstName,lastName,email,phone,company,jobTitle,source,leadScore,stage,ownerEmail"
        const sample = "John,Doe,john@example.com,1234567890,Acme Corp,Manager,import,10,new,admin@example.com"
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sample
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "leads_import_template.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bulk Import Leads</CardTitle>
                <CardDescription>Upload a CSV file to import leads in bulk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {canSelectBranch && (
                    <div className="space-y-2">
                        <Label>Target Branch (Optional)</Label>
                        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Branch (Default: All/Head Office)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_branches_placeholder">All/Head Office</SelectItem>
                                {branches.map((b: { id: string, name: string }) => (
                                    <SelectItem key={b.id} value={b.id}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Leads will be assigned to this branch.</p>
                    </div>
                )}

                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer relative">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">CSV files only</p>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <Button variant="link" size="sm" onClick={handleDownloadTemplate} className="text-blue-600 px-0">
                        <FileText className="h-4 w-4 mr-1" /> Download CSV Template
                    </Button>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {file && !error && (
                    <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Ready to Import</AlertTitle>
                        <AlertDescription>
                            {file.name} - {previewCount} records found
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-end pt-2">
                    <Button onClick={handleImport} disabled={!file || parsedData.length === 0 || importMutation.isPending}>
                        {importMutation.isPending ? "Importing..." : "Import Leads"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
