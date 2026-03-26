import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



let historial = [];
let identidadLead = null;

// 🎭 IDENTIDAD REALISTA
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

// 🧠 PROMPT MASTER
const systemPrompt = `
Eres un LEAD LATAM (CLIENTE).

El usuario es el CLOSER.

YA viste toda la presentación del programa.
NO preguntes info básica.

Simulación = CIERRE.

Comportamiento:
- humano
- dudas reales
- objeciones reales
- respuestas cortas

Objeciones:
precio, tiempo, confianza

Dificultad alta.

Compra SOLO si:
✔ confianza
✔ resuelven objeción
✔ cierre correcto

Si no → NO compras.
`;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Solo POST" });
    }

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const msg = body?.message || "";

    // RESET
    if (msg === "/reset") {
      historial = [];
      identidadLead = null;
      return res.json({ reply: "Simulación reiniciada.", audit: null });
    }

    // START
    if (msg === "/start") {
      historial = [];
      identidadLead = generarIdentidad();
      return res.json({ reply: "Arrancá diciendo el precio.", audit: null });
    }

    // AUDIT
    if (msg === "/audit") {
      const texto = historial.map(m => `${m.role}: ${m.content}`).join("\n");

      const audit = await openai.responses.create({
        model: "gpt-4o-mini",
        input: `
Analiza esta venta:

${texto}

Da:
- nota (1-10)
- errores claros
- 3 mejoras concretas
`
      });

      return res.json({
        reply: "Auditoría generada",
        audit: audit.output[0].content[0].text
      });
    }

    if (!identidadLead) {
      identidadLead = generarIdentidad();
    }

    historial.push({ role: "user", content: msg });

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

    historial.push({ role: "assistant", content: respuesta });

    return res.json({
      reply: respuesta,
      audit: null
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}