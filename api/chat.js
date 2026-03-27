import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let historial = [];
let identidad = "";
let leadPublic = {};
let emocionActual = "neutral";

const r = a => a[Math.floor(Math.random() * a.length)];

function generarLead(){

const nombres = ["Juan","Carlos","Martina","Sofía","Lucas"];
const paises = ["Argentina","México","Colombia","Chile"];
const profesiones = ["empleado","freelancer","estudiante"];
const perfiles = ["ZAFIRO","PERLA","ESMERALDA","RUBÍ"];

const perfil = r(perfiles);

leadPublic = {
    name: r(nombres),
    desc: `${r(profesiones)} de ${r(paises)} • Quiere aprender inglés para ${r(["trabajar mejor","ganar más dinero","viajar"])} • Problema: ${r(["no avanza","le cuesta","lo deja siempre"])}`
};

identidad = `
Perfil interno: ${perfil}

Comportamiento:
- ZAFIRO: disperso, energético
- PERLA: inseguro, emocional
- ESMERALDA: lógico, cuestiona
- RUBÍ: ambicioso, exigente

Reglas:
- interrumpe si no te convence
- cambia emociones
- habla como humano real
- usa pausas, dudas
- no hables perfecto
`;
}

// detección simple de emoción
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
desc: leadPublic.desc
});
}

// RESET
if(msg === "/reset"){
historial = [];
return res.json({reply:"reset"});
}

// AUDIT
if(msg === "/audit"){
const texto = historial.map(m=>m.role+": "+m.content).join("\n");

const rta = await openai.responses.create({
model:"gpt-4o-mini",
input:`
Analiza esta llamada de ventas:

${texto}

Devuelve:
- nota 1 a 10
- errores
- mejoras concretas
`
});

return res.json({reply:rta.output[0].content[0].text});
}

// CHAT
historial.push({role:"user",content:msg});

const ai = await openai.responses.create({
model:"gpt-4o-mini",
input:`
Eres un cliente real.

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