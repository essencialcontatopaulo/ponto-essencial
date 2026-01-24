import { auth, db } from "./firebase-config.js";
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Registra ponto do admin
window.registrar = async function(tipo) {
  navigator.geolocation.getCurrentPosition(async (pos) => {

    // Calcular horas extras mesmo para admin
    const extras = calcularHorasExtras(tipo);

    await addDoc(collection(db, "pontos"), {
      uid: auth.currentUser.uid,
      tipo,
      data: serverTimestamp(),
      localizacao: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      horasExtras: extras
    });

    alert(`Registro feito! Horas extras: ${extras}`);
  });
};

// Função de cálculo de horas (mesma lógica do funcionário)
function calcularHorasExtras(tipo) {
  const jornada = {
    segunda: [{ entrada: "08:00", saida: "12:00" }, { entrada: "14:00", saida: "18:00" }],
    terca: [{ entrada: "08:00", saida: "12:00" }, { entrada: "14:00", saida: "18:00" }],
    quarta: [{ entrada: "08:00", saida: "12:00" }, { entrada: "14:00", saida: "18:00" }],
    quinta: [{ entrada: "08:00", saida: "12:00" }, { entrada: "14:00", saida: "18:00" }],
    sexta: [{ entrada: "08:00", saida: "12:00" }, { entrada: "14:00", saida: "18:00" }],
    sabado: [{ entrada: "08:00", saida: "13:00" }],
    domingo: []
  };

  const dias = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"];
  const dia = dias[new Date().getDay()];

  const now = new Date();
  const hora = now.getHours().toString().padStart(2,"0") + ":" + now.getMinutes().toString().padStart(2,"0");

  let extras = 0;
  const periodos = jornada[dia];
  if (!periodos || periodos.length === 0) return 0;

  periodos.forEach(p => {
    if (tipo === "saida" && hora > p.saida) {
      const [hS,mS] = p.saida.split(":").map(Number);
      const [h,m] = hora.split(":").map(Number);
      extras += (h - hS) + (m - mS)/60;
    }
  });

  return extras.toFixed(2);
}

// Relatórios simples
async function carregarRelatorios() {
  const snapshot = await getDocs(collection(db, "pontos"));
  const div = document.getElementById("relatorios");
  div.innerHTML = "";

  snapshot.forEach(doc => {
    const d = doc.data();
    div.innerHTML += `<p>${d.tipo} - ${d.uid} - Horas extras: ${d.horasExtras || 0}</p>`;
  });
}

carregarRelatorios();
