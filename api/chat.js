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

    let diffInstr = "";
    if (diff === "facil") {
        diffInstr = "DIFICULTAD: 6/10 (Resistencia básica). Una sola objeción real. Cedes si el closer muestra interés genuino y empatía.";
    } else if (diff === "dificil") {
        diffInstr = "DIFICULTAD: 9/10 (Resistencia EXTREMA). Eres muy escéptico. Interrumpe, cuestiona los métodos y no perdonas el ruido o la falta de claridad. No compras a la primera.";
    } else {
        diffInstr = "DIFICULTAD: 7.5/10 (Resistencia MEDIA). Al menos 3 objeciones reales. Exiges que el closer use tus datos de cualificación.";
    }

    const objInstr = config.objection && config.objection !== "random" ? `Tu objeción principal BLOQUEANTE es: "${objecionesDetalle[config.objection] || config.objection}".` : "";

    const promptText = `
1. EL PERSONAJE (LEAD PURO):
Eres ${leadPublic.name} de ${pais.nombre} (${pais.modismos}). ERES EL CLIENTE, NUNCA ACTUES COMO VENDEDOR NI AYUDES AL CLOSER.
- Tu historia: ${ficha.paso1}. Dolor: ${ficha.paso2}. Meta economica: ${ingresoObjetivo}.
- ${diffInstr}
- ${objInstr}

2. REGLA DE CIERRE (MÁXIMO RIGOR):
No marcas 'sold: true' hasta que se cumplan ESTAS DOS CONDICIONES:
1) El closer solucionó DE MANERA EMOCIONAL Y LOGICA tu objeción (Limpieza total).
2) El closer TE PIDIÓ EXPLÍCITAMENTE EL PAGO (CTA de cierre). Si el closer no te dice de pagar, tú no compras automáticamente aunque te guste el programa.

3. CONTEXTO ACADEMIA ANDY:
- Neurociencia, 66+ Live Classes/mes, 1-on-1 (50m), Discord, Garantía B2.
- Precio: 1000€ (Beca)/1500€ (Full). Financiación interna disponible ($700 ahora...).

4. RESPUESTA (JSON):
{
  "reply": "Tu respuesta como prospecto...",
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
        const auditPrompt = `Analiza sesión basada en METODOLOGÍA ANDY. Evalúa si el closer usó los datos de cualificación y si pidió el pago al final. Reporte 1-10.`;
        const ai = await openai.chat.completions.create({ model: "gpt-4o", messages: [{ role: "system", content: auditPrompt }, { role: "user", content: chatLog }] });
        return res.json({ reply: ai.choices[0].message.content });
    }

    try {
        const ai = await openai.chat.completions.create({ model: "gpt-4o", messages: [{ role: "system", content: body.identidad }, ...body.historial, { role: "user", content: msg }], response_format: { type: "json_object" } });
        return res.json(JSON.parse(ai.choices[0].message.content));
    } catch (err) { return res.status(500).json({ error: "OpenAI error" }); }
}