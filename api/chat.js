import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;

const r = a => a[Math.floor(Math.random() * a.length)];

function generarLead(config = {}) {
    const nombresHombre = ["Carlos", "Lucas", "Mateo", "Diego", "Javier"];
    const nombresMujer = ["Martina", "Sofía", "Valentina", "Camila", "Lucía"];

    const paises = {
        "mexico": { nombre: "México", modismos: "chamba, qué onda, neta, está cañón", economia: "el peso está volátil" },
        "argentina": { nombre: "Argentina", modismos: "laburo, che, viste, un mango, quilombo", economia: "la inflación nos está matando" },
        "colombia": { nombre: "Colombia", modismos: "parce, berraco, camellar, plata", economia: "el dólar está carísimo" },
        "chile": { nombre: "Chile", modismos: "pega, po, cachái, fome", economia: "el costo de vida subió mucho" },
        "peru": { nombre: "Perú", modismos: "chamba, pucha, manyas, soles", economia: "la situación política afecta el bolsillo" }
    };

    const historias = [
        { id: "ascenso", titulo: "Ascenso Laboral", dolor: "Me piden inglés para subir de puesto. Dolor: Ansiedad por perder crecimiento económico y desesperación de estancamiento." },
        { id: "viajero", titulo: "Viajero Limitado", dolor: "Amo viajar pero no puedo comunicarme. Dolor: Sentirse inútil, depender de otros para comer; frustración." },
        { id: "emigracion", titulo: "Emigración Próxima", dolor: "Voy a mudarme de país. Dolor: Pánico a un cambio radical y perder oportunidades." },
        { id: "residente", titulo: "Residente en EE.UU.", dolor: "Ya vivo allá pero no hablo el idioma. Dolor: Aislamiento social y dificultad extrema." },
        { id: "procrastinador", titulo: "Objetivo Postergado", dolor: "Meta personal de años. Dolor: Sentirse fatal por procrastinar." }
    ];

    const personalidades = {
        "ZAFIRO": "Enérgico, divertido, odias el silencio. Te distraes fácil. Quieres dinamismo.",
        "PERLA": "Calmado, amable, buscas seguridad. Te mueve ayudar a tu familia. Buen oyente.",
        "ESMERALDA": "Analítico, frío y escéptico. Quieres datos y el 'cómo' exacto. Odias el small talk.",
        "RUBÍ": "Ambicioso y directo. Quieres saber cómo esto te da estatus o ingresos. Te mueven retos."
    };

    const pKey = (config.country === "random" || !config.country) ? r(Object.keys(paises)) : config.country;
    const pais = paises[pKey] || paises["mexico"];
    const perfilKey = (config.type === "random" || !config.type) ? r(Object.keys(personalidades)) : config.type;
    const perfil = personalidades[perfilKey] || personalidades["ZAFIRO"];
    
    const historia = (config.situation === "random" || !config.situation) 
        ? r(historias) 
        : (historias.find(h => h.id === config.situation) || historias[0]);
    
    const esMujer = Math.random() > 0.5;
    const profesion = r(["Arquitecto", "Contador", "Vendedor", "Marketing", "Diseñador"]);
    const eventoOculto = r([
        "Una vez perdí un ascenso internacional porque no pude responder una pregunta en inglés.",
        "En un viaje a Londres no supe pedir que me cambien la comida fría.",
        "Perdí un cliente de 5.000 dólares porque no pude explicar mi propuesta.",
        "Pasé vergüenza en una entrevista de trabajo con una reclutadora de EE.UU."
    ]);

    const leadPublic = {
        name: esMujer ? r(nombresMujer) : r(nombresHombre),
        genero: esMujer ? "mujer" : "hombre",
        desc: `${historia.titulo} • Perfil ${perfilKey} • ${pais.nombre}`,
        pais: pais.nombre,
        perfil: perfilKey,
        dolor: historia.dolor
    };

    const promptText = `
1. EL PERSONAJE: Lead interesado en curso de inglés Academia Andy.
- Situación: ${historia.dolor}
- Personalidad [${perfilKey}]: ${perfil}
- País: ${pais.nombre} (${pais.modismos})
- Historia Oculta (Discovery): ${profesion}, ${eventoOculto}. (Revélalo solo ante buen discovery).

2. DINÁMICA DE CIERRE (MÉTODO E-R-A-N-C):
- E (Empatía), R (Reconfirmar interés/dolor), A (Aislar objeción), N (Negociar solución), C (Cerrar/Pago).
- Resistencia: Lanza al menos 3 objeciones reales.

3. REGLA DE RESPUESTA (IMPORTANTE):
DEBES responder SIEMPRE en formato JSON con la siguiente estructura:
{
  "reply": "Tu respuesta como lead...",
  "metrics": {
    "rapport": 0-100 (qué tan bien te cae el vendedor),
    "discovery": 0-100 (qué tanto ha descubierto de tu dolor/historia oculta),
    "mood": "Sentimiento actual (Enojado, Interesado, Escéptico, etc.)",
    "phase": "Fase actual detectada del E-R-A-N-C (E | R | A | N | C | Ninguna)"
  }
}
`;

    return { leadPublic, promptText };
}

export default async function handler(req, res) {
    const body = req.body;
    const msg = body.message;

    if (msg === "/start") {
        const { leadPublic, promptText } = generarLead(body.config);
        const firstChat = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: promptText },
                { role: "user", content: "Saluda al closer según tu personalidad." }
            ],
            response_format: { type: "json_object" }
        });
        const data = JSON.parse(firstChat.choices[0].message.content);
        return res.json({
            reply: data.reply,
            metrics: data.metrics,
            lead: leadPublic,
            identidad: promptText 
        });
    }

    if (msg === "/voice") {
        const text = body.text;
        const genero = body.genero;
        const voiceId = genero === "mujer" ? "EXAVITQu4vr4xnSDxMaL" : "pNInz6obpgmqMAr2W4mO";
        
        if (ELEVEN_API_KEY && ELEVEN_API_KEY !== "YOUR_ELEVEN_API_KEY") {
            try {
                const response = await axios({
                    method: 'post',
                    url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                    data: { text: text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } },
                    headers: { 'xi-api-key': ELEVEN_API_KEY, 'Content-Type': 'application/json', 'accept': 'audio/mpeg' },
                    responseType: 'arraybuffer'
                });
                return res.json({ audio: Buffer.from(response.data).toString('base64') });
            } catch (error) { console.error("Eleven Error"); }
        }
        const mp3 = await openai.audio.speech.create({ model: "tts-1", voice: genero === "mujer" ? "nova" : "alloy", input: text });
        return res.json({ audio: Buffer.from(await mp3.arrayBuffer()).toString('base64') });
    }

    if (msg === "/audit") {
        const chatLog = body.historial?.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
        const auditPrompt = `Analiza esta sesión de ventas (Lead: ${body.leadInfo?.name}). Entrega reporte 1-10 en Química, Discovery, Oferta, Objeciones. Plan de 3 pasos.`;
        const ai = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: auditPrompt }, { role: "user", content: chatLog }]
        });
        return res.json({ reply: ai.choices[0].message.content });
    }

    // --- CHAT PRINCIPAL ---
    try {
        const ai = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: body.identidad },
                ...body.historial,
                { role: "user", content: msg }
            ],
            response_format: { type: "json_object" }
        });
        const data = JSON.parse(ai.choices[0].message.content);
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: "OpenAI error" });
    }
}