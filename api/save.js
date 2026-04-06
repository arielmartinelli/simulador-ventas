const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_KEY;

export default async function handler(req, res) {
    if (!SB_URL || !SB_KEY) {
        return res.status(500).json({ error: "Missing Supabase Credentials (SUPABASE_URL or SUPABASE_KEY)" });
    }

    if (req.method === "POST") {
        const { closer_id, lead_data, transcript, audit_report, metrics } = req.body;
        
        const r = await fetch(`${SB_URL}/rest/v1/simulations`, {
            method: "POST",
            headers: { 
                "apikey": SB_KEY, 
                "Authorization": `Bearer ${SB_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            body: JSON.stringify({
                closer_id,
                lead_data,
                transcript,
                audit_report,
                metrics
            })
        });
        
        if (r.ok) return res.json({ success: true });
        return res.status(500).json({ error: "Failed to save" });
    }
    return res.status(405).end();
}
