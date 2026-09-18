import { copyToClipboard, getUserInfo, isOrgAdmin } from "@/lib/utils";
import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as XLSX from "xlsx"
import { getProducts, createProduct, deleteProduct, uploadBrochure, generateShareLink, updateProduct, type Product, type CreateProductData } from "@/services/productService"
import { getLeads, type Lead } from "@/services/leadService"
import { getAssetUrl } from "@/lib/utils"
import { useCurrency } from "@/contexts/CurrencyContext"
import { formatIST } from "@/lib/dateUtils"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus, Search, Package, Tag, Trash2, MoreHorizontal, Share2,
  FileText, Copy, Check, Edit, Download, Filter, X
} from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEntityTotalCount } from "@/hooks/useEntityTotalCount"
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"
import { FILTER_CARD_CLASS, FILTER_ICON_CLASS, FILTER_LABEL_CLASS, FILTER_TRIGGER_CLASS } from "@/pages/leads/filterStyles"

type StatusFilter = "all" | "active" | "inactive"

export default function ProductsPage() {
  const user = getUserInfo();
  const orgAdmin = isOrgAdmin(user);
  const { formatCurrency } = useCurrency()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  // Share Dialog States
  const [isShareConfigOpen, setIsShareConfigOpen] = useState(false)
  const [isShareResultOpen, setIsShareResultOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<string>("none")
  const [shareConfig, setShareConfig] = useState({
    youtubeUrl: "",
    customTitle: "",
    customDescription: ""
  })

  const [sharedLinkData, setSharedLinkData] = useState<{ url: string, slug: string, youtubeUrl?: string, customTitle?: string, customDescription?: string, views?: number } | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['products', searchQuery],
    queryFn: () => getProducts({ search: searchQuery, limit: 200 }),
  })

  const allProducts: Product[] = useMemo(() => data?.products || [], [data])
  const productsTotalCount = useEntityTotalCount('products', '/products')

  const categories = useMemo(() => {
    const set = new Set<string>()
    allProducts.forEach(p => { if (p.category) set.add(p.category) })
    return Array.from(set).sort()
  }, [allProducts])

  const hasActiveFilters = categoryFilter !== "all" || statusFilter !== "all"

  const clearFilters = () => {
    setCategoryFilter("all")
    setStatusFilter("all")
  }

  const products = useMemo(() => {
    return allProducts.filter(p => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false
      if (statusFilter === "active" && !p.isActive) return false
      if (statusFilter === "inactive" && p.isActive) return false
      return true
    })
  }, [allProducts, categoryFilter, statusFilter])

  const createMutation = useMutation({
    mutationFn: (data: CreateProductData) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsDialogOpen(false)
      toast.success("Product created successfully")
    },
    onError: (error: { response?: { data?: { message?: string } } }) => toast.error(error.response?.data?.message || "Failed to create product")
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<CreateProductData> }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsEditDialogOpen(false)
      setEditingProduct(null)
      toast.success("Product updated successfully")
    },
    onError: (error: { response?: { data?: { message?: string } }, message?: string }) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update product";
      console.error("Update error:", error);
      toast.error(errorMessage);
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success("Product deleted")
      setDeletingProduct(null)
    },
    onError: () => toast.error("Failed to delete product")
  })

  const shareMutation = useMutation({
    mutationFn: (data: { id: string, config: Record<string, unknown> }) => generateShareLink(data.id, data.config),
    onSuccess: (data) => {
      // Append leadId if selected
      let finalUrl = data.url
      if (selectedLeadId && selectedLeadId !== "none") {
        finalUrl += `?leadId=${selectedLeadId}`
      }
      setSharedLinkData({ ...data, url: finalUrl })
      setIsShareConfigOpen(false)
      setIsShareResultOpen(true)
      setIsCopied(false)
    },
    onError: () => toast.error("Failed to generate share link")
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Handle Brochure Upload
    const brochureFile = formData.get('brochure') as File
    let brochureUrl = undefined

    if (brochureFile && brochureFile.size > 0) {
      try {
        const uploadRes = await uploadBrochure(brochureFile)
        brochureUrl = uploadRes.url
      } catch (error: any) {
        const errorMessage = error.message || "Failed to upload brochure";
        toast.error(errorMessage);
        return
      }
    }

    createMutation.mutate({
      name: formData.get('name') as string,
      sku: formData.get('sku') as string || undefined,
      basePrice: parseFloat(formData.get('basePrice') as string) || 0,
      category: formData.get('category') as string || undefined,
      description: formData.get('description') as string || undefined,
      isCustom: formData.get('isCustom') === 'on',
      isActive: formData.get('isActive') === 'on',
      brochureUrl
    })
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingProduct) return

    const formData = new FormData(e.currentTarget)

    // Handle Brochure Upload
    const brochureFile = formData.get('brochure') as File
    let brochureUrl = editingProduct.brochureUrl // Keep existing brochure by default

    if (brochureFile && brochureFile.size > 0) {
      try {
        const uploadRes = await uploadBrochure(brochureFile)
        brochureUrl = uploadRes.url
      } catch (error: any) {
        const errorMessage = error.message || "Failed to upload brochure";
        console.error("Brochure upload error:", error);
        toast.error(errorMessage);
        return
      }
    }

    const updateData: Partial<CreateProductData> = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string || undefined,
      basePrice: parseFloat(formData.get('basePrice') as string) || 0,
      category: formData.get('category') as string || undefined,
      description: formData.get('description') as string || undefined,
      isCustom: formData.get('isCustom') === 'on',
      isActive: formData.get('isActive') === 'on',
    };

    // Only include brochureUrl if it exists
    if (brochureUrl) {
      updateData.brochureUrl = brochureUrl;
    }

    updateMutation.mutate({
      id: editingProduct.id,
      data: updateData
    })
  }

  const handleEditClick = (product: Product) => {
    setEditingProduct(product)
    setIsEditDialogOpen(true)
  }

  const handleShareClick = async (product: Product) => {
    setSelectedProductId(product.id)
    setSelectedLeadId("none")
    setSharedLinkData(null) // Reset previous share data

    // Fetch leads
    try {
      const leadsData = await getLeads({ limit: 100 }) // Fetch top 100 leads for now
      setLeads(leadsData.leads || [])
    } catch (error) {
      console.error("Failed to fetch leads", error)
    }

    // Reset to defaults first
    setShareConfig({
      youtubeUrl: "",
      customTitle: product.name,
      customDescription: product.description || ""
    })

    try {
      // Fetch existing share config
      const { getShareConfig } = await import("@/services/productService");
      const existingConfig = await getShareConfig(product.id);

      if (existingConfig.slug) {
        setShareConfig({
          youtubeUrl: existingConfig.youtubeUrl || "",
          customTitle: existingConfig.customTitle || product.name,
          customDescription: existingConfig.customDescription || product.description || ""
        })
        setSharedLinkData(existingConfig) // Set existing link data so we can show result immediately if wanted, but for now just prep config
      }
    } catch (error) {
      console.error("Failed to fetch share config", error)
    }

    setIsShareConfigOpen(true)
  }

  const handleGenerateLink = () => {
    if (!selectedProductId) return

    // Include leadId in config if selected
    const configWithLead = {
      ...shareConfig,
      ...(selectedLeadId && selectedLeadId !== "none" ? { leadId: selectedLeadId } : {})
    }

    shareMutation.mutate({
      id: selectedProductId,
      config: configWithLead
    })
  }

  const handleCopy = () => {
    if (sharedLinkData?.url) {
      copyToClipboard(sharedLinkData.url)
      setIsCopied(true)
      toast.success("Link copied to clipboard")
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleExport = () => {
    if (products.length === 0) return

    const excelData = products.map((p) => ({
      'Name': p.name,
      'SKU': p.sku || '',
      'Category': p.category || '',
      'Price': p.isCustom ? 'Custom' : p.basePrice,
      'Status': p.isActive ? 'Active' : 'Inactive',
      'Created At': p.createdAt ? formatIST(p.createdAt, 'yyyy-MM-dd HH:mm:ss') : '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')
    XLSX.writeFile(workbook, `products_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const totalValue = products.reduce((acc: number, p: Product) => acc + (p.isCustom ? 0 : p.basePrice), 0)
  const activeCount = products.filter((p: Product) => p.isActive).length

  const stats = [
    { label: "Total Products", value: products.length, sub: "In your catalog", accent: "bg-[hsl(var(--chart-5))]" },
    { label: "Catalog Value", value: formatCurrency(totalValue), sub: "Sum of fixed prices", accent: "bg-[hsl(var(--chart-2))]" },
    { label: "Active", value: activeCount, sub: "Currently sellable", accent: "bg-amber-500" },
  ]

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
            <Package className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight flex items-center gap-2.5">
              Products
              <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-sm font-bold">
                {allProducts.length.toLocaleString()}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage your product catalog
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            disabled={products.length === 0}
            variant="outline"
            className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          {orgAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-semibold bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/90">
                  <Plus className="h-3.5 w-3.5" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>Create a new product with details and optional brochure.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div><Label>Name</Label><Input name="name" required /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label>SKU</Label><Input name="sku" placeholder="Optional" /></div>
                      <div><Label>Price</Label><Input name="basePrice" type="number" step="0.01" required /></div>
                    </div>
                    <div><Label>Category</Label><Input name="category" /></div>
                    <div><Label>Description</Label><Input name="description" /></div>
                    <div className="flex items-center gap-2 pt-2">
                      <input type="checkbox" name="isCustom" id="isCustom-add" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <Label htmlFor="isCustom-add" className="cursor-pointer">Custom Price (Price will be entered at time of sale)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" name="isActive" id="isActive-add" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <Label htmlFor="isActive-add" className="cursor-pointer">Active (visible for use immediately)</Label>
                    </div>
                    <div>
                      <Label>Brochure (PDF/Image)</Label>
                      <Input name="brochure" type="file" accept=".pdf,image/*" className="cursor-pointer" />
                      <p className="text-xs text-muted-foreground mt-1">Upload a product brochure to share with customers.</p>
                    </div>
                  </div>
                  <DialogFooter><Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Add Product'}</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* Edit Product Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleEditSubmit}>
                <DialogHeader>
                  <DialogTitle>Edit Product</DialogTitle>
                  <DialogDescription>Update product details including name, price, category, and brochure.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div><Label>Name</Label><Input name="name" defaultValue={editingProduct?.name} required /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>SKU</Label><Input name="sku" defaultValue={editingProduct?.sku} placeholder="Optional" /></div>
                    <div><Label>Price</Label><Input name="basePrice" type="number" step="0.01" defaultValue={editingProduct?.basePrice} required /></div>
                  </div>
                  <div><Label>Category</Label><Input name="category" defaultValue={editingProduct?.category} /></div>
                  <div><Label>Description</Label><Input name="description" defaultValue={editingProduct?.description} /></div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      name="isCustom"
                      id="isCustom-edit"
                      defaultChecked={editingProduct?.isCustom}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isCustom-edit" className="cursor-pointer">Custom Price (Price will be entered at time of sale)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      id="isActive-edit"
                      defaultChecked={editingProduct?.isActive ?? true}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isActive-edit" className="cursor-pointer">Active (uncheck to retire this product without deleting it)</Label>
                  </div>
                  <div>
                    <Label>Brochure (PDF/Image)</Label>
                    {editingProduct?.brochureUrl && (
                      <div className="mb-2 text-sm text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Current: {editingProduct.brochureUrl.split('/').pop()}</span>
                      </div>
                    )}
                    <Input name="brochure" type="file" accept=".pdf,image/*" className="cursor-pointer" />
                    <p className="text-xs text-muted-foreground mt-1">Upload a new brochure to replace the existing one (optional).</p>
                  </div>
                </div>
                <DialogFooter><Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Updating...' : 'Update Product'}</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Share Configuration Dialog */}
          <Dialog open={isShareConfigOpen} onOpenChange={setIsShareConfigOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex justify-between items-center">
                  Customize Share Link
                  {sharedLinkData?.views !== undefined && (
                    <Badge variant="secondary" className="ml-2">
                      {sharedLinkData.views} Views
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>Configure your shareable product link with custom content and tracking.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Select Lead (Optional)</Label>
                  <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lead to track views" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Generic Link)</SelectItem>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.firstName} {lead.lastName} {lead.company ? `(${lead.company})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">If selected, you'll be notified when this specific lead views the product.</p>
                </div>
                <div>
                  <Label>YouTube Video URL (Optional)</Label>
                  <Input
                    placeholder="https://youtu.be/..."
                    value={shareConfig.youtubeUrl}
                    onChange={(e) => setShareConfig({ ...shareConfig, youtubeUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Video will be embedded on the shared page.</p>
                </div>
                <div>
                  <Label>Custom Title</Label>
                  <Input
                    value={shareConfig.customTitle}
                    onChange={(e) => setShareConfig({ ...shareConfig, customTitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Custom Description</Label>
                  <Input
                    value={shareConfig.customDescription}
                    onChange={(e) => setShareConfig({ ...shareConfig, customDescription: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleGenerateLink} disabled={shareMutation.isPending}>
                  {shareMutation.isPending ? 'Generating...' : 'Generate Link'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Share Result Dialog */}
          <Dialog open={isShareResultOpen} onOpenChange={setIsShareResultOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Share Product</DialogTitle>
                <DialogDescription>Copy this link to share your product with customers.</DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="link" className="sr-only">Link</Label>
                  <Input id="link" defaultValue={sharedLinkData?.url} readOnly />
                </div>
                <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
                  <span className="sr-only">Copy</span>
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <DialogFooter className="sm:justify-start">
                <div className="text-sm text-muted-foreground">
                  Anyone with this link can view the product details, video, and brochure.
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats row */}
      <div className="rounded-[10px] bg-card border border-border overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {stats.map((tile) => (
            <div key={tile.label} className="relative flex flex-col items-center justify-center gap-1 px-4 py-4">
              <span className={`absolute top-0 left-0 right-0 h-0.5 ${tile.accent} opacity-70`} />
              <span className="text-xs font-poppins text-muted-foreground">{tile.label}</span>
              <span className="text-xl sm:text-2xl font-medium font-poppins text-black">{tile.value}</span>
              <span className="text-[11px] text-muted-foreground">{tile.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <div className={FILTER_CARD_CLASS}>
          <Search className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Search</label>
            <input
              placeholder="Name, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 p-0 text-sm font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <Tag className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="all" className="rounded-lg">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c} className="rounded-lg">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <Filter className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Status</label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="all" className="rounded-lg">All</SelectItem>
                <SelectItem value="active" className="rounded-lg">Active</SelectItem>
                <SelectItem value="inactive" className="rounded-lg">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-3 -mt-1">
          <Button variant="ghost" onClick={clearFilters} className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10 rounded-[10px] font-bold gap-1.5">
            <X className="h-3.5 w-3.5" />
            Reset Filters
          </Button>
          <span className="text-xs text-muted-foreground">
            Showing {products.length} of {allProducts.length} products
          </span>
        </div>
      )}
      {!hasActiveFilters && !isLoading && (
        <p className="text-xs text-muted-foreground -mt-1">
          Showing {products.length.toLocaleString()} products
          {typeof productsTotalCount === 'number' && productsTotalCount !== products.length && (
            <> ({productsTotalCount.toLocaleString()} total)</>
          )}
        </p>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--chart-5))]" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[14px] border border-border bg-card">
          <div className="h-12 w-12 rounded-[10px] bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Package className="h-6 w-6" />
          </div>
          <p className="font-semibold text-lg text-foreground">
            {hasActiveFilters || searchQuery ? "No matching products" : "No products yet"}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            {hasActiveFilters || searchQuery ? "Try adjusting your search or filters." : "Add your first product to start building your catalog."}
          </p>
          {hasActiveFilters ? (
            <Button variant="ghost" onClick={clearFilters} className="mt-4 h-8 px-3 text-xs rounded-[10px] font-bold text-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/10">
              Clear filters
            </Button>
          ) : orgAdmin && (
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4 h-9 rounded-[10px] gap-2 text-sm font-semibold bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/90">
              <Plus className="h-3.5 w-3.5" />
              Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product: Product) => (
            <Card
              key={product.id}
              className={`hover:shadow-lg transition-shadow ${!product.isActive ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                    {product.sku && <p className="text-sm text-muted-foreground truncate">SKU: {product.sku}</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {orgAdmin && (
                        <DropdownMenuItem onClick={() => handleEditClick(product)}>
                          <Edit className="h-4 w-4 mr-2" />Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleShareClick(product)}>
                        <Share2 className="h-4 w-4 mr-2" />Share
                      </DropdownMenuItem>
                      {product.brochureUrl && (
                        <DropdownMenuItem onClick={() => window.open(getAssetUrl(product.brochureUrl), '_blank')}>
                          <FileText className="h-4 w-4 mr-2" />View Brochure
                        </DropdownMenuItem>
                      )}
                      {orgAdmin && (
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => setDeletingProduct(product)}>
                          <Trash2 className="h-4 w-4 mr-2" />Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-xl font-bold text-[hsl(var(--chart-5))]">
                    {product.isCustom ? "Custom Price" : formatCurrency(product.basePrice)}
                  </span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {product.isCustom && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Custom</Badge>}
                    <Badge variant={product.isActive ? "default" : "secondary"}>{product.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>
                {product.category && <Badge variant="outline" className="mt-2">{product.category}</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmationDialog
        open={!!deletingProduct}
        onOpenChange={(open) => { if (!open) setDeletingProduct(null) }}
        onConfirm={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
        title="Delete Product"
        description={`Are you sure you want to delete "${deletingProduct?.name}"? This action cannot be undone. If this product is only temporarily unavailable, consider marking it Inactive instead.`}
        confirmText="Delete Product"
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
