import { Link } from "react-router-dom"
import { BookOpen, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DOC_CATEGORIES, WHATSAPP_DOCS } from "@/data/whatsappDocs"

export default function DocsIndexPage() {
  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <BookOpen className="h-4 w-4" /> Documentation
        </div>
        <h1 className="text-3xl font-bold">Product Documentation</h1>
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
                  <Card className="h-full hover:border-primary/50 hover:shadow-sm transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{article.title}</CardTitle>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      </div>
                      <CardDescription>{article.summary}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="gap-1 text-xs font-normal text-muted-foreground">
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
