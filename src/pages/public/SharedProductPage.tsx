import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Share2, Phone, Mail, MapPin } from "lucide-react"

interface SharedProductData {
    product: {
        id: string
        name: string
        description?: string
        basePrice: number
        currency: string
        category?: string
        imageUrl?: string
        brochureUrl?: string
    }
    seller: {
        firstName: string
        lastName: string
        id: string
    }
}

export default function SharedProductPage() {
    const { slug } = useParams()
    const [data, setData] = useState<SharedProductData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // Use the public API endpoint
                const response = await api.get(`/share/${slug}`)
                setData(response.data)
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to load product")
            } finally {
                setLoading(false)
            }
        }
        if (slug) fetchProduct()
    }, [slug])

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

    if (error) return (
        <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Product Not Found</h1>
            <p className="text-gray-500">{error}</p>
        </div>
    )

    if (!data) return null

    const { product, seller } = data
    const brochureType = product.brochureUrl?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Share2 className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-bold text-lg text-primary">DadCRM</span>
                    </div>
                    {/* Optional: Add contact button or links */}
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="grid gap-8 lg:grid-cols-3">

                    {/* Left Column: Product Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-0 shadow-md overflow-hidden">
                            {/* Product Header / Image Placeholder */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-48 md:h-64 flex items-center justify-center text-white relative">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover opacity-90" />
                                ) : (
                                    <div className="text-center p-6">
                                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
                                        {product.category && <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">{product.category}</Badge>}
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-6 md:p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                                        <p className="text-gray-500 text-sm mt-1">Offered by {seller.firstName} {seller.lastName}</p>
                                    </div>
                                    <div className="text-3xl font-bold text-primary">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: product.currency }).format(product.basePrice)}
                                    </div>
                                </div>

                                <div className="prose max-w-none text-gray-600 mb-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                                    <p>{product.description || "No description available."}</p>
                                </div>

                                {/* Brochure Section */}
                                {product.brochureUrl && (
                                    <div className="mt-8 pt-8 border-t border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            Product Brochure
                                        </h3>

                                        {brochureType === 'pdf' ? (
                                            <div className="border rounded-xl overflow-hidden shadow-sm bg-gray-100">
                                                <div className="aspect-[3/2] w-full relative group">
                                                    {/* We use an iframe to preview the PDF. For better UX, consider react-pdf */}
                                                    <iframe
                                                        src={`${api.defaults.baseURL?.replace('/api', '')}${product.brochureUrl}#toolbar=0`}
                                                        className="w-full h-full"
                                                        title="Brochure Preview"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button asChild variant="secondary">
                                                            <a href={`${api.defaults.baseURL?.replace('/api', '')}${product.brochureUrl}`} target="_blank" rel="noopener noreferrer">
                                                                <Download className="mr-2 h-4 w-4" /> Download Full PDF
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                                <img
                                                    src={`${api.defaults.baseURL?.replace('/api', '')}${product.brochureUrl}`}
                                                    alt="Brochure"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-gray-50 border-t flex justify-end">
                                                    <Button asChild variant="outline" size="sm">
                                                        <a href={`${api.defaults.baseURL?.replace('/api', '')}${product.brochureUrl}`} target="_blank" rel="noopener noreferrer">
                                                            <Download className="mr-2 h-4 w-4" /> Download Image
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Contact / Seller Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Seller</CardTitle>
                                <CardDescription>Interested in this product? Get in touch.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {seller.firstName[0]}{seller.lastName[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium">{seller.firstName} {seller.lastName}</p>
                                        <p className="text-xs text-gray-500">Sales Representative</p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-4 border-t">
                                    <Button className="w-full"><Mail className="mr-2 h-4 w-4" /> Send Email</Button>
                                    <Button variant="outline" className="w-full"><Phone className="mr-2 h-4 w-4" /> Request Call</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                            <p><strong>Note:</strong> This is a shared product view. Prices and availability are subject to change.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
