// Supabase Edge Function: stripe-checkout
// Deploy: supabase functions deploy stripe-checkout
// 依存: Stripe API キー (Secret: STRIPE_SECRET_KEY, STRIPE_PRICE_PRO, STRIPE_PRICE_ENT)
//
// 用途: 企業プランの Stripe Checkout セッションを作成
// 呼び出し: pricing.html から { plan: 'pro' | 'enterprise' } を POST

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const PRICE_IDS: Record<string, string | undefined> = {
  pro:        Deno.env.get("STRIPE_PRICE_PRO"),
  enterprise: Deno.env.get("STRIPE_PRICE_ENT"),
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { plan } = await req.json();
    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return json({ error: "unknown plan" }, 400);
    }
    const origin = req.headers.get("origin") ?? "https://aime.example";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/company-dashboard.html?paid=1`,
      cancel_url:  `${origin}/pricing.html?canceled=1`,
    });
    return json({ url: session.url });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
