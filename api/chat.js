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
        "peru": { nombre: "Perú", modismos: "chamba, pucha, manyas, soles", economia: "la situación política afecta el bolsillo" },
        "costa_rica": { nombre: "Costa Rica", modismos: "tuanis, pura vida, brete, mae", economia: "el colon se mantiene estable pero todo sube" }
    };

    const historias = [
        { id: "ascenso", titulo: "Ascenso Laboral", dolor: "Ansiedad por perder crecimiento económico y desesperación por estancamiento.", objetivo: "Subir de puesto y duplicar ingresos." },
        { id: "viajero", titulo: "Viajero Limitado", dolor: "Sentirse inútil al viajar, frustración por depender de otros para comer.", objetivo: "Viajar solo y hablar con locales sin pánico." },
        { id: "emigracion", titulo: "Emigración Próxima", dolor: "Pánico a un cambio radical y perder oportunidades laborales en el nuevo país.", objetivo: "Trabajar en el extranjero y socializar." },
        { id: "residente", titulo: "Residente en EE.UU.", dolor: "Aislamiento social y dificultad extrema. Sentirse ciudadano de segunda.", objetivo: "Integración total y mejores empleos." },
        { id: "procrastinador", titulo: "Objetivo Postergado", dolor: "Sentirse fatal por procrastinar años. Sentir que el tiempo se acaba.", objetivo: "Dominar el inglés de una vez por todas." }
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
    const ingresoActual = r(["800 USD", "1200 USD", "1500 USD", "2000 USD"]);
    const ingresoObjetivo = r(["2500 USD", "3500 USD", "5000 USD"]);

    // FICHA DE CUALIFICACIÓN (Los 7 pasos que el lead ya respondió)
    const ficha = {
        paso1: `${profesion}, 28 años. Nos conoció por Instagram de Andy.`,
        paso2: historia.dolor,
        paso3: "Intentó Duolingo y cursos tradicionales pero se aburrió de la gramática.",
        paso4: "Si no aprende en 6 meses, perderá una oportunidad de ascenso clave.",
        paso5: "Dice estar listo para arrancar hoy si 'todo encaja'.",
        paso6: `Ingreso: ${ingresoActual}. Meta: ${ingresoObjetivo}.`,
        paso7: "Disponibilidad: 5-7 horas por semana."
    };

    const leadPublic = {
        name: esMujer ? r(nombresMujer) : r(nombresHombre),
        genero: esMujer ? "mujer" : "hombre",
        desc: `${historia.titulo} • ${perfilKey} • ${pais.nombre}`,
        pais: pais.nombre,
        perfil: perfilKey,
        ficha: ficha,
        product: { price: 1500, scholarship: 1000 }
    };

    const objInstr = config.objection && config.objection !== "random" ? `Tu objeción principal es: "${objecionesDetalle[config.objection] || config.objection}". Úsala con fuerza.` : "";

    const promptText = `
1. EL PERSONAJE:
Eres ${leadPublic.name} de ${pais.nombre} (${pais.modismos}). Ya fuite CUALIFICADO antes de esta llamada.
DATOS QUE YA DISTE (Memoria de cualificación):
- Profesión/Vida: ${ficha.paso1}
- Dolor: ${ficha.paso2}
- Intentos previos: ${ficha.paso3}
- Si no haces nada: ${ficha.paso4}
- ROI: Ganas ${ingresoActual}, buscas ganar ${ingresoObjetivo}.
- Tiempo: Tienes ${ficha.paso7}.

2. TU ESTADO ACTUAL:
- Tienes INTENCIÓN DE COMPRAR, pero tienes dudas reales.
- El Closer (${closerName}) te muestra la Academia Andy (Neurociencia, 1-on-1s, Discord, Live Classes).
- ${objInstr}
- Si el closer usa bien tus datos de cualificación para "limpiar" la duda, cede positivamente.

3. CONOCIMIENTO DEL PRODUCTO:
- Método: Neurociencia (sin gramática aburrida). Live Clases (66+ al mes). 1-on-1 (50 min, personalizado). Discord (Salas por niveles).
- Garantía: Nivel B2 o devolución del 100%.
- Precio: 1500€ (Beca de 1000€ disponible).

4. LÓGICA DE CIERRE (Andy Script):
- DINERO: Si dices "no tengo todo", el closer debería ofrecer Beca (1000€) o Financiación Interna ($700 + resto).
- PAREJA: Si dices "hablar con mi pareja", el closer preguntará "¿Qué te diría ella?".
- TIEMPO: Ya aceptaste que tienes 5h/semana.

5. RESPUESTA REQUERIDA (JSON):
{
  "reply": "Tu respuesta...",
  "metrics": { "rapport": 0-100, "discovery": 0-100, "mood": "...", "eranc": { "E": "red|yellow|green", "R": "red|yellow|green", "A": "red|yellow|green", "N": "red|yellow|green", "C": "red|yellow|green" }, "sold": true/false }
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
                metrics: { rapport: 0, discovery: 0, mood: "Esperando...", eranc: { E: "red", R: "red", A: "red", N: "red", C: "red" }, sold: false },
                lead: leadPublic,
                identidad: promptText 
            });
        } catch (err) { return res.status(500).json({ error: "Error start" }); }
    }

    if (msg === "/voice") {
        const text = body.text, genero = body.genero;
        const voiceId = genero === "mujer" ? "EXAVITQu4vr4xnSDxMaL" : "pNInz6obpgmqMAr2W4mO";
        if (ELEVEN_API_KEY) {
            try {
                const response = await axios({ method: 'post', url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, data: { text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }, headers: { 'xi-api-key': ELEVEN_API_KEY, 'Content-Type': 'application/json', 'accept': 'audio/mpeg' }, responseType: 'arraybuffer' });
                return res.json({ audio: Buffer.from(response.data).toString('base64') });
            } catch (error) { console.error("Eleven Error"); }
        }
        const mp3 = await openai.audio.speech.create({ model: "tts-1", voice: genero === "mujer" ? "nova" : "alloy", input: text });
        return res.json({ audio: Buffer.from(await mp3.arrayBuffer()).toString('base64') });
    }

    if (msg === "/audit") {
        const chatLog = body.historial?.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
        const auditPrompt = `Analiza sesión basada en METODOLOGÍA ANDY. Evalúa Rapport, Discovery y scripts de objeciones (Pareja, Dinero, Tiempo). Reporte 1-10.`;
        const ai = await openai.chat.completions.create({ model: "gpt-4o", messages: [{ role: "system", content: auditPrompt }, { role: "user", content: chatLog }] });
        return res.json({ reply: ai.choices[0].message.content });
    }

    try {
        const ai = await openai.chat.completions.create({ model: "gpt-4o", messages: [{ role: "system", content: body.identidad }, ...body.historial, { role: "user", content: msg }], response_format: { type: "json_object" } });
        return res.json(JSON.parse(ai.choices[0].message.content));
    } catch (err) { return res.status(500).json({ error: "OpenAI error" }); }
}