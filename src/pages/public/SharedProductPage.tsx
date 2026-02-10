import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Share2, Phone, Mail } from "lucide-react"

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
    shareConfig?: {
        youtubeUrl?: string
        customTitle?: string
        customDescription?: string
    }
}

// Helper to construct safe URL for brochure
const getAssetUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // In development, use relative path to leverage Vite proxy (avoids Mixed Content: HTTPS page loading HTTP resource)
    if (import.meta.env.DEV) return path;

    // In production, construct full URL
    // Assumes api.defaults.baseURL is set to the API root (e.g. https://api.domain.com/api)
    // We strip /api to get the root for static files
    const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || '';
    return `${baseUrl}${path}`;
}

export default function SharedProductPage() {
    const { slug } = useParams()
    const [searchParams] = useSearchParams()
    const leadId = searchParams.get('leadId')
    const [data, setData] = useState<SharedProductData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // Use the public API endpoint, passing leadId if available
                const url = leadId ? `/share/${slug}?leadId=${leadId}` : `/share/${slug}`
                const response = await api.get(url)
                setData(response.data)
            } catch (err: unknown) {
                const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to load product";
                setError(errorMessage);
            } finally {
                setLoading(false)
            }
        }
        if (slug) fetchProduct()
    }, [slug, leadId])

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

    if (error) return (
        <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Product Not Found</h1>
            <p className="text-gray-500">{error}</p>
        </div>
    )

    if (!data) return null

    const { product, seller, shareConfig } = data
    const brochureType = product.brochureUrl?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'

    // Determine content to display
    const displayTitle = shareConfig?.customTitle || product.name
    const displayDescription = shareConfig?.customDescription || product.description

    // Helper to get YouTube Embed URL
    const getEmbedUrl = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    }

    const embedUrl = shareConfig?.youtubeUrl ? getEmbedUrl(shareConfig.youtubeUrl) : null

    return (
        <div className="min-h-screen bg-background font-sans">
            {/* Header */}
            <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Share2 className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-bold text-lg text-foreground">DadCRM</span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="grid gap-8 lg:grid-cols-3">

                    {/* Left Column: Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* YouTube Video Section */}
                        {embedUrl && (
                            <Card className="border-0 shadow-md overflow-hidden">
                                <div className="aspect-video w-full">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={embedUrl}
                                        title="Product Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </Card>
                        )}

                        <Card className="border-0 shadow-md overflow-hidden bg-card">
                            {/* Product Header / Image Placeholder */}
                            {!embedUrl && (
                                <div className="bg-muted h-48 md:h-64 flex items-center justify-center text-muted-foreground relative overflow-hidden">
                                    {product.imageUrl ? (
                                        <img src={getAssetUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-6">
                                            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">{product.name}</h1>
                                            {product.category && <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border-0">{product.category}</Badge>}
                                        </div>
                                    )}
                                </div>
                            )}

                            <CardContent className="p-6 md:p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{displayTitle}</h2>
                                        <p className="text-muted-foreground text-sm mt-1">Offered by {seller.firstName} {seller.lastName}</p>
                                    </div>
                                    <div className="text-3xl font-bold text-primary">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: product.currency }).format(product.basePrice)}
                                    </div>
                                </div>

                                <div className="prose max-w-none text-muted-foreground mb-8">
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
                                    <p>{displayDescription || "No description available."}</p>
                                </div>

                                {/* Brochure Section */}
                                {product.brochureUrl && (
                                    <div className="mt-8 pt-8 border-t border-border">
                                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            Product Brochure
                                        </h3>

                                        {brochureType === 'pdf' ? (
                                            <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-muted/20">
                                                <div className="aspect-[3/2] w-full relative group">
                                                    {/* We use an iframe to preview the PDF. For better UX, consider react-pdf */}
                                                    <iframe
                                                        src={`${getAssetUrl(product.brochureUrl)}#toolbar=0`}
                                                        className="w-full h-full"
                                                        title="Brochure Preview"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button asChild variant="secondary">
                                                            <a href={getAssetUrl(product.brochureUrl)} target="_blank" rel="noopener noreferrer">
                                                                <Download className="mr-2 h-4 w-4" /> Download Full PDF
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                                                <img
                                                    src={getAssetUrl(product.brochureUrl)}
                                                    alt="Brochure"
                                                    className="w-full h-auto"
                                                />
                                                <div className="p-3 bg-muted/20 border-t border-border flex justify-end">
                                                    <Button asChild variant="outline" size="sm">
                                                        <a href={getAssetUrl(product.brochureUrl)} target="_blank" rel="noopener noreferrer">
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
                                        <p className="font-medium text-foreground">{seller.firstName} {seller.lastName}</p>
                                        <p className="text-xs text-muted-foreground">Sales Representative</p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-4 border-t border-border">
                                    <Button className="w-full"><Mail className="mr-2 h-4 w-4" /> Send Email</Button>
                                    <Button variant="outline" className="w-full"><Phone className="mr-2 h-4 w-4" /> Request Call</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-muted/50 p-4 rounded-xl border border-border text-sm text-muted-foreground">
                            <p><strong>Note:</strong> This is a shared product view. Prices and availability are subject to change.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
