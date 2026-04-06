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
        { id: "viajero", titulo: "Viajero Limitado", dolor: "Amo viajar pero no puedo comunicarme. Dolor: Sentirse inútil, depender de otros para comer o moverse; frustración." },
        { id: "emigracion", titulo: "Emigración Próxima", dolor: "Voy a mudarme de país. Dolor: Pánico a un cambio radical y perder oportunidades laborales." },
        { id: "residente", titulo: "Residente en EE.UU.", dolor: "Ya vivo allá pero no hablo el idioma. Dolor: Aislamiento social y dificultad extrema en el día a día." },
        { id: "procrastinador", titulo: "Objetivo Postergado", dolor: "Meta personal de años. Dolor: Sentirse fatal y 'aburrido' de uno mismo por procrastinar algo divertido." }
    ];

    const personalidades = {
        "ZAFIRO": "Enérgico, divertido, odias el silencio. Te distraes fácil. Quieres dinamismo.",
        "PERLA": "Calmado, amable, buscas seguridad. Te mueve ayudar a tu familia. Buen oyente.",
        "ESMERALDA": "Analítico, frío y escéptico. Quieres datos y el 'cómo' exacto. Odias el small talk.",
        "RUBÍ": "Ambicioso y directo. Quieres saber cómo esto te da estatus o ingresos. Te mueven retos."
    };

    const objecionesDetalle = {
        "dinero": "No tengo el dinero ahora, es una inversión muy alta para mi situación actual y me da miedo no poder pagarlo.",
        "tiempo": "No tengo tiempo, mi agenda está explotada y temo pagar para no usarlo.",
        "pareja": "Lo tengo que consultar con mi pareja, no tomo estas decisiones solo/a.",
        "confianza": "Necesito ver reseñas o investigar más la academia, hoy en día hay muchas estafas y no tengo total confianza.",
        "presion": "No me gusta la presión para arrancar hoy mismo, prefiero pensarlo con calma.",
        "prueba": "Quiero un tiempo de prueba (una semana o un mes) antes de comprometerme a los 12 meses.",
        "baja": "¿Qué pasa si quiero darme de baja antes de los 12 meses? Me da pánico quedar atado a un contrato largo."
    };

    const pKey = (config.country === "random" || !config.country) ? r(Object.keys(paises)) : config.country;
    const pais = paises[pKey] || paises["mexico"];
    const perfilKey = (config.type === "random" || !config.type) ? r(Object.keys(personalidades)) : config.type;
    const perfil = personalidades[perfilKey] || personalidades["ZAFIRO"];
    const diff = config.difficulty || "normal";
    const closerName = config.closerName || "el closer";
    
    const historia = (config.situation === "random" || !config.situation) 
        ? r(historias) 
        : (historias.find(h => h.id === config.situation) || historias[0]);
    
    const esMujer = Math.random() > 0.5;
    const profesion = r(["Arquitecto", "Contador", "Vendedor", "Marketing", "Diseñador"]);
    const eventoOculto = r([
        "Una vez perdí un ascenso internacional porque en la reunión no pude responder una sola pregunta en inglés.",
        "En un viaje a Londres no supe pedir que me cambien la comida fría.",
        "Perdí un cliente de 5.000 dólares porque no pude explicar mi propuesta por Zoom.",
        "Pasé vergüenza en una entrevista de trabajo con una reclutadora de EE.UU."
    ]);

    const leadPublic = {
        name: esMujer ? r(nombresMujer) : r(nombresHombre),
        genero: esMujer ? "mujer" : "hombre",
        desc: `${historia.titulo} • Perfil ${perfilKey} • ${pais.nombre}`,
        pais: pais.nombre,
        perfil: perfilKey,
        dolor: historia.dolor,
        objetivo: "Lograr libertad absoluta, seguridad profesional y ser bilingüe.",
        eventoOculto: eventoOculto
    };

    let objInstr = "";
    if (config.objection && config.objection !== "random") {
        objInstr = `Tu objeción principal y más persistente es: "${objecionesDetalle[config.objection] || config.objection}". Úsala para resistirte al cierre.`;
    }

    let diffInstr = "";
    if (diff === "facil") {
        diffInstr = "Nivel: FÁCIL. Solo lanza 1 objeción suave. Si el closer empatiza un poco, sube el Rapport rápido.";
    } else if (diff === "dificil") {
        diffInstr = "Nivel: DIFÍCIL. Eres muy escéptico. Lanza al menos 4 objeciones duras de la lista. No cerrarás si falta el ERANC.";
    } else {
        diffInstr = "Nivel: NORMAL. Lanza 3 objeciones reales.";
    }

    const promptText = `
1. EL PERSONAJE (Lead):
- Nombre: ${leadPublic.name}
- Perfil: ${perfil}
- Situación: ${historia.dolor}
- País: ${pais.nombre} (${pais.modismos})
- Historia Oculta (Discovery): Profesión ${profesion}, Evento: ${eventoOculto}. (Revélalo solo ante buen discovery).
- Dificultad: ${diffInstr}
${objInstr ? `- REGLA CLAVE OBJETIVA: ${objInstr}` : "- REGLA: Lanza objeciones de dinero, tiempo, pareja, confianza o baja según tu personalidad."}

2. CONTEXTO DE LLAMADA:
- Estás en una videollamada con el Closer llamado "${closerName}". Dirígete a él/ella por su nombre cuando sea natural para que la charla sea humana.

3. CIERRE (ERANC): E (Empatía), R (Reconfirmar), A (Aislar), N (Negociar), C (Cerrar).
4. RESPUESTA REQUERIDA (JSON):
{
  "reply": "Tu respuesta como lead...",
  "metrics": {
    "rapport": 0-100,
    "discovery": 0-100,
    "mood": "...",
    "eranc": { "E": "red|yellow|green", "R": "red|yellow|green", "A": "red|yellow|green", "N": "red|yellow|green", "C": "red|yellow|green" },
    "sold": true/false
  }
}
`;

    return { leadPublic, promptText };
}

export default async function handler(req, res) {
    const body = req.body;
    const msg = body.message;

    if (msg === "/start") {
        try {
            const { leadPublic, promptText } = generarLead(body.config);
            return res.json({
                reply: "",
                metrics: { rapport: 0, discovery: 0, mood: "Esperando inicio...", eranc: { E: "red", R: "red", A: "red", N: "red", C: "red" }, sold: false },
                lead: leadPublic,
                identidad: promptText 
            });
        } catch (err) {
            console.error("Error in /start:", err);
            return res.status(500).json({ error: "No se pudo iniciar el lead" });
        }
    }

    if (msg === "/voice") {
        const text = body.text;
        const genero = body.genero;
        const voiceId = genero === "mujer" ? "EXAVITQu4vr4xnSDxMaL" : "pNInz6obpgmqMAr2W4mO";
        if (ELEVEN_API_KEY && ELEVEN_API_KEY !== "YOUR_ELEVEN_API_KEY") {
            try {
                const response = await axios({ method: 'post', url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, data: { text: text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }, headers: { 'xi-api-key': ELEVEN_API_KEY, 'Content-Type': 'application/json', 'accept': 'audio/mpeg' }, responseType: 'arraybuffer' });
                return res.json({ audio: Buffer.from(response.data).toString('base64') });
            } catch (error) { console.error("Eleven Error"); }
        }
        const mp3 = await openai.audio.speech.create({ model: "tts-1", voice: genero === "mujer" ? "nova" : "alloy", input: text });
        return res.json({ audio: Buffer.from(await mp3.arrayBuffer()).toString('base64') });
    }

    if (msg === "/audit") {
        const chatLog = body.historial?.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
        const auditPrompt = `Analiza sesión de ventas (Lead: ${body.leadInfo?.name}). Reporte 1-10 en Rapport, Discovery, Oferta, Objeciones. Plan 3 pasos.`;
        const ai = await openai.chat.completions.create({ model: "gpt-4o", messages: [{ role: "system", content: auditPrompt }, { role: "user", content: chatLog }] });
        return res.json({ reply: ai.choices[0].message.content });
    }

    try {
        const ai = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: body.identidad }, ...body.historial, { role: "user", content: msg }],
            response_format: { type: "json_object" }
        });
        const data = JSON.parse(ai.choices[0].message.content);
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: "OpenAI error" });
    }
}