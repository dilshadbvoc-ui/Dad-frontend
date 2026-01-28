
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, Loader2, User, Building, Briefcase, FileText } from "lucide-react"
import { api } from "@/services/api"
import { useNavigate } from "react-router-dom"
// import { cn } from "@/lib/utils" // Unused

interface SearchResult {
    type: 'lead' | 'contact' | 'account' | 'opportunity'
    id: string
    title: string
    subtitle: string
}

export function GlobalSearch() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const navigate = useNavigate()
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSearch = (value: string) => {
        setQuery(value)
        if (value.length < 2) {
            setResults([])
            setShowResults(false)
            return
        }

        setIsLoading(true)
        setShowResults(true)

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current)
        }

        searchTimeout.current = setTimeout(async () => {
            try {
                const response = await api.get(`/search?q=${value}`)
                setResults(response.data.results)
            } catch (error) {
                console.error("Search failed", error)
            } finally {
                setIsLoading(false)
            }
        }, 300)
    }

    const handleSelect = (result: SearchResult) => {
        setShowResults(false)
        setQuery("") // Optional: clear query on selection
        switch (result.type) {
            case 'lead':
                navigate(`/leads/${result.id}`)
                break
            case 'contact':
                navigate(`/contacts?view=${result.id}`) // Contacts page handles view param? Or maybe just contacts
                break
            case 'account':
                navigate(`/accounts/${result.id}`)
                break
            case 'opportunity':
                // navigate(`/opportunities/${result.id}`) // If opportunity detail page exists
                navigate(`/opportunities`) // Fallback
                break
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'lead': return <User className="h-4 w-4 text-blue-500" />
            case 'contact': return <User className="h-4 w-4 text-green-500" />
            case 'account': return <Building className="h-4 w-4 text-purple-500" />
            case 'opportunity': return <Briefcase className="h-4 w-4 text-orange-500" />
            default: return <FileText className="h-4 w-4 text-gray-500" />
        }
    }

    return (
        <div ref={wrapperRef} className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search..."
                className="pl-8 bg-background"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => query.length >= 2 && setShowResults(true)}
            />

            {showResults && (query.length >= 2) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 border rounded-md shadow-lg z-50 max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 flex justify-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            {results.map((result) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
                                    onClick={() => handleSelect(result)}
                                >
                                    <div className="shrink-0 mt-0.5">
                                        {getIcon(result.type)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-sm truncate">{result.title}</div>
                                        <div className="text-xs text-muted-foreground truncate capitalize">{result.type} • {result.subtitle}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No results found.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
