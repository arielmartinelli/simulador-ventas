import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let historial=[];
let identidad="";
let configUser=null;

const r=a=>a[Math.floor(Math.random()*a.length)];

function generar(c){
return `
Perfil: ${c.perfil}
Objeción: ${c.objecion}
Dificultad: ${c.dificultad}%

Personalidad:
ZAFIRO=energético
PERLA=inseguro
ESMERALDA=lógico
RUBÍ=ambicioso

Objetivo: ${r(["dinero","mejorar vida","viajar"])}
Frustración: ${r(["no avanzo","me frustro","me cuesta"])}
`;
}

export default async function handler(req,res){

const body=typeof req.body==="string"?JSON.parse(req.body):req.body;
const msg=body.message;

// START
if(msg==="/start"){
historial=[];
configUser=body.config;
identidad=generar(configUser);
return res.json({reply:"Decime el precio"});
}

// RESET
if(msg==="/reset"){
historial=[];
identidad="";
return res.json({reply:"reset"});
}

// AUDIT
if(msg==="/audit"){
const texto=historial.map(m=>m.role+": "+m.content).join("\n");

const rta=await openai.responses.create({
model:"gpt-4o-mini",
input:`
Analiza esta llamada de ventas:

${texto}

Devuelve:
- nota 1-10
- errores
- mejoras
`
});

return res.json({reply:rta.output[0].content[0].text});
}

// CHAT
historial.push({role:"user",content:msg});

const ai=await openai.responses.create({
model:"gpt-4o-mini",
input:`
Eres un cliente real.
No vendas.

${identidad}

${historial.map(m=>m.role+": "+m.content).join("\n")}
`
});

const reply=ai.output[0].content[0].text;

historial.push({role:"assistant",content:reply});

res.json({reply});
}