import { Link, Navigate, useParams } from "react-router-dom"
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { getDocBySlug, WHATSAPP_DOCS, type DocSection } from "@/data/whatsappDocs"

function Callout({ callout }: { callout: NonNullable<DocSection["callout"]> }) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-900/10 dark:border-blue-900 dark:text-blue-300",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/10 dark:border-amber-900 dark:text-amber-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/10 dark:border-emerald-900 dark:text-emerald-300",
  }
  const Icon = callout.type === "warning" ? AlertTriangle : callout.type === "success" ? CheckCircle2 : Info
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm my-4", styles[callout.type])}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{callout.text}</span>
    </div>
  )
}

export default function DocArticlePage() {
  const { slug } = useParams()
  const article = getDocBySlug(slug || "")

  if (!article) {
    return <Navigate to="/docs" replace />
  }

  const categoryArticles = WHATSAPP_DOCS.filter((d) => d.category === article.category)
  const relatedArticles = (article.related || [])
    .map((s) => WHATSAPP_DOCS.find((d) => d.slug === s))
    .filter(Boolean)

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 shrink-0 border-r overflow-y-auto p-4 hidden md:block">
        <Link to="/docs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> All Docs
        </Link>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{article.category}</p>
        <nav className="space-y-0.5">
          {categoryArticles.map((a) => (
            <Link
              key={a.slug}
              to={`/docs/${a.slug}`}
              className={cn(
                "block rounded-[8px] px-2 py-1.5 text-sm transition-colors",
                a.slug === article.slug
                  ? "bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {a.title}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 md:p-10">
          <Link to="/docs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 md:hidden">
            <ArrowLeft className="h-3.5 w-3.5" /> All Docs
          </Link>

          <div className="flex items-center gap-2 text-[hsl(var(--chart-5))] text-sm font-semibold mb-2">
            <BookOpen className="h-4 w-4" /> {article.category}
          </div>
          <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
          <p className="text-muted-foreground mb-3">{article.summary}</p>
          <Badge variant="outline" className="gap-1 text-xs font-normal text-muted-foreground mb-8 rounded-[6px]">
            <Clock className="h-3 w-3" /> {article.readTime}
          </Badge>

          <div className="space-y-8">
            {article.sections.map((section, idx) => (
              <section key={idx}>
                <h2 className="text-xl font-semibold mb-3">{section.heading}</h2>
                {section.body.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-3">
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="space-y-1.5 my-3 list-disc pl-5">
                    {section.bullets.map((b, i) => (
                      <li key={i} className="text-sm leading-relaxed text-foreground/90">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {section.callout && <Callout callout={section.callout} />}
              </section>
            ))}
          </div>

          {relatedArticles.length > 0 && (
            <div className="mt-12 pt-6 border-t">
              <p className="text-sm font-semibold mb-3">Related articles</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {relatedArticles.map((a) => (
                  <Link
                    key={a!.slug}
                    to={`/docs/${a!.slug}`}
                    className="text-sm rounded-[10px] border p-3 hover:border-[hsl(var(--chart-5))]/40 hover:bg-muted/50 transition-colors"
                  >
                    {a!.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
