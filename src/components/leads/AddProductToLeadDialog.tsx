import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Check, ShoppingCart, Trash2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Product {
    id: string
    name: string
    basePrice: number
    sku: string
}

interface AddProductToLeadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    leadId: string
    currentProducts?: { productId: string, quantity: number, product?: Product }[]
    onSuccess: () => void
}

export function AddProductToLeadDialog({
    open,
    onOpenChange,
    leadId,
    currentProducts = [],
    onSuccess
}: AddProductToLeadDialogProps) {
    // Local state for selected products management
    // We start with existing products if any
    const [selectedProducts, setSelectedProducts] = useState<{ productId: string, product: Product, quantity: number }[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            if (currentProducts.length > 0) {
                // Map existing products to state
                const mapped = currentProducts.map(p => ({
                    productId: p.productId,
                    product: p.product as Product, // Assumes product relation is populated
                    quantity: p.quantity
                })).filter(p => p.product) // Safety check
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedProducts(mapped)
            } else {
                setSelectedProducts([])
            }
        }
    }, [open, currentProducts])

    const { data: availableProducts } = useQuery({
        queryKey: ['products'],
        queryFn: async () => (await api.get('/products')).data
    })

    const handleAddProduct = (product: Product) => {
        // Check if already added
        if (selectedProducts.find(p => p.productId === product.id)) {
            toast.info("Product already added")
            return
        }
        setSelectedProducts([...selectedProducts, { productId: product.id, product, quantity: 1 }])
    }

    const handleRemoveProduct = (productId: string) => {
        setSelectedProducts(selectedProducts.filter(p => p.productId !== productId))
    }

    const handleQuantityChange = (productId: string, qty: number) => {
        if (qty < 1) return
        setSelectedProducts(selectedProducts.map(p =>
            p.productId === productId ? { ...p, quantity: qty } : p
        ))
    }

    const calculateTotal = () => {
        return selectedProducts.reduce((sum, item) => sum + (item.product.basePrice * item.quantity), 0)
    }

    const handleSubmit = async () => {
        try {
            const payload = {
                products: selectedProducts.map(p => ({
                    productId: p.productId,
                    quantity: p.quantity
                }))
            }

            await api.put(`/leads/${leadId}`, payload)
            
            if (selectedProducts.length === 0) {
                toast.success("All products removed successfully")
            } else {
                toast.success("Products updated successfully")
            }
            
            onOpenChange(false)
            onSuccess()
        } catch (error) {
            toast.error("Failed to update products")
            console.error(error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Manage Products</DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex gap-6 overflow-hidden pt-4">
                    {/* Left: Product Selection */}
                    <div className="w-1/2 flex flex-col border rounded-md">
                        <div className="p-3 bg-muted/50 border-b font-medium text-sm">
                            Available Products
                        </div>
                        <div className="p-2 border-b">
                            <div className="flex items-center border rounded-md px-3">
                                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                                <Input
                                    className="border-none shadow-none focus-visible:ring-0 p-0 h-9"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-1">
                                {availableProducts?.products?.filter((p: Product) =>
                                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
                                ).length === 0 ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">No products found.</div>
                                ) : (
                                    availableProducts?.products?.filter((p: Product) =>
                                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
                                    ).map((product: Product) => {
                                        const isSelected = selectedProducts.some(p => p.productId === product.id)
                                        return (
                                            <div
                                                key={product.id}
                                                onClick={() => !isSelected && handleAddProduct(product)}
                                                className={cn(
                                                    "flex items-center justify-between p-2 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm",
                                                    isSelected && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <div className="flex flex-col">
                                                    <span>{product.name}</span>
                                                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">
                                                        ${product.basePrice}
                                                    </span>
                                                    {isSelected && <Check className="h-4 w-4 text-success" />}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right: Selected Products */}
                    <div className="w-1/2 flex flex-col border rounded-md">
                        <div className="p-3 bg-muted/50 border-b font-medium text-sm flex justify-between">
                            <span>Selected Items ({selectedProducts.length})</span>
                            <span>Total: ${calculateTotal().toLocaleString()}</span>
                        </div>
                        <ScrollArea className="flex-1 p-2">
                            {selectedProducts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <ShoppingCart className="h-10 w-10 mb-2" />
                                    <p className="text-sm">No products selected</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedProducts.map((item) => (
                                        <div key={item.productId} className="flex gap-2 items-start border p-2 rounded-md bg-card">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{item.product.name}</div>
                                                <div className="text-xs text-muted-foreground">Price: ${item.product.basePrice}</div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                                                        className="h-7 w-16 text-center px-1"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRemoveProduct(item.productId)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="text-sm font-bold">
                                                    ${(item.product.basePrice * item.quantity).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
