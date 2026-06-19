import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { document_id, content, title, category, branch } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If content is provided directly (text-based upload), chunk and store
    if (!content) {
      return new Response(JSON.stringify({ error: "Content is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create document record if not exists
    let docId = document_id;
    if (!docId) {
      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({ title: title || "Untitled", category: category || "general", branch: branch || "All" })
        .select("id")
        .single();
      if (docError) throw docError;
      docId = doc.id;
    } else {
      // Clear existing chunks for re-indexing
      await supabase.from("document_chunks").delete().eq("document_id", docId);
    }

    // Split content into chunks (~500 words each)
    const words = content.split(/\s+/);
    const chunkSize = 500;
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(" ");
      if (chunk.trim()) chunks.push(chunk.trim());
    }

    // Insert chunks
    const docTitle = title || "Untitled";
    const chunkRecords = chunks.map((c, i) => ({
      document_id: docId,
      content: `[${docTitle}] ${c}`,
      chunk_index: i,
    }));

    const { error: chunkError } = await supabase
      .from("document_chunks")
      .insert(chunkRecords);

    if (chunkError) throw chunkError;

    return new Response(JSON.stringify({ 
      success: true, 
      document_id: docId, 
      chunks_created: chunks.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
