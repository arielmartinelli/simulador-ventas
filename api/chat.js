import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let historial = [];
let identidadLead = null;

// 🎭 IDENTIDAD
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

  return `
IDENTIDAD INTERNA (NO REVELAR):

Perfil: ${perfiles[Math.floor(Math.random()*4)]}
País: ${paises[Math.floor(Math.random()*5)]}
Profesión: ${profesiones[Math.floor(Math.random()*5)]}
Objetivo: ${objetivos[Math.floor(Math.random()*4)]}
Frustración: ${frustraciones[Math.floor(Math.random()*4)]}
Dificultad: ${dificultades[Math.floor(Math.random()*6)]}%

- Mantener SIEMPRE personalidad
- No revelar identidad
`;
}

// 🧠 PROMPT PRO (POST-PRESENTACIÓN)
const systemPrompt = `
Eres un LEAD LATAM.

YA viste toda la presentación del programa:
- Clases grabadas A1-B2 + C1
- Clases en vivo
- 1 a 1
- Discord
- Garantía B2

NO preguntes info básica.

OBJETIVO:
Simular cierre.

El closer SIEMPRE arranca diciendo el precio.

Desde ahí:
- reaccionas real
- dudas
- objeciones
- negocias

OBJECIONES:
precio, tiempo, confianza, comparación

COMPORTAMIENTO:
- Español natural
- humano
- corto/medio

DIFICULTAD: ALTA (60-90%)

COMPRA SOLO SI:
✔ confianza
✔ resolución objeciones
✔ buen cierre

Si falta algo → NO compras
`;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Solo POST" });
    }

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const mensajeUsuario = body?.message || "";

    // 🔄 RESET
    if (mensajeUsuario === "/reset") {
      historial = [];
      identidadLead = null;
      return res.json({ reply: "Simulación reiniciada." });
    }

    // 🚀 INICIO AUTOMÁTICO (CIERRE)
    if (mensajeUsuario === "/start") {
      historial = [];
      identidadLead = generarIdentidad();

      const mensajeInicial = "El programa cuesta 300 dólares, ¿cómo lo ves?";

      historial.push({
        role: "user",
        content: mensajeInicial
      });

      return res.json({ reply: mensajeInicial });
    }

    // 📊 AUDITORÍA
    if (mensajeUsuario === "/audit") {
      const texto = historial.map(m => m.content).join("\n");

      const audit = await openai.responses.create({
        model: "gpt-4o-mini",
        input: `
Analiza esta llamada:

${texto}

Da:
- nota 1 a 10
- errores claros
- 3 mejoras concretas
`
      });

      return res.json({
        reply: audit.output[0].content[0].text
      });
    }

    if (!identidadLead) {
      identidadLead = generarIdentidad();
    }

    historial.push({
      role: "user",
      content: mensajeUsuario
    });

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