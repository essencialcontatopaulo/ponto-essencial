import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const form = document.getElementById("formCadastro");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const tipo = document.getElementById("tipo").value;

  try {
    // Criar usuário no Firebase Auth
    const userCred = await createUserWithEmailAndPassword(auth, email, senha);
    const uid = userCred.user.uid;

    // Criar documento na coleção 'usuarios'
    await setDoc(doc(db, "usuarios", uid), {
      nome: nome,
      tipo: tipo,
      email: email
    });

    msg.innerText = `Usuário ${nome} cadastrado com sucesso!`;

    form.reset();
  } catch (error) {
    msg.innerText = `Erro: ${error.message}`;
  }
});
