import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

window.login = async function () {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const uid = userCredential.user.uid;

    const docRef = doc(db, "usuarios", uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert("Usuário não cadastrado corretamente.");
      return;
    }

    const tipo = docSnap.data().tipo;

    if (tipo === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "funcionario.html";
    }

  } catch (error) {
    document.getElementById("erro").innerText = "Login inválido";
  }
};
