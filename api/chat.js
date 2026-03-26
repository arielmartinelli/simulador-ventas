import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 memoria simple (1 usuario)
let historial = [];
let identidadLead = null;

// 🎭 IDENTIDAD DINÁMICA
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
IDENTIDAD INTERNA (NO REVELAR):
Perfil: ${perfil}
País: ${pais}
Profesión: ${profesion}
Objetivo: ${objetivo}
Frustración: ${frustracion}
Dificultad: ${dificultad}%

Contexto:
- LATAM con economía inestable
- Cuida el dinero

Reglas:
- Mantener SIEMPRE personalidad
- No revelar identidad
`;
}

// 🧠 PROMPT MASTER
const systemPrompt = `
Eres un LEAD LATAM interesado en comprar un curso de inglés.

NO eres IA.
NO ayudas al closer.
Eres una persona real.

OBJETIVO:
Simular una venta enfocada en CIERRE.

El closer SIEMPRE empieza diciendo el precio.

Desde ahí:
- reaccionas real
- negocias
- dudas
- haces objeciones

OBJECIONES:
precio, tiempo, confianza, experiencias previas, comparación

COMPORTAMIENTO:
- Español natural LATAM
- Respuestas cortas o medias
- No perfecto (humano)

DIFICULTAD:
Alta (60%–90%)

COMPRA SOLO SI:
✔ conexión emocional
✔ entienden tu problema
✔ resuelven objeción
✔ confianza
✔ cierre claro

Si falta algo → NO compras
`;


// 🚀 HANDLER VERCEL
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Solo POST permitido" });
    }

    // 🔥 fix body
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const mensajeUsuario = body?.message || "";

    // 🔄 RESET
    if (mensajeUsuario.toLowerCase() === "/reset") {
      historial = [];
      identidadLead = null;
      return res.json({ reply: "Simulación reiniciada." });
    }

    // 📊 AUDITORÍA
    if (mensajeUsuario.toLowerCase() === "/audit") {
      const texto = historial.map(m => m.content).join("\n");

      const audit = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Eres un coach de ventas.

Evalúa esta llamada:

- Química
- Marco
- Discovery
- Validación
- Presentación
- Objeciones
- Comunicación

Da:
✔ nota final (1-10)
✔ errores concretos
✔ 3 mejoras accionables
            `
          },
          { role: "user", content: texto }
        ]
      });

      return res.json({
        reply: audit.choices[0].message.content
      });
    }

    // 🎭 crear identidad UNA VEZ
    if (!identidadLead) {
      identidadLead = generarIdentidad();
    }

    // 🧠 guardar user
    historial.push({
      role: "user",
      content: mensajeUsuario
    });

    // 🤖 generar respuesta
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt + identidadLead
        },
        ...historial
      ],
    });

    const respuesta = completion.choices[0].message.content;

    // 💾 guardar IA
    historial.push({
      role: "assistant",
      content: respuesta
    });

    return res.json({
      reply: respuesta
    });

  } catch (error) {
    console.error("🔥 ERROR:", error);
    return res.status(500).json({
      error: error.message
    });
  }
}