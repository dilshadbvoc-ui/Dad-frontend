import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getProducts, createProduct, deleteProduct, type Product, type CreateProductData } from "@/services/productService"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Package, DollarSign, Tag, Trash2, MoreHorizontal } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ProductsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['products', searchQuery],
        queryFn: () => getProducts({ search: searchQuery }),
    })

    const products = data?.products || []

    const createMutation = useMutation({
        mutationFn: (data: CreateProductData) => createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            setIsDialogOpen(false)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteProduct(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        createMutation.mutate({
            name: formData.get('name') as string,
            sku: formData.get('sku') as string || undefined,
            basePrice: parseFloat(formData.get('basePrice') as string),
            category: formData.get('category') as string || undefined,
            description: formData.get('description') as string || undefined,
        })
    }

    const totalValue = products.reduce((acc: number, p: Product) => acc + p.basePrice, 0)
    const activeCount = products.filter((p: Product) => p.isActive).length

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Products</h1>
                                <p className="text-gray-500 mt-1">Manage your product catalog</p>
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleSubmit}>
                                        <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div><Label>Name</Label><Input name="name" required /></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label>SKU</Label><Input name="sku" placeholder="Optional" /></div>
                                                <div><Label>Price</Label><Input name="basePrice" type="number" step="0.01" required /></div>
                                            </div>
                                            <div><Label>Category</Label><Input name="category" /></div>
                                            <div><Label>Description</Label><Input name="description" /></div>
                                        </div>
                                        <DialogFooter><Button type="submit">Add Product</Button></DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Stats */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 border-blue-200"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><Package className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{products.length}</p><p className="text-xs text-blue-600">Total Products</p></div></CardContent></Card>
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 border-green-200"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center"><DollarSign className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">${totalValue.toFixed(2)}</p><p className="text-xs text-green-600">Total Catalog Value</p></div></CardContent></Card>
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 border-purple-200"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center"><Tag className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{activeCount}</p><p className="text-xs text-purple-600">Active Products</p></div></CardContent></Card>
                        </div>

                        {/* Search */}
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                        </div>

                        {/* Products Grid */}
                        {isLoading ? (
                            <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-12 text-gray-500"><Package className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No products found.</p></div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {products.map((product: Product) => (
                                    <Card key={product.id} className="hover:shadow-lg transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold">{product.name}</h3>
                                                    {product.sku && <p className="text-sm text-gray-500">SKU: {product.sku}</p>}
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate(product.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-xl font-bold text-green-600">${product.basePrice.toFixed(2)}</span>
                                                <Badge variant={product.isActive ? "default" : "secondary"}>{product.isActive ? "Active" : "Inactive"}</Badge>
                                            </div>
                                            {product.category && <Badge variant="outline" className="mt-2">{product.category}</Badge>}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
