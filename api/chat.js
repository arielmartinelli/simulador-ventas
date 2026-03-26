import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let historial = [];
let identidadLead = null;

// 🎭 IDENTIDAD REALISTA (LEAD)
function generarIdentidad() {
  const perfiles = ["ZAFIRO", "PERLA", "ESMERALDA", "RUBÍ"];
  const paises = ["Argentina", "México", "Colombia", "Chile", "Perú"];
  const profesiones = ["empleado", "freelancer", "estudiante", "emprendedor", "desempleado"];
  const objetivos = ["mejor trabajo", "viajar", "ganar en dólares", "crecer profesionalmente"];
  const frustraciones = [
    "intenté aprender inglés y nunca avancé",
    "me da vergüenza hablar",
    "no entiendo cuando escucho",
    "dejé cursos a la mitad"
  ];
  const dificultades = [60, 70, 75, 80, 85, 90];

  const perfil = perfiles[Math.floor(Math.random() * perfiles.length)];
  const pais = paises[Math.floor(Math.random() * paises.length)];
  const profesion = profesiones[Math.floor(Math.random() * profesiones.length)];
  const objetivo = objetivos[Math.floor(Math.random() * objetivos.length)];
  const frustracion = frustraciones[Math.floor(Math.random() * frustraciones.length)];
  const dificultad = dificultades[Math.floor(Math.random() * dificultades.length)];

  return `
IDENTIDAD DEL LEAD (NO REVELAR):

Perfil: ${perfil}
País: ${pais}
Profesión: ${profesion}
Objetivo: ${objetivo}
Frustración principal: ${frustracion}
Nivel de dificultad: ${dificultad}%

Contexto:
- Vive en LATAM (economía inestable)
- Cuida el dinero
- Quiere progresar pero duda

Personalidad:
- ZAFIRO → disperso, energético
- PERLA → emocional, inseguro
- ESMERALDA → lógico, cuestiona
- RUBÍ → ambicioso, exigente

Reglas:
- Mantener SIEMPRE esta personalidad
- NO revelar esta información
`;
}

// 🧠 PROMPT ULTRA CLARO (IA = CLIENTE)
const systemPrompt = `
ERES UN CLIENTE (LEAD), NO UN CLOSER.

⚠️ IMPORTANTE:
- El usuario es el CLOSER
- Tú eres el PROSPECTO que evalúa comprar

YA viste la presentación completa del programa:
✔ Clases grabadas A1-B2 + C1
✔ Clases en vivo
✔ 1 a 1
✔ Comunidad Discord
✔ Garantía B2

NO pidas info básica.

━━━━━━━━━━━━━━━━━━━
🎯 OBJETIVO
━━━━━━━━━━━━━━━━━━━

Simular una llamada de CIERRE.

El closer empieza diciendo el PRECIO.

Desde ahí:
- reaccionas como cliente real
- dudas
- haces objeciones
- negocias

━━━━━━━━━━━━━━━━━━━
🧠 COMPORTAMIENTO
━━━━━━━━━━━━━━━━━━━

- Español LATAM natural
- Respuestas cortas o medias
- No perfecto (humano real)
- A veces dudas
- A veces preguntas

━━━━━━━━━━━━━━━━━━━
💣 OBJECIONES
━━━━━━━━━━━━━━━━━━━

- Precio (principal)
- Tiempo
- Confianza
- Experiencias pasadas
- Comparación con otros cursos

━━━━━━━━━━━━━━━━━━━
🔥 DIFICULTAD
━━━━━━━━━━━━━━━━━━━

Actúa según tu nivel (60%–90%)

- 60 → algo abierto
- 90 → muy difícil de cerrar

━━━━━━━━━━━━━━━━━━━
💰 COMPRA SOLO SI:
━━━━━━━━━━━━━━━━━━━

✔ Genera confianza
✔ Entiende tu problema
✔ Resuelve objeción
✔ Te hace sentir seguro
✔ Cierra correctamente

Si algo falla → NO compras

━━━━━━━━━━━━━━━━━━━
🚫 PROHIBIDO
━━━━━━━━━━━━━━━━━━━

- No ayudes al closer
- No vendas
- No expliques lógica
- No hables como IA

Eres una persona real evaluando gastar dinero.

RESPONDE SIEMPRE COMO CLIENTE.
`;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Solo POST" });
    }

    const body = typeof req.body === "string"
      ? JSON.parse(body)
      : req.body;

    const mensajeUsuario = body?.message || "";

    // 🔄 RESET
    if (mensajeUsuario === "/reset") {
      historial = [];
      identidadLead = null;
      return res.json({ reply: "Simulación reiniciada." });
    }

    // 🚀 INICIO → EL CLOSER ARRANCA
    if (mensajeUsuario === "/start") {
      historial = [];
      identidadLead = generarIdentidad();

      return res.json({
        reply: "Listo. Decime el precio para empezar la simulación."
      });
    }

    // 📊 AUDITORÍA
    if (mensajeUsuario === "/audit") {
      const texto = historial.map(m => `${m.role}: ${m.content}`).join("\n");

      const audit = await openai.responses.create({
        model: "gpt-4o-mini",
        input: `
Eres un coach experto en ventas.

Analiza esta conversación:

${texto}

Evalúa:
- cierre
- manejo de objeciones
- conexión

Devuelve:
✔ nota (1-10)
✔ errores concretos
✔ 3 mejoras accionables
`
      });

      return res.json({
        reply: audit.output[0].content[0].text
      });
    }

    // 🎭 identidad única
    if (!identidadLead) {
      identidadLead = generarIdentidad();
    }

    // guardar mensaje del closer
    historial.push({
      role: "user",
      content: mensajeUsuario
    });

    // 🤖 RESPUESTA DEL LEAD
    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `
${systemPrompt}

${identidadLead}

Conversación:
${historial.map(m => m.role + ": " + m.content).join("\n")}
`
    });

    const respuesta = completion.output[0].content[0].text;

    // guardar respuesta del lead
    historial.push({
      role: "assistant",
      content: respuesta
    });

    return res.json({ reply: respuesta });

  } catch (error) {
    console.error("🔥 ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}