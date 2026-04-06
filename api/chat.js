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
        { id: "ascenso", titulo: "Ascenso Laboral", dolor: "Ansiedad por perder crecimiento económico y desesperación por estancamiento." },
        { id: "viajero", titulo: "Viajero Limitado", dolor: "Sentirse inútil, depender de otros para comer o moverse; frustración por no elegir destinos libremente." },
        { id: "emigracion", titulo: "Emigración Próxima", dolor: "Pánico a un cambio radical y perder oportunidades laborales por la barrera del idioma." },
        { id: "residente", titulo: "Residente en EE.UU.", dolor: "Aislamiento social, falta de amistades y dificultad extrema para desenvolverme en el día a día." },
        { id: "procrastinador", titulo: "Objetivo Postergado", dolor: "Sentirse fatal y 'aburrido' de uno mismo por procrastinar algo que debería ser divertido." }
    ];

    const personalidades = {
        "ZAFIRO": "Enérgico, divertido, odias el silencio. Te distraes fácil. Quieres dinamismo. Si el closer es técnico, te aburres.",
        "PERLA": "Calmado, amable, buscas seguridad. Te mueve ayudar a tu familia. Te asustas ante la agresividad. Buen oyente.",
        "ESMERALDA": "Analítico, frío y escéptico. Quieres datos, estadísticas y el 'cómo' exacto. Odias el small talk.",
        "RUBÍ": "Ambicioso y directo. El tiempo es dinero. Quieres saber cómo esto te da estatus o ingresos. Te mueven retos."
    };

    const objecionesArr = [
        "Lo tengo que hablar con mi pareja.",
        "Tengo que hacer números / No me dan las cuentas.",
        "Lo tengo que pensar.",
        "Estoy viendo otras opciones.",
        "Me parece caro.",
        "No sé si tengo el tiempo para comprometerme ahora."
    ];

    const pKey = config.country === "random" || !config.country ? r(Object.keys(paises)) : config.country;
    const pais = paises[pKey] || paises["mexico"];
    
    const perfilKey = config.type === "random" || !config.type ? r(Object.keys(personalidades)) : config.type;
    const perfil = personalidades[perfilKey] || personalidades["ZAFIRO"];
    
    const historia = r(historias);
    const esMujer = Math.random() > 0.5;

    const eventoOculto = r([
        "Perdí un ascenso por no entender una reunión en inglés.",
        "Me sentí humillado en un viaje porque no pude pedir comida solo.",
        "Perdí una oportunidad de negocio de miles de dólares por el idioma.",
        "Pasé vergüenza en una entrevista de trabajo que era mi sueño."
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
Eres un LEAD (Prospecto) de alta calidad en una videollamada de ventas.
Tu objetivo es interactuar con el "Closer" (el usuario).

PROPIEDADES DE TU PERSONAJE:
- Nombre: ${leadPublic.name}
- País: ${pais.nombre}
- Personalidad [${perfilKey}]: ${perfil}
- Historia de Vida: ${historia.titulo}
- Dolor Principal: ${historia.dolor}
- Modismos locales a usar: ${pais.modismos}
- Situación Económica: ${pais.economia}

HISTORIA OCULTA (Discovery):
- Evento humillante/pérdida: ${eventoOculto}
- Deseo profundo: Lograr libertad absoluta y seguridad profesional.
*REGLA: Solo revela la historia oculta si el closer hace preguntas profundas de "Discovery".*

CONOCIMIENTO DEL PRODUCTO (Academia):
- Formato: Acceso anual a clases grabadas por Andy.
- Práctica: 66 clases de speaking al mes en directo.
- 1-on-1s: Clases privadas de 50 min cada 15 días con profesor.
- Comunidad: Discord 24/7.
- Garantía: Nivel B2 o devolución del 100%.
- Niveles: A1 (pronunciación) hasta C1 (bilingüismo).

REGLAS DE COMPORTAMIENTO:
1. Interacción: Alterna entre "Charlatán" (irte por las ramas) o "Seco" según tu personalidad ${perfilKey}.
2. Resistencia: Lanza al menos 3 objeciones reales de esta lista: ${objecionesArr.join(", ")}. No cedas fácil.
3. El cierre [E-R-A-N-C]: Solo sacarás la tarjeta si el closer cumple:
   - E: Empatizar (valida tu crisis o situación).
   - R: Reconfirmar Interés (usa tu Dolor o Deseo oculto).
   - A: Aislar (¿Es esta la única traba?).
   - N: Negociar/Resolver (solución real, cuotas, garantía).
   - C: Cerrar (Doble alternativa o pregunta directa).

IMPORTANTE: Eres un humano real. No eres un bot amable. No ayudes al closer.
    `;

    return { leadPublic, promptText };
}

export default async function handler(req, res) {
    // Vercel auto-parses body if content-type is application/json
    const body = req.body;
    const msg = body.message;

    console.log("Incoming Message:", msg);

    if (msg === "/start") {
        const { leadPublic, promptText } = generarLead(body.config);
        return res.json({
            reply: "¡Hola! Gracias por atenderme. ¿Cómo estás?",
            name: leadPublic.name,
            desc: leadPublic.desc,
            genero: leadPublic.genero,
            identidad: promptText // Pass this back to client to store
        });
    }

    if (msg === "/voice") {
        const text = body.text;
        const genero = body.genero;
        const voiceId = genero === "mujer" ? "EXAVITQu4vr4xnSDxMaL" : "pNInz6obpgmqMAr2W4mO";
        
        // 1. Try ElevenLabs
        if (ELEVEN_API_KEY && ELEVEN_API_KEY !== "YOUR_ELEVEN_API_KEY") {
            try {
                const response = await axios({
                    method: 'post',
                    url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                    data: {
                        text: text,
                        model_id: "eleven_multilingual_v2",
                        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
                    },
                    headers: {
                        'xi-api-key': ELEVEN_API_KEY,
                        'Content-Type': 'application/json',
                        'accept': 'audio/mpeg'
                    },
                    responseType: 'arraybuffer'
                });
                const base64Audio = Buffer.from(response.data).toString('base64');
                return res.json({ audio: base64Audio });
            } catch (error) {
                console.error("ElevenLabs Error (Falling back to OpenAI):", error.response?.data || error.message);
                // Continue to fallback
            }
        }

        // 2. Fallback to OpenAI TTS
        try {
            const mp3 = await openai.audio.speech.create({
                model: "tts-1",
                voice: genero === "mujer" ? "nova" : "alloy",
                input: text,
            });
            const buffer = Buffer.from(await mp3.arrayBuffer());
            return res.json({ audio: buffer.toString('base64') });
        } catch (error) {
            console.error("OpenAI TTS Error:", error.message);
            return res.status(500).json({ error: "No voice source available" });
        }
    }

    if (msg === "/audit") {
        const chatLog = body.historial?.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
        const leadInfo = body.leadInfo || {};
        
        const auditPrompt = `
Eres un Coach de Ventas experto. Analiza la siguiente sesión de role play.
EL LEAD ERA: ${leadInfo.name} del país ${leadInfo.pais} con perfil ${leadInfo.perfil}.

CHAT LOG:
${chatLog}

ENTREGA UN REPORTE SIGUIENDO ESTE FORMATO:

EVALUACIÓN TÉCNICA (1-10):
- Química y Rapport: {X/10}
- Marco de la llamada: {X/10}
- Calidad del Discovery: {X/10}
- Validación y Empatía: {X/10}
- Presentación de oferta: {X/10}
- Manejo de Objeciones: {X/10}
- Comunicación Asertiva: {X/10}

NOTA MEDIA FINAL: {X.X}

ANÁLISIS DEL COACH:
- Identificación de Perfil: ¿Supo que era un ${leadInfo.perfil}?
- Manejo de Contexto: ¿Cómo integró que el lead es de ${leadInfo.pais}?
- Cita Directa: "Dijiste [X] cuando debiste decir [Y]".

PLAN DE MEJORA:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]
        `;

        try {
            const ai = await openai.chat.completions.create({
                model: "gpt-4o-mini", // Safer and faster
                messages: [{ role: "system", content: auditPrompt }]
            });
            return res.json({ reply: ai.choices[0].message.content });
        } catch (err) {
            console.error("Audit error:", err.message);
            return res.status(500).json({ error: "Audit failed" });
        }
    }

    // CHAT PRINCIPAL
    const clientHistory = body.historial || [];
    const clientIdentidad = body.identidad || "";

    try {
        const ai = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Safer default
            messages: [
                { role: "system", content: clientIdentidad },
                ...clientHistory,
                { role: "user", content: msg }
            ]
        });

        const reply = ai.choices[0].message.content;
        return res.json({ reply });
    } catch (err) {
        console.error("OpenAI Chat Error:", err.message);
        return res.status(500).json({ error: "OpenAI connection error" });
    }
}