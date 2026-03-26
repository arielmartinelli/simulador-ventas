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
Perfil: ${perfiles[Math.floor(Math.random()*4)]}
País: ${paises[Math.floor(Math.random()*5)]}
Profesión: ${profesiones[Math.floor(Math.random()*5)]}
Objetivo: ${objetivos[Math.floor(Math.random()*4)]}
Frustración: ${frustraciones[Math.floor(Math.random()*4)]}
Dificultad: ${dificultades[Math.floor(Math.random()*6)]}%
`;
}

const systemPrompt = `
Eres un LEAD LATAM.

- No eres IA
- No ayudas al closer
- Eres difícil (60-90%)

El closer arranca diciendo el precio.

Haz objeciones reales:
precio, tiempo, confianza

Compra SOLO si te convencen.
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

    // RESET
    if (mensajeUsuario === "/reset") {
      historial = [];
      identidadLead = null;
      return res.json({ reply: "Reset OK" });
    }

    // AUDIT (corregido)
    if (mensajeUsuario === "/audit") {
      const texto = historial.map(m => m.content).join("\n");

      const audit = await openai.responses.create({
        model: "gpt-4o-mini",
        input: `
Analiza esta conversación:

${texto}

Da:
- nota 1 a 10
- errores
- 3 mejoras
`
      });

      return res.json({
        reply: audit.output[0].content[0].text
      });
    }

    // identidad fija
    if (!identidadLead) {
      identidadLead = generarIdentidad();
    }

    historial.push({
      role: "user",
      content: mensajeUsuario
    });

    // ✅ RESPUESTA (NUEVO SDK)
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
    console.error("🔥 ERROR REAL:", error);
    return res.status(500).json({ error: error.message });
  }
}