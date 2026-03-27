import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let historial = [];
let identidad = "";
let configUser = null;

// random helper
const r = (arr)=>arr[Math.floor(Math.random()*arr.length)];

// identidad
function generar(config){
const paises=["Argentina","México","Chile"];
const objetivos=["ganar en dólares","progresar","viajar"];
const frustraciones=["me frustro","no avanzo","me cuesta"];

return `
Perfil: ${config.perfil}
Objeción: ${config.objecion}
Dificultad: ${config.dificultad}%

País: ${r(paises)}
Objetivo: ${r(objetivos)}
Frustración: ${r(frustraciones)}
`;
}

export default async function handler(req,res){

const body = typeof req.body==="string"?JSON.parse(req.body):req.body;
const msg = body.message;

// start
if(msg==="/start"){
historial=[];
configUser=body.config;
identidad=generar(configUser);
return res.json({reply:"Arranca, decime el precio"});
}

// reset
if(msg==="/reset"){
historial=[];
identidad="";
return res.json({reply:"reset ok"});
}

// audit
if(msg==="/audit"){
const texto=historial.map(m=>m.role+": "+m.content).join("\n");

const rta=await openai.responses.create({
model:"gpt-4o-mini",
input:`Analiza esta venta:\n${texto}`
});

return res.json({reply:rta.output[0].content[0].text});
}

// chat
historial.push({role:"user",content:msg});

const completion = await openai.responses.create({
model:"gpt-4o-mini",
input:`
Eres un cliente real. No vendas.

${identidad}

${historial.map(m=>m.role+": "+m.content).join("\n")}
`
});

const reply = completion.output[0].content[0].text;

historial.push({role:"assistant",content:reply});

res.json({reply});
}