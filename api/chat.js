import OpenAI from "openai";
import axios from "axios";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;

const r = a => a[Math.floor(Math.random() * a.length)];

function generarLead(config = {}) {
    // --- DATA POOLS ---
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
        { id: "ascenso", titulo: "Ascenso Laboral", dolor: "Me piden inglés para subir de puesto. Dolor: Ansiedad por perder crecimiento económico y desesperación por estancamiento." },
        { id: "viajero", titulo: "Viajero Limitado", dolor: "Amo viajar pero no puedo comunicarme. Dolor: Sentirse inútil, depender de otros para comer o moverse; frustración por no elegir destinos libremente." },
        { id: "emigracion", titulo: "Emigración Próxima", dolor: "Voy a mudarme de país. Dolor: Pánico a un cambio radical y perder oportunidades laborales por la barrera del idioma." },
        { id: "residente", titulo: "Residente en EE.UU.", dolor: "Ya vivo allá pero no hablo el idioma. Dolor: Aislamiento social, falta de amistades y dificultad extrema para desenvolverme en el día a día." },
        { id: "procrastinador", titulo: "Objetivo Postergado", dolor: "Meta personal de años. Dolor: Sentirse fatal y 'aburrido' de uno mismo por procrastinar algo que debería ser divertido." }
    ];

    const personalidades = {
        "ZAFIRO": "ZAFIRO: Enérgico, divertido, odias el silencio. Te distraes fácil. Si el closer es muy técnico o serio, te aburres. Quieres dinamismo.",
        "PERLA": "PERLA: Calmado, amable, buscas seguridad. Te mueve ayudar a tu familia. Te asustas ante la agresividad. Eres muy buen oyente.",
        "ESMERALDA": "ESMERALDA: Analítico, frío y escéptico. Quieres datos, estadísticas y el 'cómo' exacto. Odias la charla trivial (small talk).",
        "RUBÍ": "RUBÍ: Ambicioso y directo. El tiempo es dinero. Quieres saber cómo esto te da estatus o más ingresos. Te mueven las marcas y los retos."
    };

    // --- SELECTION ---
    const pKey = (config.country === "random" || !config.country) ? r(Object.keys(paises)) : config.country;
    const pais = paises[pKey] || paises["mexico"];
    
    const perfilKey = (config.type === "random" || !config.type) ? r(Object.keys(personalidades)) : config.type;
    const perfil = personalidades[perfilKey] || personalidades["ZAFIRO"];
    
    const historia = (config.situation === "random" || !config.situation) 
        ? r(historias) 
        : (historias.find(h => h.id === config.situation) || historias[0]);
    
    const esMujer = Math.random() > 0.5;

    // Discovery (Hidden Story)
    const profesion = r(["Arquitecto", "Contador", "Vendedor", "Marketing", "Diseñador"]);
    const eventoOculto = r([
        "Una vez perdí un ascenso internacional porque en la reunión no pude responder una sola pregunta en inglés y todos me miraron.",
        "En un viaje a Londres no supe pedir que me cambien la comida fría y pasé hambre.",
        "Perdí un cliente de 5.000 dólares porque no pude explicar mi propuesta por Zoom.",
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

    // --- FINAL PROMPT CONSTRUCTION (STRICT) ---
    const promptText = `
1. EL PERSONAJE
Actúa como un Lead (Prospecto) de alta calidad que ha agendado una videollamada para obtener información sobre nuestro curso de Inglés. Tu objetivo es interactuar con el "Closer" (el usuario). No eres un cliente fácil; aunque estás interesado, tienes miedos, dudas y barreras culturales/económicas reales.

A. Historia de Vida y Dolor Asociado (TU REALIDAD):
- ${historia.dolor}

B. Personalidad (TU FORMA DE SER):
- ${perfil}

C. Motor de Contexto LATAM:
- Ubicación: ${pais.nombre}
- Modismos locales a usar: ${pais.modismos}
- Situación Económica: ${pais.economia}
${(config.objection && config.objection !== "random") ? `- REGLA ESPECIAL: Tu objeción principal en esta llamada DEBE SER: "${config.objection}". Empieza a mostrar resistencia con este punto pronto.` : ""}

D. La "Historia Oculta" (Discovery):
- Profesión: ${profesion}
- Evento humillante: ${eventoOculto}
- Deseo profundo: Ganar seguridad, libertad y ser bilingüe.
- REGLA: Guarda esto para ti y revélalo solo si el closer hace un buen Discovery.

2. CONOCIMIENTO DEL PRODUCTO (Información técnica):
- Formato: Acceso anual a clases grabadas por Andy (material completo).
- Práctica: 66 clases en directo de speaking al mes (en febrero).
- Personalización: 1-on-1s de 50 min cada 15 días con un profesor.
- Comunidad: Servidor de Discord organizado por niveles 24/7.
- Garantía: Nivel B2 o devolución del 100%.
- Niveles: A1 (Supervivencia/Pronunciación), A2 (Confianza/Viajes), B1 (Laboral/Series), B2 (Seguridad Profesional), C1 (Dichos/Modismos).
- Extras: App de Flash Cards y calendario de clases.

3. REGLAS DE COMPORTAMIENTO
- Interacción: Alterna entre "Charlatán" (irte por las ramas) o "Seco" (respuestas cortas) según tu perfil ${perfilKey}.
- Resistencia: NO cedas a la primera. Debes lanzar al menos 3 objeciones de esta lista (usar una por una):
  - "Lo tengo que hablar con mi pareja."
  - "Tengo que hacer números / No me dan las cuentas."
  - "Lo tengo que pensar."
  - "Estoy viendo otras opciones."
  - "Me parece caro."
  - "No sé si tengo el tiempo ahora."

4. CONDICIÓN DE CIERRE (MÉTODO E-R-A-N-C)
Solo sacarás la tarjeta de crédito si el closer cumple estos pasos:
- E - Empatizar: ¿Validó mi situación personal o la crisis de mi país?
- R - Reconfirmar Interés: ¿Usó mi "Dolor" o "Deseo" (del Discovery) para recordarme por qué necesito el curso?
- A - Aislar: ¿Se aseguró de que mi objeción es la ÚNICA traba antes de seguir?
- N - Negociar/Resolver: ¿Me dio una solución real (cuotas, becas, garantía)?
- C - Cerrar: ¿Me hizo un cierre de doble alternativa o una pregunta directa de acción?

IMPORTANTE: No eres un asistente. Eres la persona interesada. Si no te gusta el trato, se nota. Sé humano.
`;

    return { leadPublic, promptText };
}

export default async function handler(req, res) {
    const body = req.body;
    const msg = body.message;

    if (msg === "/start") {
        const { leadPublic, promptText } = generarLead(body.config);
        
        // --- GENERATE AI GREETING DYNAMICALLY ---
        const firstChat = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: promptText },
                { role: "user", content: "Empieza la videollamada. Saluda al closer de forma natural según tu personalidad." }
            ]
        });

        const reply = firstChat.choices[0].message.content;

        return res.json({
            reply,
            name: leadPublic.name,
            desc: leadPublic.desc,
            genero: leadPublic.genero,
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
                    data: {
                        text: text,
                        model_id: "eleven_multilingual_v2",
                        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
                    },
                    headers: { 'xi-api-key': ELEVEN_API_KEY, 'Content-Type': 'application/json', 'accept': 'audio/mpeg' },
                    responseType: 'arraybuffer'
                });
                return res.json({ audio: Buffer.from(response.data).toString('base64') });
            } catch (error) { 
                console.error("ElevenLabs Fallback..."); 
            }
        }

        try {
            const mp3 = await openai.audio.speech.create({
                model: "tts-1", voice: genero === "mujer" ? "nova" : "alloy", input: text,
            });
            return res.json({ audio: Buffer.from(await mp3.arrayBuffer()).toString('base64') });
        } catch (error) {
            return res.status(500).json({ error: "No voice available" });
        }
    }

    if (msg === "/audit") {
        const chatLog = body.historial?.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
        const leadInfo = body.leadInfo || {};
        
        const auditPrompt = `
EVALÚA ESTA LLAMADA SEGÚN ESTAS REGLAS:
- Lead: ${leadInfo.name} de ${leadInfo.pais} (${leadInfo.perfil}).

ENTREGA ESTE REPORTE EXACTO:

EVALUACIÓN TÉCNICA (1-10) en los siguientes bloques:
- Química y Rapport.
- Marco de la llamada.
- Calidad del Discovery (¿Logró sacar mi historia oculta?).
- Validación y Empatía.
- Presentación de la oferta.
- Manejo de Objeciones.
- Comunicación Asertiva.

NOTA MEDIA FINAL: {X.X}

ANÁLISIS DEL COACH:
- ¿Qué tipo de "Piedra Preciosa" detector el closer? (Penaliza si no la identificó).
- ¿Cómo manejó el contexto del país (${leadInfo.pais})?
- Cita Directa: "Dijiste [X] cuando debiste decir [Y]".

PLAN DE MEJORA: 3 pasos accionables y específicos.

CHAT LOG:
${chatLog}
`;

        try {
            const ai = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "system", content: auditPrompt }]
            });
            return res.json({ reply: ai.choices[0].message.content });
        } catch (err) {
            return res.status(500).json({ error: "Audit failed" });
        }
    }

    // --- CHAT PRINCIPAL ---
    try {
        const ai = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: body.identidad },
                ...body.historial,
                { role: "user", content: msg }
            ]
        });
        return res.json({ reply: ai.choices[0].message.content });
    } catch (err) {
        return res.status(500).json({ error: "OpenAI error" });
    }
}