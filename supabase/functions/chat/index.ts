import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question } = await req.json();
    if (!question) throw new Error("Question is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract auth user (optional - guests can chat too)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      try {
        const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        userId = user?.id ?? null;
      } catch {
        // Guest user - no auth, that's fine
      }
    }

    // Search for relevant document chunks using full-text search
    const searchTerms = question
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w: string) => w.length > 2)
      .join(" | ");

    const { data: chunks } = await supabase
      .from("document_chunks")
      .select("content, document_id, documents(title, category, branch)")
      .textSearch("search_vector", searchTerms, { type: "plain" })
      .limit(8);

    // Also do a basic ILIKE fallback — search both chunks AND document titles
    let contextChunks = chunks || [];
    if (contextChunks.length === 0) {
      const keywords = question.split(/\s+/).filter((w: string) => w.length > 2).slice(0, 5);
      
      // Search chunk content
      for (const kw of keywords) {
        const { data } = await supabase
          .from("document_chunks")
          .select("content, document_id, documents(title, category, branch)")
          .ilike("content", `%${kw}%`)
          .limit(4);
        if (data) contextChunks.push(...data);
      }

      // If still nothing, search by document title and get their chunks
      if (contextChunks.length === 0) {
        for (const kw of keywords) {
          const { data: docs } = await supabase
            .from("documents")
            .select("id, title")
            .ilike("title", `%${kw}%`)
            .limit(3);
          if (docs && docs.length > 0) {
            const docIds = docs.map((d: any) => d.id);
            const { data: docChunks } = await supabase
              .from("document_chunks")
              .select("content, document_id, documents(title, category, branch)")
              .in("document_id", docIds)
              .limit(8);
            if (docChunks) contextChunks.push(...docChunks);
          }
        }
      }

      const seen = new Set();
      contextChunks = contextChunks.filter((c: any) => {
        if (seen.has(c.content)) return false;
        seen.add(c.content);
        return true;
      }).slice(0, 8);
    }

    const hasContext = contextChunks.length > 0;
    const contextText = contextChunks
      .map((c: any, i: number) => `[Source ${i + 1}: ${(c as any).documents?.title || "Unknown"}]\n${c.content}`)
      .join("\n\n---\n\n");

    const sources = contextChunks.map((c: any) => ({
      title: (c as any).documents?.title || "Unknown",
      category: (c as any).documents?.category || "",
      branch: (c as any).documents?.branch || "",
    }));

    const uniqueSources = sources.filter((s: any, i: number, arr: any[]) =>
      arr.findIndex((x: any) => x.title === s.title) === i
    );

    const systemPrompt = hasContext
      ? `You are the VIT Academic Intelligence Assistant — the official AI helper for Vishwakarma Institute of Technology (VIT), Pune.

ROLE & PERSONALITY:
- You are helpful, polite, and professional
- You speak like a knowledgeable campus advisor who genuinely cares about students
- You give clear, well-structured, and complete answers
- Use bullet points, numbered lists, and formatting to make answers easy to read
- Do NOT introduce yourself or say who you are in every response. Just answer the question directly.
- Only introduce yourself if the user explicitly asks "who are you" or "what is this"

STRICT RULES:
1. Answer ONLY from the provided context documents below. Never fabricate information.
2. Always cite the source document title when referencing information.
3. If the context partially answers the question, share what you found and clearly state what's missing.
4. For ambiguous questions, ask for clarification (e.g., "Which branch/year are you asking about?").

PRIVACY & SENSITIVITY RULES:
- NEVER share personal contact numbers, personal email addresses, or home addresses of any faculty or staff
- Official office/department phone numbers and official emails are OK to share
- Do NOT share internal administrative decisions, disciplinary records, or confidential notices
- Do NOT share salary, financial, or personal details of any individual
- If asked about sensitive/confidential info, politely decline: "I'm sorry, I cannot share that information as it is confidential. Please contact the relevant department directly."
- If asked about topics unrelated to VIT academics/campus, politely redirect: "I'm designed to help with VIT-related academic and campus queries. For other topics, I'd recommend using a general search engine."

HANDLING UNKNOWN/MISSING INFO:
- If you don't have the answer, say so honestly and suggest where to find it (e.g., "Please check with the Examination Department" or "Visit the VIT office at...")
- Never guess or make up facts

CONTEXT FROM OFFICIAL VIT DOCUMENTS:
${contextText}`
      : `You are the VIT Academic Intelligence Assistant for Vishwakarma Institute of Technology, Pune.

The user asked a question but NO relevant information was found in the uploaded VIT documents.

RESPOND WITH A HELPFUL, FRIENDLY MESSAGE:
- Acknowledge that the specific information isn't available yet in the system
- Suggest the user try rephrasing or ask about a related topic
- Recommend contacting the relevant VIT department if it's urgent
- If the question is completely unrelated to VIT/academics, politely explain your purpose

PRIVACY & SENSITIVITY RULES (still apply):
- Do NOT share any personal information about individuals
- Do NOT speculate about policies or rules not in the system
- Politely decline sensitive requests

Do NOT make up or guess any VIT-specific information.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    // Save query for logged-in users (fire and forget)
    if (userId) {
      // Saved via separate save-query call from client
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Sources": JSON.stringify(uniqueSources),
      },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
