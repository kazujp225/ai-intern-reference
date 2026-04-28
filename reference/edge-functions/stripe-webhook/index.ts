// Supabase Edge Function: stripe-webhook
// Stripe の決済完了イベントを受けて companies.plan を更新
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const email = s.customer_details?.email;
        if (email) {
          // email で企業を特定して plan を pro に
          await supabase.from("companies").update({
            plan: "pro",
            stripe_customer_id: s.customer as string,
          }).eq("owner_id", await getUserIdByEmail(email));
        }
        break;
      }
      case "customer.subscription.deleted": {
        const s = event.data.object as Stripe.Subscription;
        await supabase.from("companies").update({ plan: "free" })
          .eq("stripe_customer_id", s.customer as string);
        break;
      }
    }
  } catch (err) {
    console.error("handler error:", err);
  }
  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

async function getUserIdByEmail(email: string) {
  const { data } = await supabase.auth.admin.listUsers();
  return data.users.find(u => u.email === email)?.id;
}
