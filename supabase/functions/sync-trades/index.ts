
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, sync-key, Sync-Key',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Extract Body and Sync Key
        const body = await req.json().catch(() => ({}));

        // Try to get sync key from headers (various formats) or body
        const syncKey = req.headers.get('sync-key') ||
            req.headers.get('Sync-Key') ||
            body.sync_key ||
            body.SyncKey;

        if (!syncKey) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing sync key',
                details: 'No sync-key found in headers or body'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const { trades, account, openPositions, isHeartbeat } = body;

        // 2. Verify sync key exists in profiles
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('id, name')
            .eq('sync_key', syncKey)
            .single();

        if (profileError) {
            console.error('Profile lookup error:', profileError);
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid sync key',
                details: profileError.code === 'PGRST116' ? 'Key not found in database' : `Database error: ${profileError.message}`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // 3. Persist session data
        const sessionData = {
            trades: trades || [],
            account: account || null,
            openPositions: openPositions || [],
            lastHeartbeat: new Date().toISOString(),
            isHeartbeat: !!isHeartbeat,
            userName: profile.name
        };

        const { error: upsertError } = await supabaseClient
            .from('ea_sessions')
            .upsert({
                syncKey: syncKey,
                data: sessionData,
                lastUpdated: new Date().toISOString()
            }, { onConflict: 'syncKey' });

        if (upsertError) {
            console.error('Error upserting session:', upsertError);
            return new Response(JSON.stringify({
                success: false,
                error: 'Persistence error',
                details: upsertError.message
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        // 4. Sync Trades History to 'trades' table
        if (trades && trades.length > 0) {
            // Get existing trade ticket IDs for this user to avoid duplicates
            const { data: recentTrades } = await supabaseClient
                .from('trades')
                .select('ticket_id')
                .eq('user_id', profile.id)
                .not('ticket_id', 'is', null);

            const existingTickets = new Set(recentTrades?.map((t: any) => String(t.ticket_id)));

            const newTrades = [];

            for (const trade of trades) {
                // Skip if we already processed this ticket
                if (existingTickets.has(String(trade.ticket))) continue;

                // Map MT5 trade to DB schema
                const dbTrade = {
                    user_id: profile.id,
                    ticket_id: String(trade.ticket),
                    pair: trade.symbol,
                    asset_type: 'Forex', 
                    date: new Date(trade.time * 1000).toISOString().split('T')[0],
                    time: new Date(trade.time * 1000).toISOString().split('T')[1].split('.')[0],
                    session: 'New York', // Placeholder
                    direction: trade.type === 'BUY' ? 'Long' : 'Short',
                    entry_price: trade.price, 
                    exit_price: trade.price,
                    stop_loss: 0,
                    take_profit: 0,
                    lots: trade.volume,
                    result: trade.profit >= 0 ? 'Win' : 'Loss',
                    pnl: trade.profit,
                    rr: 0,
                    rating: 0,
                    tags: ['MT5_Sync', 'Auto'],
                    notes: `Order: #${trade.order}`,
                    plan_adherence: 'No Plan',
                };
                
                // Only insert if it's an exit deal (entry = 1 or 2) 
                if (trade.entry === 1 || trade.entry === 2) { 
                     newTrades.push(dbTrade);
                }
            }

            if (newTrades.length > 0) {
                const { error: insertError } = await supabaseClient
                    .from('trades')
                    .insert(newTrades);
                
                if (insertError) {
                    console.error('Error syncing history:', insertError);
                } else {
                    console.log(`Synced ${newTrades.length} new trades.`);
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: isHeartbeat ? 'Heartbeat received' : 'Data synced successfully',
            user: profile.name
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Global error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            details: error.message
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
