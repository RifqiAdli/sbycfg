import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { jsonData } = await req.json();
    
    console.log("Received JSON data for validation:", typeof jsonData);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Anda adalah validator JSON untuk data Semboyan Kereta Api Indonesia. 
    
Tugas Anda:
1. Validasi dan perbaiki format JSON yang diberikan
2. Pastikan setiap item memiliki field yang diperlukan:
   - Nama (string, required) - nama semboyan
   - Gambar (string, optional) - URL gambar atau rbxassetid://ID
   - Sifat (string, required) - harus salah satu dari: "Sementara", "Tetap", "Khusus"
   - Status (string, required) - harus salah satu dari: "Aktif", "Tidak Aktif"
   - Penjelasan (string, required) - deskripsi semboyan
3. Tambahkan field yang kurang dengan nilai default yang masuk akal
4. Perbaiki kesalahan ejaan pada nilai Sifat dan Status
5. Hapus field yang tidak diperlukan

PENTING: Respond HANYA dengan JSON array yang sudah divalidasi. Tidak perlu penjelasan tambahan.
Jika data tidak bisa diperbaiki, kembalikan array kosong [].`;

    const userMessage = `Validasi dan perbaiki JSON berikut:\n\n${JSON.stringify(jsonData, null, 2)}`;

    console.log("Calling AI gateway for validation...");
    
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
          { role: "user", content: userMessage },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit tercapai, coba lagi nanti.",
          validatedData: null 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Kuota AI habis, silakan tambahkan kredit.",
          validatedData: null 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "[]";
    
    console.log("AI response received:", aiContent.substring(0, 200));
    
    // Parse the AI response - extract JSON from the response
    let validatedData;
    try {
      // Try to find JSON array in the response
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        validatedData = JSON.parse(jsonMatch[0]);
      } else {
        validatedData = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      validatedData = [];
    }

    // Ensure it's an array
    if (!Array.isArray(validatedData)) {
      validatedData = [];
    }

    // Add IDs if missing
    validatedData = validatedData.map((item: any, index: number) => ({
      id: item.id || `imported_${Date.now()}_${index}`,
      Nama: item.Nama || `Semboyan ${index + 1}`,
      Gambar: item.Gambar || "",
      Sifat: ["Sementara", "Tetap", "Khusus"].includes(item.Sifat) ? item.Sifat : "Sementara",
      Status: ["Aktif", "Tidak Aktif"].includes(item.Status) ? item.Status : "Aktif",
      Penjelasan: item.Penjelasan || "",
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    console.log(`Validated ${validatedData.length} items`);

    return new Response(JSON.stringify({ 
      validatedData,
      originalCount: Array.isArray(jsonData) ? jsonData.length : 1,
      validatedCount: validatedData.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Validation error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      validatedData: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
