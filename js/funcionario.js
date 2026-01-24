import { auth, db } from "./firebase-config.js";
import { collection, addDoc, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Elementos do DOM
const btnEntrada = document.getElementById("btnEntrada");
const btnSaida = document.getElementById("btnSaida");
const btnJustificativa = document.getElementById("btnJustificativa");
const formJust = document.getElementById("formJustificativa");
const btnEnviarJust = document.getElementById("btnEnviarJustificativa");
const tipoJust = document.getElementById("tipoJustificativa");
const descJust = document.getElementById("descricaoJustificativa");
const mensagem = document.getElementById("mensagem");
const historicoDiv = document.getElementById("historico");

// Função para obter localização
async function obterLocalizacao() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err)
    );
  });
}

// Função para registrar ponto
async function registrarPonto(tipo) {
  mensagem.style.color = "green";
  try {
    const loc = await obterLocalizacao();
    const uid = auth.currentUser.uid;
    const agora = new Date();
    const diaSemana = agora.getDay(); // 0 = domingo, 6 = sábado

    // Bloqueia domingo
    if (diaSemana === 0) {
      mensagem.style.color = "red";
      mensagem.textContent = "Domingo não é permitido registrar ponto.";
      return;
    }

    // Adiciona regra de horário (opcional detalhada depois)
    // Aqui apenas registra, podemos refinar cálculo em relatórios

    await addDoc(collection(db, "pontos"), {
      uid: uid,
      tipo: tipo,
      data: agora.toISOString().split("T")[0],
      hora: agora.toTimeString().split(" ")[0],
      localizacao: loc,
      dispositivo: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
    });

    mensagem.textContent = `Ponto de ${tipo} registrado com sucesso!`;
    carregarHistorico();

  } catch (err) {
    mensagem.style.color = "red";
    mensagem.textContent = "Erro ao registrar ponto: " + err.message;
    console.error(err);
  }
}

// Mostrar formulário de justificativa
btnJustificativa.addEventListener("click", () => {
  formJust.style.display = formJust.style.display === "none" ? "block" : "none";
});

// Enviar justificativa
btnEnviarJust.addEventListener("click", async () => {
  const tipo = tipoJust.value;
  const desc = descJust.value.trim();
  if (!tipo || !desc) {
    mensagem.style.color = "red";
    mensagem.textContent = "Selecione tipo e descreva a justificativa.";
    return;
  }

  try {
    await addDoc(collection(db, "justificativas"), {
      uid: auth.currentUser.uid,
      tipo: tipo,
      descricao: desc,
      data: new Date().toISOString().split("T")[0],
      status: "pendente",
      adminUid: null
    });
    mensagem.style.color = "green";
    mensagem.textContent = "Justificativa enviada!";
    formJust.style.display = "none";
    descJust.value = "";
    tipoJust.value = "";
  } catch (err) {
    mensagem.style.color = "red";
    mensagem.textContent = "Erro: " + err.message;
  }
});

// Carregar histórico
async function carregarHistorico() {
  historicoDiv.innerHTML = "<p>Carregando...</p>";
  const q = query(collection(db, "pontos"), where("uid", "==", auth.currentUser.uid), orderBy("data", "desc"));
  const snapshot = await getDocs(q);

  historicoDiv.innerHTML = "";
  snapshot.forEach(doc => {
    const d = doc.data();
    const div = document.createElement("div");
    div.textContent = `${d.data} ${d.hora} - ${d.tipo} (${d.dispositivo})`;
    historicoDiv.appendChild(div);
  });
}

// Eventos dos botões
btnEntrada.addEventListener("click", () => registrarPonto("entrada"));
btnSaida.addEventListener("click", () => registrarPonto("saida"));

// Carregar histórico ao abrir
window.addEventListener("load", carregarHistorico);
