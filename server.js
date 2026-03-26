const axios = require("axios");
const express = require("express");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// 🔑 OPENAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let historial = [];
let identidadLead = null;

// 🎭 IDENTIDAD + DIFICULTAD
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
- Quiere progresar

Historia:
- Intentó aprender inglés y falló
- Tiene dudas reales

Personalidad:
- ZAFIRO: energético, disperso
- PERLA: emocional, inseguro
- ESMERALDA: lógico, cuestiona todo
- RUBÍ: ambicioso, directo

Regla:
- Mantener SIEMPRE personalidad
- NO revelar info
`;
}

// 🧠 PROMPT PRO
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
- decides si compras

DIFICULTAD:
Actúa según tu nivel (60%–90%)

OBJECIONES:
precio, tiempo, desconfianza, experiencias, comparación

COMPORTAMIENTO:
- Español natural
- Respuestas cortas/medias
- Humano (dudas, cambios)

REGLAS:
- No romper personaje
- No comprar fácil

COMPRA SOLO SI:
✔ conexión
✔ entienden tu problema
✔ resuelven objeción
✔ confianza
✔ buen cierre

Si falta algo → NO compras

INICIO:
El closer dice el precio → reaccionas.
`;

// 🧠 GENERAR RESPUESTA (OPENAI)
async function generarRespuesta(mensajeUsuario) {

    // RESET
    if (mensajeUsuario.toLowerCase() === "/reset") {
        historial = [];
        identidadLead = null;
        return "Simulación reiniciada.";
    }

    // AUDIT
    if (mensajeUsuario.toLowerCase() === "/audit") {
        const texto = historial.map(h => h.content).join("\n");

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Analiza conversación de ventas y da nota + errores + mejoras"
                },
                { role: "user", content: texto }
            ]
        });

        return response.choices[0].message.content;
    }

    if (!identidadLead) {
        identidadLead = generarIdentidad();
    }

    // guardar user
    historial.push({
        role: "user",
        content: mensajeUsuario
    });

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: systemPrompt + identidadLead
            },
            ...historial
        ],
    });

    const texto = response.choices[0].message.content;

    // guardar respuesta
    historial.push({
        role: "assistant",
        content: texto
    });

    return texto;
}

// 🔊 VOZ (ELEVENLABS)
async function generarVoz(texto) {
    const response = await axios({
        method: "POST",
        url: "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL",
        headers: {
            "xi-api-key": process.env.ELEVEN_API_KEY,
            "Content-Type": "application/json"
        },
        data: {
            text: texto,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.4,
                similarity_boost: 0.8
            }
        },
        responseType: "arraybuffer"
    });

    return Buffer.from(response.data).toString("base64");
}

// 🚀 ENDPOINT
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;

        const texto = await generarRespuesta(message);

        if (message === "/audit" || message === "/reset") {
            return res.json({ text: texto });
        }

        const audio = await generarVoz(texto);

        res.json({
            text: texto,
            audio: audio
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message });
    }
});

// 🚀 SERVER
app.listen(process.env.PORT || 3000, () => {
    console.log("🚀 Servidor en http://localhost:3000");
});