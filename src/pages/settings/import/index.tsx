
import { useState } from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowRight, Upload, FileText, Check, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/services/api"
import { useNavigate } from "react-router-dom"

const CRM_FIELDS = [
    { label: "First Name", value: "firstName", required: true },
    { label: "Last Name", value: "lastName", required: true },
    { label: "Email", value: "email", required: false },
    { label: "Phone", value: "phone", required: true },
    { label: "Company", value: "company", required: false },
    { label: "Job Title", value: "jobTitle", required: false },
    { label: "Lead Source", value: "source", required: false },
    { label: "Lead Status", value: "status", required: false },
    { label: "Street Address", value: "address.street", required: false },
    { label: "City", value: "address.city", required: false },
    { label: "State", value: "address.state", required: false },
    { label: "Country", value: "address.country", required: false },
    { label: "Zip Code", value: "address.zipCode", required: false },
]

export default function ImportPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1) // 1: Upload, 2: Map, 3: Review/Importing
    const [file, setFile] = useState<File | null>(null)
    const [headers, setHeaders] = useState<string[]>([])
    const [previewData, setPreviewData] = useState<any[]>([])
    const [mapping, setMapping] = useState<Record<string, string>>({})
    const [isImporting, setIsImporting] = useState(false)

    // Handling file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
                toast.error("Please upload a CSV file")
                return
            }
            setFile(selectedFile)
            parseFile(selectedFile)
        }
    }

    const parseFile = (file: File) => {
        Papa.parse(file, {
            header: true,
            preview: 5,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.meta.fields) {
                    setHeaders(results.meta.fields)
                    setPreviewData(results.data)
                    // Auto-map if headers match loosely
                    const initialMapping: Record<string, string> = {}
                    results.meta.fields.forEach(header => {
                        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "")
                        const match = CRM_FIELDS.find(f =>
                            f.label.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedHeader ||
                            f.value.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedHeader
                        )
                        if (match) {
                            initialMapping[header] = match.value
                        }
                    })
                    setMapping(initialMapping)
                    setStep(2)
                }
            },
            error: (err) => {
                toast.error("Error parsing CSV: " + err.message)
            }
        })
    }

    const handleMappingChange = (csvHeader: string, crmField: string) => {
        setMapping(prev => ({ ...prev, [csvHeader]: crmField }))
    }

    const handleImport = async () => {
        if (!file) return

        // Validate required fields
        const mappedCrmFields = Object.values(mapping)
        const missingRequired = CRM_FIELDS.filter(f => f.required && !mappedCrmFields.includes(f.value))

        if (missingRequired.length > 0) {
            toast.error(`Missing required mappings: ${missingRequired.map(f => f.label).join(", ")}`)
            return
        }

        setIsImporting(true)

        // Create FormData
        const formData = new FormData()
        formData.append("file", file)
        formData.append("mapping", JSON.stringify(mapping))

        try {
            await api.post("/import/leads", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            toast.success("Import started successfully! You will be notified when complete.")
            navigate("/leads")
        } catch (error: any) {
            console.error("Import failed", error)
            toast.error(error.response?.data?.message || "Import failed")
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Data Migration</h1>
                <p className="text-gray-500">Import leads from other CRMs via CSV</p>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary font-semibold" : "text-gray-400"}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${step >= 1 ? "bg-primary text-white border-primary" : "border-gray-300"}`}>1</div>
                    Upload
                </div>
                <div className="h-px bg-gray-300 w-12" />
                <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary font-semibold" : "text-gray-400"}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${step >= 2 ? "bg-primary text-white border-primary" : "border-gray-300"}`}>2</div>
                    Map Fields
                </div>
                <div className="h-px bg-gray-300 w-12" />
                <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary font-semibold" : "text-gray-400"}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${step >= 3 ? "bg-primary text-white border-primary" : "border-gray-300"}`}>3</div>
                    Finish
                </div>
            </div>

            {step === 1 && (
                <Card>
                    <CardHeader><CardTitle>Upload CSV File</CardTitle></CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                                <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-lg font-medium">Click to upload or drag and drop</p>
                            <p className="text-sm text-gray-500">CSV files only (max 10MB)</p>
                        </label>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Map Fields</span>
                            <Button variant="outline" onClick={() => setStep(1)} size="sm">Back to Upload</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>CSV Header</TableHead>
                                        <TableHead>First Row Preview</TableHead>
                                        <TableHead>CRM Field</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {headers.map((header) => (
                                        <TableRow key={header}>
                                            <TableCell className="font-medium">{header}</TableCell>
                                            <TableCell className="text-gray-500 truncate max-w-[200px]">
                                                {previewData[0]?.[header] || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={mapping[header] || "ignore"}
                                                    onValueChange={(val) => handleMappingChange(header, val === "ignore" ? "" : val)}
                                                >
                                                    <SelectTrigger className="w-[200px]">
                                                        <SelectValue placeholder="Ignore Column" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ignore">Ignore Column</SelectItem>
                                                        {CRM_FIELDS.map(field => (
                                                            <SelectItem key={field.value} value={field.value}>
                                                                {field.label} {field.required && "*"}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-end mt-6">
                            <Button onClick={handleImport} disabled={isImporting} className="bg-green-600 hover:bg-green-700">
                                {isImporting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-2 h-4 w-4" /> Start Import
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
