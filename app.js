import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// SUAS CREDENCIAIS APLICADAS
const firebaseConfig = {
  apiKey: "AIzaSyCVphiwmF-SBFyYYkjV-QvTvSFIigzIsoc",
  authDomain: "painel-tabelas.firebaseapp.com",
  projectId: "painel-tabelas",
  storageBucket: "painel-tabelas.firebasestorage.app",
  messagingSenderId: "189251122569",
  appId: "1:189251122569:web:2902e8c47235d826af9d58"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { localCache: persistentLocalCache() });
const auth = getAuth(app);

// ELEMENTOS DA TELA
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const userRoleBadge = document.getElementById('user-role-badge');
const btnNovo = document.getElementById('btn-novo');

// ELEMENTOS DO MODAL
const modalMedico = document.getElementById('modal-medico');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const btnSalvarMedico = document.getElementById('btn-salvar-medico');

// VARIÁVEL DE CONTROLE DE ACESSO
let isAdmin = false;
const EMAIL_GESTAO = "gestao@clinica.com"; // <-- CRIE ESTE EMAIL NO FIREBASE PARA SER O ADMIN

// LOGIN E LOGOUT
btnLogin.addEventListener('click', () => {
    signInWithEmailAndPassword(auth, emailInput.value, senhaInput.value)
    .catch((error) => alert("Erro ao entrar: " + error.message));
});

btnLogout.addEventListener('click', () => signOut(auth));

// CONTROLE DE SESSÃO E PERMISSÕES
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'flex';
        
        // Verifica se é o email da Gestão
        if(user.email === EMAIL_GESTAO) {
            isAdmin = true;
            userRoleBadge.textContent = "Gestão Administrador";
            userRoleBadge.classList.add('admin');
            btnNovo.style.display = 'flex'; // Mostra botão de adicionar
        } else {
            isAdmin = false;
            userRoleBadge.textContent = "Acesso Geral (Apenas Visualização)";
            userRoleBadge.classList.remove('admin');
            btnNovo.style.display = 'none'; // Esconde botão de adicionar
        }
        
        carregarCorpoClinico(); // Carrega os dados quando loga
    } else {
        loginScreen.style.display = 'flex';
        dashboardScreen.style.display = 'none';
    }
});

// NAVEGAÇÃO ENTRE ABAS (Menu Lateral)
document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remove active de todos
        document.querySelectorAll('.nav-btn[data-tab]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        
        // Adiciona active no clicado
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`tab-${tabId}`).style.display = 'block';
        
        // Muda o título da página
        document.getElementById('page-title').textContent = btn.textContent.trim();
    });
});

// ABRIR E FECHAR MODAL
btnNovo.addEventListener('click', () => modalMedico.style.display = 'flex');
btnFecharModal.addEventListener('click', () => modalMedico.style.display = 'none');

// SALVAR NOVO MÉDICO NO FIREBASE
btnSalvarMedico.addEventListener('click', async () => {
    if(!isAdmin) return; // Segurança extra
    
    const nome = document.getElementById('medico-nome').value;
    const especialidade = document.getElementById('medico-especialidade').value;
    const crm = document.getElementById('medico-crm').value;

    if(!nome || !especialidade) return alert("Preencha os campos obrigatórios!");

    btnSalvarMedico.textContent = "Salvando...";
    
    try {
        await addDoc(collection(db, "corpo_clinico"), {
            nome: nome,
            especialidade: especialidade,
            crm: crm
        });
        
        // Limpa form e fecha modal
        document.getElementById('medico-nome').value = '';
        document.getElementById('medico-especialidade').value = '';
        document.getElementById('medico-crm').value = '';
        modalMedico.style.display = 'none';
        btnSalvarMedico.textContent = "Salvar Dados";
        
    } catch (e) {
        alert("Erro ao salvar: " + e);
        btnSalvarMedico.textContent = "Salvar Dados";
    }
});

// CARREGAR DADOS DO BANCO EM TEMPO REAL
function carregarCorpoClinico() {
    const grid = document.getElementById('grid-medicos');
    
    // onSnapshot atualiza a tela na hora se alguém adicionar ou alterar algo
    onSnapshot(collection(db, "corpo_clinico"), (snapshot) => {
        grid.innerHTML = ''; // Limpa a tela
        
        if(snapshot.empty) {
            grid.innerHTML = '<p class="loading-text">Nenhum profissional cadastrado ainda.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const medico = doc.data();
            
            // Cria o HTML do Cardzinho
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-title">${medico.nome}</div>
                <div class="card-subtitle">${medico.especialidade}</div>
                <div class="card-info">CRM: ${medico.crm || 'N/A'}</div>
            `;
            grid.appendChild(card);
        });
    });
}
