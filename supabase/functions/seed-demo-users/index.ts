import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_USERS = [
  { email: "superadmin@meharfinance.com", password: "Demo@1234", full_name: "Rajesh Kumar", role: "super_admin" },
  { email: "admin@meharfinance.com", password: "Demo@1234", full_name: "Priya Sharma", role: "admin" },
  { email: "manager@meharfinance.com", password: "Demo@1234", full_name: "Amit Patel", role: "manager" },
  { email: "bank@meharfinance.com", password: "Demo@1234", full_name: "HDFC Bank", role: "bank" },
  { email: "broker@meharfinance.com", password: "Demo@1234", full_name: "Vikram Singh", role: "broker" },
  { email: "employee@meharfinance.com", password: "Demo@1234", full_name: "Neha Gupta", role: "employee" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results = [];

    for (const demo of DEMO_USERS) {
      // Try to create user
      const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
        email: demo.email,
        password: demo.password,
        email_confirm: true,
        user_metadata: { full_name: demo.full_name },
      });

      let userId = userData?.user?.id;

      if (createError && createError.message?.includes("already been registered")) {
        // User exists - fetch their ID
        const { data: existing } = await adminClient.auth.admin.listUsers();
        const found = existing?.users?.find((u: any) => u.email === demo.email);
        userId = found?.id;
      }

      if (!userId) {
        results.push({ email: demo.email, status: "error", message: createError?.message });
        continue;
      }

      // Upsert profile
      await adminClient.from("profiles").upsert({
        id: userId,
        full_name: demo.full_name,
        email: demo.email,
      }, { onConflict: "id" });

      // Upsert role
      await adminClient.from("user_roles").upsert({
        user_id: userId,
        role: demo.role,
      }, { onConflict: "user_id,role" });

      results.push({ email: demo.email, status: "ok", role: demo.role });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
