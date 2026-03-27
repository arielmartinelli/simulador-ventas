import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let historial = [];
let identidad = "";
let leadPublic = {};

const r = a => a[Math.floor(Math.random() * a.length)];

function generarLead(){

const nombresHombre = ["Juan","Carlos","Lucas"];
const nombresMujer = ["Martina","Sofía"];

const paises = ["Argentina","México","Colombia","Chile","Perú"];
const profesiones = ["empleado","freelancer","estudiante","emprendedor"];
const perfiles = ["ZAFIRO","PERLA","ESMERALDA","RUBÍ"];

const dolores = [
"Ansiedad por estancamiento económico",
"Frustración por no poder viajar libremente",
"Miedo a perder oportunidades laborales",
"Aislamiento social",
"Culpa por procrastinar"
];

const historias = [
"Necesita inglés para subir de puesto",
"No puede comunicarse viajando",
"Se va a mudar de país",
"Vive en EE.UU. sin inglés",
"Siempre quiso aprender pero lo deja"
];

const esMujer = Math.random() > 0.5;

const perfil = r(perfiles);
const pais = r(paises);
const profesion = r(profesiones);
const historia = r(historias);
const dolor = r(dolores);

// historia oculta
const evento = r([
"perdí un trabajo por no hablar inglés",
"no pude cerrar un cliente importante",
"pasé vergüenza en un viaje",
"no entendí una entrevista laboral"
]);

const deseo = r([
"ganar en dólares",
"viajar tranquilo",
"tener mejor trabajo",
"sentirme seguro hablando"
]);

leadPublic = {
    name: esMujer ? r(nombresMujer) : r(nombresHombre),
    genero: esMujer ? "mujer" : "hombre",
    desc: `${profesion} de ${pais} • Quiere aprender inglés para progresar • Problema: ${dolor}`
};

// 🔥 TU PROMPT ORIGINAL — INTACTO
identidad = `
Eres un LEAD real en una llamada de cierre.

━━━━━━━━━━━━━━━
IDENTIDAD
━━━━━━━━━━━━━━━
Perfil interno: ${perfil}
País: ${pais}
Profesión: ${profesion}

Historia: ${historia}
Dolor principal: ${dolor}

Historia oculta:
- Evento: ${evento}
- Deseo profundo: ${deseo}

(No reveles esto fácilmente. Solo si el closer hace buen discovery)

━━━━━━━━━━━━━━━
PERSONALIDAD
━━━━━━━━━━━━━━━
ZAFIRO: energético, se distrae
PERLA: emocional, inseguro
ESMERALDA: lógico, cuestiona
RUBÍ: ambicioso, directo

Actúa según tu perfil.

━━━━━━━━━━━━━━━
COMPORTAMIENTO
━━━━━━━━━━━━━━━

- Español LATAM con modismos de ${pais}
- No hables perfecto
- Interrumpe si no te convence
- Cambia emociones

━━━━━━━━━━━━━━━
OBJECIONES (OBLIGATORIO)
━━━━━━━━━━━━━━━

Debes usar al menos 3:

- "No me dan las cuentas"
- "Lo tengo que pensar"
- "Estoy viendo otras opciones"
- "No tengo tiempo"
- "Me parece caro"
- "Lo tengo que hablar con mi pareja"

Nivel de resistencia: 8/10

━━━━━━━━━━━━━━━
CIERRE (ERANC)
━━━━━━━━━━━━━━━

Solo compras si:

E → empatiza contigo
R → usa tu dolor/deseo
A → aísla objeción
N → da solución real
C → cierra correctamente

Si falla → NO compras

━━━━━━━━━━━━━━━
IMPORTANTE
━━━━━━━━━━━━━━━

- No ayudas al closer
- No vendas
- Eres difícil de cerrar
- Actúa como humano real
`;
}

// emoción
function detectarEmocion(texto){
texto = texto.toLowerCase();

if(texto.includes("caro") || texto.includes("no puedo")) return "enojo";
if(texto.includes("no sé") || texto.includes("mmm")) return "duda";
if(texto.includes("interesa") || texto.includes("suena bien")) return "interes";

return "neutral";
}

export default async function handler(req,res){

const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
const msg = body.message;

// START
if(msg === "/start"){
historial = [];
generarLead();

return res.json({
reply: "Arranca",
name: leadPublic.name,
desc: leadPublic.desc,
genero: leadPublic.genero // 🔥 NUEVO
});
}

// RESET
if(msg === "/reset"){
historial = [];
return res.json({reply:"reset"});
}

// 🔥 VOZ (NUEVO — NO ROMPE NADA)
if(msg === "/voice"){

const texto = body.text;
const genero = body.genero;

const voice = genero === "mujer" ? "nova" : "alloy";

const audio = await openai.audio.speech.create({
model: "gpt-4o-mini-tts",
voice: voice,
input: texto
});

const buffer = Buffer.from(await audio.arrayBuffer());

return res.json({
audio: buffer.toString("base64")
});
}

// AUDIT
if(msg === "/audit"){
const texto = historial.map(m=>m.role+": "+m.content).join("\n");

const rta = await openai.responses.create({
model:"gpt-4o-mini",
input:`
Eres un coach experto en ventas.

Analiza esta llamada:

${texto}

Evalúa:
- química
- discovery
- objeciones
- cierre

Devuelve:
- nota 1 a 10
- errores concretos
- mejoras accionables
`
});

return res.json({reply:rta.output[0].content[0].text});
}

// CHAT
historial.push({role:"user",content:msg});

if(historial.length > 12){
    historial = historial.slice(-12);
}

const ai = await openai.responses.create({
model:"gpt-4o-mini",
input:`
${identidad}

Conversación:
${historial.map(m=>m.role+": "+m.content).join("\n")}
`
});

const reply = ai.output[0].content[0].text;

historial.push({role:"assistant",content:reply});

const emocion = detectarEmocion(reply);

res.json({reply, emocion});
}