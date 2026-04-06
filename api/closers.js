const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_KEY;

export default async function handler(req, res) {
    if (req.method === "GET") {
        const r = await fetch(`${SB_URL}/rest/v1/closers?select=*&order=name.asc`, {
            headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` }
        });
        const data = await r.json();
        return res.json(data);
    }

    if (req.method === "POST") {
        const { name } = req.body;
        const r = await fetch(`${SB_URL}/rest/v1/closers`, {
            method: "POST",
            headers: { 
                "apikey": SB_KEY, 
                "Authorization": `Bearer ${SB_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify({ name })
        });
        const data = await r.json();
        return res.json(data);
    }
}
