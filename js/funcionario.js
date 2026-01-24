import { auth, db } from "./firebase-config.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Horários padrão
const jornada = {
  segunda: [{ entrada: "08:00", saida: "12:00" }, { entrada: "14:00", saida: "18:00" }],
  terca: [{ entrada: "08:00", saida: "12:00" }, { entrada: "14:00", saida: "18:00" }],
  quarta: [{ entrada: "08:00", saida: "12:00" }, { entrada: "14:00", saida: "18:00" }],
  quinta: [{ entrada: "08:00", saida: "12:00" }, { entrada: "14:00", saida: "18:00" }],
  sexta: [{ entrada: "08:00", saida: "12:00" }, { entrada: "14:00", saida: "18:00" }],
  sabado: [{ entrada: "08:00", saida: "13:00" }],
  domingo: [] // bloqueado
};

function getDiaSemana() {
  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  return dias[new Date().getDay()];
}

function horaAtual() {
  const now = new Date();
  return now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0");
}

function calcularHorasExtras(tipo) {
  const dia = getDiaSemana();
  const hora = horaAtual();
  let extras = 0;

  const periodos = jornada[dia];
  if (!periodos || periodos.length === 0) return 0; // domingo bloqueado

  periodos.forEach(p => {
    if (tipo === "entrada" && hora > p.saida) extras += 0; // não entra
    if (tipo === "saida" && hora > p.saida) {
      const [hS, mS] = p.saida.split(":").map(Number);
      const [h, m] = hora.split(":").map(Number);
      extras += (h - hS) + (m - mS)/60;
    }
  });

  return extras.toFixed(2);
}

window.registrar = async function(tipo) {
  const dia = getDiaSemana();

  if (dia === "domingo") {
    alert("Hoje é domingo, ponto bloqueado!");
    return;
  }

  if (!navigator.geolocation) {
    alert("Localização não suportada");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const extras = calcularHorasExtras(tipo);

    await addDoc(collection(db, "pontos"), {
      uid: auth.currentUser.uid,
      tipo,
      data: serverTimestamp(),
      localizacao: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      horasExtras: extras
    });

    document.getElementById("msg").innerText = `Registro realizado! Horas extras: ${extras}`;
  });
};

window.registrarJustificativa = async function() {
  const justificativa = document.getElementById("justificativa").value;
  if (!justificativa) return alert("Selecione a justificativa");

  await addDoc(collection(db, "justificativas"), {
    uid: auth.currentUser.uid,
    tipo: justificativa,
    data: serverTimestamp()
  });

  document.getElementById("msg").innerText = "Justificativa enviada";
};
