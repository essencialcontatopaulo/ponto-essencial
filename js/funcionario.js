import { auth, db } from "./firebase-config.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

window.registrar = async function (tipo) {
  if (!navigator.geolocation) {
    alert("Localização não suportada");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    await addDoc(collection(db, "pontos"), {
      uid: auth.currentUser.uid,
      tipo: tipo,
      data: serverTimestamp(),
      localizacao: {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }
    });

    document.getElementById("msg").innerText = "Registro realizado com sucesso";
  });
};

window.registrarJustificativa = async function () {
  const justificativa = document.getElementById("justificativa").value;
  if (!justificativa) return alert("Selecione a justificativa");

  await addDoc(collection(db, "justificativas"), {
    uid: auth.currentUser.uid,
    tipo: justificativa,
    data: serverTimestamp()
  });

  document.getElementById("msg").innerText = "Justificativa enviada";
};
