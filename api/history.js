const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_KEY;

export default async function handler(req, res) {
    if (!SB_URL || !SB_KEY) {
        return res.status(500).json({ error: "Missing Supabase Credentials (SUPABASE_URL or SUPABASE_KEY)" });
    }

    if (req.method === "POST") {
        const { closer_id, pin } = req.body;
        
        // Simple PIN check
        if (pin !== "1234") {
            return res.status(401).json({ error: "PIN Incorrecto" });
        }

        const r = await fetch(`${SB_URL}/rest/v1/simulations?closer_id=eq.${closer_id}&select=*&order=created_at.desc`, {
            headers: { 
                "apikey": SB_KEY, 
                "Authorization": `Bearer ${SB_KEY}`
            }
        });
        
        const data = await r.json();
        return res.json(data);
    }
    return res.status(405).end();
}
