import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, FileText, BookOpen, Scale, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const categories = [
  { label: "All", value: "all" },
  { label: "Syllabus", value: "syllabus" },
  { label: "Regulations", value: "regulation" },
  { label: "Notices", value: "notice" },
  { label: "Exam Rules", value: "exam" },
];

const iconMap: Record<string, any> = {
  syllabus: BookOpen,
  regulation: Scale,
  exam: FileText,
  notice: Bell,
  general: FileText,
};

const Knowledge = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      setDocuments(data || []);
      setLoading(false);
    };
    fetchDocs();
  }, []);

  const filtered = documents.filter(
    (d) =>
      (activeCategory === "all" || d.category === activeCategory) &&
      d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="py-12">
      <div className="container">
        <div className="mb-10">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-muted-foreground">Browse official VIT documents — syllabi, regulations, notices, and more.</p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="pl-10" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={activeCategory === cat.value ? "accent" : "secondary"}
                size="sm"
                onClick={() => setActiveCategory(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="mt-12 text-center text-muted-foreground">Loading documents...</p>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doc) => {
              const Icon = iconMap[doc.category] || FileText;
              return (
                <div key={doc.id} className="card-elevated flex gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent/40">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-foreground">{doc.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {doc.branch} · {doc.category}{doc.year ? ` · ${doc.year}` : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {documents.length === 0
                ? "No documents have been uploaded yet. Ask an admin to upload VIT documents."
                : "No documents found matching your search."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Knowledge;
