import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { pdfBase64, text } = body as { pdfBase64?: string; text?: string };

    if (!pdfBase64 && !text) {
      return new Response(
        JSON.stringify({ error: "Provide pdfBase64 or text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert bank statement parser. Extract EVERY single transaction line from the provided bank statement. Do not skip any. Do not summarize. Do not invent.

For each transaction, return:
- date: YYYY-MM-DD (infer year from statement context if abbreviated)
- description: cleaned merchant/payee/narration text
- amount: absolute positive number (no currency symbols, no commas)
- type: "expense" for debits/withdrawals/payments/purchases, "income" for credits/deposits/salary/refunds. If the statement has explicit Debit/Credit or Money Out/Money In columns, use those.
- suggestedCategory: choose ONE
  - Expenses: "Food & Drinks", "Housing", "Transportation", "Entertainment", "Shopping", "Utilities", "Healthcare"
  - Income: "Salary", "Freelance", "Investments", "Gifts"

Return ONLY a JSON object, no markdown, no prose:
{"transactions":[{"date":"YYYY-MM-DD","description":"...","amount":0,"type":"expense","suggestedCategory":"..."}]}`;

    const userContent: any[] = [
      { type: "text", text: "Extract ALL transactions from this bank statement. Return every row." },
    ];

    if (pdfBase64) {
      userContent.push({
        type: "file",
        file: {
          filename: "statement.pdf",
          file_data: `data:application/pdf;base64,${pdfBase64}`,
        },
      });
    } else if (text) {
      userContent.push({ type: "text", text: `Statement text:\n\n${text.substring(0, 30000)}` });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to parse statement", details: errorText }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    console.log("AI raw content length:", content.length);

    let jsonStr = content.trim();
    const fenced = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) jsonStr = fenced[1].trim();
    // If still not pure JSON, try to extract the outermost { ... }
    if (!jsonStr.startsWith("{")) {
      const firstBrace = jsonStr.indexOf("{");
      const lastBrace = jsonStr.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
      }
    }

    try {
      const parsed = JSON.parse(jsonStr);
      const txns = Array.isArray(parsed.transactions) ? parsed.transactions : [];
      console.log("Parsed transactions count:", txns.length);
      return new Response(JSON.stringify({ transactions: txns }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (parseErr) {
      console.error("Failed to parse AI response as JSON:", content.substring(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: content.substring(0, 1000) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("parse-bank-statement error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
