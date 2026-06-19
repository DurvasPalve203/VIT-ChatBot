import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUp, Users, BarChart3, Database, Loader2, Trash2, Upload, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { extractTextFromFile } from "@/lib/extractText";

const Admin = () => {
  const { user, userRole, viewMode, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);

  // Upload form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("syllabus");
  const [branch, setBranch] = useState("All");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || userRole !== "admin" || viewMode !== "admin")) {
      toast.error("Admin access required");
      navigate("/");
    }
  }, [user, userRole, viewMode, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    const [docsRes, queriesRes] = await Promise.all([
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase.from("queries").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setDocuments(docsRes.data || []);
    setQueries(queriesRes.data || []);
  }, []);

  useEffect(() => {
    if (user && userRole === "admin") fetchData();
  }, [user, userRole, fetchData]);

  const handleUpload = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setUploading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-document", {
        body: { title, category, branch, content },
      });
      if (error) throw error;
      toast.success(`Document indexed! ${data.chunks_created} chunks created.`);
      setTitle("");
      setContent("");
      setFileName("");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to process document");
    }
    setUploading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setParsingFile(true);
    setFileName(file.name);
    const autoTitle = title.trim() || file.name.replace(/\.[^.]+$/, "");
    try {
      const text = await extractTextFromFile(file);
      if (!text) {
        toast.error("No text could be extracted from this file.");
        setParsingFile(false);
        return;
      }
      setContent(text);
      setTitle(autoTitle);
      toast.success(`Extracted ${text.split(/\s+/).length} words. Indexing…`);
      setParsingFile(false);

      // Auto-upload right after extraction
      setUploading(true);
      try {
        const { data, error } = await supabase.functions.invoke("process-document", {
          body: { title: autoTitle, category, branch, content: text },
        });
        if (error) throw error;
        toast.success(`✓ ${file.name} indexed (${data.chunks_created} chunks)`);
        setTitle("");
        setContent("");
        setFileName("");
        fetchData();
      } catch (err: any) {
        toast.error(err.message || "Failed to index document");
      } finally {
        setUploading(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to parse file");
      setParsingFile(false);
    }
  };

  const handleDelete = async (docId: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", docId);
    if (error) {
      toast.error("Failed to delete document");
    } else {
      toast.success("Document deleted");
      fetchData();
    }
  };

  if (authLoading || userRole !== "admin" || viewMode !== "admin") return null;

  return (
    <main className="py-12">
      <div className="container max-w-5xl">
        <div className="mb-10">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage documents, users, and system analytics.</p>
        </div>

        {/* Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <div className="card-elevated flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
              <Database className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{documents.length}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
          </div>
          <div className="card-elevated flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{queries.length}</p>
              <p className="text-xs text-muted-foreground">Total Queries</p>
            </div>
          </div>
          <div className="card-elevated flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload */}
          <div className="card-elevated rounded-xl border border-border bg-card p-6">
            <h2 className="mb-1 font-display text-lg font-semibold text-foreground">Upload Document</h2>
            <p className="mb-4 text-sm text-muted-foreground">Drop a PDF, DOCX, TXT or MD file — we'll detect the format, extract the text, and index it automatically.</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="syllabus">Syllabus</SelectItem>
                      <SelectItem value="regulation">Regulation</SelectItem>
                      <SelectItem value="exam">Exam Rules</SelectItem>
                      <SelectItem value="notice">Notice</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Branch</Label>
                  <Select value={branch} onValueChange={setBranch}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Computer">Computer</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="EnTC">EnTC</SelectItem>
                      <SelectItem value="Mechanical">Mechanical</SelectItem>
                      <SelectItem value="Civil">Civil</SelectItem>
                      <SelectItem value="AI-DS">AI & DS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background px-4 py-10 text-center text-sm transition hover:border-accent hover:bg-muted/40 ${(parsingFile || uploading) ? "pointer-events-none opacity-70" : "cursor-pointer"}`}>
                {parsingFile ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    <span className="font-medium text-foreground">Reading {fileName}…</span>
                    <span className="text-xs text-muted-foreground">Extracting text from your file</span>
                  </>
                ) : uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    <span className="font-medium text-foreground">Indexing {fileName}…</span>
                    <span className="text-xs text-muted-foreground">Saving chunks to the knowledge base</span>
                  </>
                ) : (
                  <>
                    <FileUp className="h-8 w-8 text-accent" />
                    <span className="font-medium text-foreground">Click to upload a file</span>
                    <span className="text-xs text-muted-foreground">PDF · DOCX · TXT · MD — auto-detected</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={parsingFile || uploading}
                />
              </label>

              <details className="rounded-md border border-border bg-background/50 p-3 text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Or paste text manually</summary>
                <div className="mt-3 space-y-2">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste document text here…"
                    rows={6}
                  />
                  <Button variant="accent" className="w-full" onClick={handleUpload} disabled={uploading}>
                    {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Upload className="mr-2 h-4 w-4" /> Upload & Index Text</>}
                  </Button>
                </div>
              </details>
            </div>
          </div>

          {/* Document list */}
          <div className="card-elevated rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Documents ({documents.length})</h2>
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {documents.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No documents yet. Upload your first one!</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.branch} · {doc.category}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent queries */}
        {queries.length > 0 && (
          <div className="mt-6 card-elevated rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Recent Queries</h2>
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {queries.map((q) => (
                <div key={q.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{q.question}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{q.response}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Admin;
