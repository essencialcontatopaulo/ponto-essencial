import { auth, db } from "./firebase-config.js";
import { collection, getDocs, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Registrar ponto admin
window.registrar = async function(tipo) {
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const extras = calcularHorasExtras(tipo);
    await addDoc(collection(db, "pontos"), {
      uid: auth.currentUser.uid,
      tipo,
      data: serverTimestamp(),
      localizacao: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      horasExtras: extras
    });
    alert(`Registro feito! Horas extras: ${extras}`);
    carregarRelatorios();
  });
};

// Cálculo de horas extras
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

// Relatórios
window.carregarRelatorios = async function() {
  const tipo = document.getElementById("tipoRelatorio").value;
  const snapshot = await getDocs(collection(db, "pontos"));
  const relDiv = document.getElementById("relatorios");
  relDiv.innerHTML = "";

  const agora = new Date();
  const semanaAtual = getNumeroSemana(agora);
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const registrosPorUsuario = {};

  for (let docSnap of snapshot.docs) {
    const d = docSnap.data();
    const data = d.data.toDate ? d.data.toDate() : d.data;
    const uid = d.uid;

    let incluir = false;
    if (tipo === "semana" && getNumeroSemana(data) === semanaAtual && data.getFullYear() === anoAtual) incluir = true;
    if (tipo === "mes" && data.getMonth() === mesAtual && data.getFullYear() === anoAtual) incluir = true;
    if (tipo === "ano" && data.getFullYear() === anoAtual) incluir = true;
    if (!incluir) continue;

    if (!registrosPorUsuario[uid]) registrosPorUsuario[uid] = { pontos: 0, horasExtras: 0 };
    registrosPorUsuario[uid].pontos += 1;
    registrosPorUsuario[uid].horasExtras += parseFloat(d.horasExtras || 0);
  }

  // Buscar nomes dos usuários
  for (let uid in registrosPorUsuario) {
    const userSnap = await getDoc(doc(db, "usuarios", uid));
    const nome = userSnap.exists() ? userSnap.data().nome : uid;
    const r = registrosPorUsuario[uid];

    relDiv.innerHTML += `<p>Usuário: ${nome} | Registros: ${r.pontos} | Horas Extras: ${r.horasExtras.toFixed(2)}</p>`;
  }

  // Adicionar botão de exportação CSV
  if (relDiv.innerHTML) {
    const btn = document.createElement("button");
    btn.textContent = "Exportar CSV";
    btn.onclick = () => exportarCSV(registrosPorUsuario);
    relDiv.appendChild(btn);
  }
};

// Função para gerar CSV
function exportarCSV(dados) {
  let csv = "Nome;Registros;Horas Extras\n";
  Object.keys(dados).forEach(async uid => {
    const userSnap = await getDoc(doc(db, "usuarios", uid));
    const nome = userSnap.exists() ? userSnap.data().nome : uid;
    const r = dados[uid];
    csv += `${nome};${r.pontos};${r.horasExtras.toFixed(2)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "relatorio.csv";
  link.click();
}

// Número da semana
function getNumeroSemana(d) {
  const data = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const diaSemana = data.getUTCDay() || 7;
  data.setUTCDate(data.getUTCDate() + 4 - diaSemana);
  const anoInicio = new Date(Date.UTC(data.getUTCFullYear(),0,1));
  return Math.ceil((((data - anoInicio) / 86400000) + 1)/7);
}

// Carrega relatório ao abrir a página
carregarRelatorios();
