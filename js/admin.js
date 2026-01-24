import { auth, db } from "./firebase-config.js";
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

window.registrar = async function (tipo) {
  navigator.geolocation.getCurrentPosition(async (pos) => {
    await addDoc(collection(db, "pontos"), {
      uid: auth.currentUser.uid,
      tipo,
      data: serverTimestamp(),
      localizacao: {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }
    });
    alert("Registro feito");
  });
};

async function carregarRelatorios() {
  const snapshot = await getDocs(collection(db, "pontos"));
  const div = document.getElementById("relatorios");

  snapshot.forEach(doc => {
    div.innerHTML += `<p>${doc.data().tipo}</p>`;
  });
}

carregarRelatorios();
