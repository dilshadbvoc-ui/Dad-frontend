import { Link } from "react-router-dom"
import { BookOpen, Clock, ArrowRight, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DOC_CATEGORIES, WHATSAPP_DOCS } from "@/data/whatsappDocs"

export default function DocsIndexPage() {
  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      <div>
        <Link to="/training" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Training
        </Link>
        <div className="flex items-center gap-2 text-[hsl(var(--chart-5))] text-sm font-semibold mb-2">
          <BookOpen className="h-4 w-4" /> Documentation
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Product Documentation
        </h1>
        <p className="text-muted-foreground mt-1">
          Detailed setup guides and reference docs, organized by feature area.
        </p>
      </div>

      {DOC_CATEGORIES.map((category) => {
        const articles = WHATSAPP_DOCS.filter((d) => d.category === category)
        return (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold">{category}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {articles.map((article) => (
                <Link key={article.slug} to={`/docs/${article.slug}`}>
                  <Card className="h-full rounded-[10px] hover:shadow-md hover:border-[hsl(var(--chart-5))]/40 transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{article.title}</CardTitle>
                        <ArrowRight className="h-4 w-4 text-[hsl(var(--chart-5))] shrink-0 mt-1" />
                      </div>
                      <CardDescription>{article.summary}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="gap-1 text-xs font-normal text-muted-foreground rounded-[6px]">
                        <Clock className="h-3 w-3" /> {article.readTime}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
