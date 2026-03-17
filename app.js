import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

let isAdmin = false;
let abaAtual = 'home'; 
const EMAIL_GESTAO = "gestao@clinica.com";
let listaColaboradoresGlobal = []; // Guarda a lista de colaboradores

// DICIONÁRIO COMPLETO
const configuracaoAbas = {
    'colaboradores': { titulo: 'Colaborador (Equipe)', campos: ['Nome Completo do Colaborador', 'Setor ou Cargo'] },
    'corpo-clinico': { titulo: 'Médico', campos: ['Nome do Médico', 'Segmento', 'Especialidade', 'Unimed', 'CRM', 'CBO', 'URA'] },
    'convenios': { titulo: 'Convênio', campos: ['Convênio', 'Código', 'Serviço', 'Observações'] },
    'ultrassom': { titulo: 'Ultrassom', campos: ['Código', 'Exame', 'Profissional', 'Restrição de Idade', 'Observação'] },
    'consultas': { titulo: 'Consulta ou Procedimento', campos: ['Código', 'Tipo', 'Descrição', 'Observações'] },
    'pacotes': { titulo: 'Pacote PS', campos: ['Descrição', 'Valor ou Informacao', 'O que está incluso', 'Observações', 'Pacotes', 'Kit'] },
    'exames-imagem': { titulo: 'Exame de Imagem', campos: ['Código', 'Descrição', 'Valor', 'Prazo de Laudo', 'Onde encontrar resultado', 'Observações', 'Convênios'] },
    'institutos': { titulo: 'Instituto', campos: ['Número da Tabela', 'Profissional', 'Especialidade', 'Restrição de Idade', 'CRM', 'CBO', 'URA', 'Outros'] },
    'remocoes': { titulo: 'Remoção', campos: ['Nome do Lugar', 'Números (Separe por vírgula)', 'Local e Link Maps', 'Observações Importantes'] },
    'ramais': { titulo: 'Ramal', campos: ['Local ou Prédio', 'Setor', 'Número do Ramal', 'Observações'] },
    'emails': { titulo: 'E-mail', campos: ['Descrição do E-mail', 'Setor'] },
    'contatos-gerais': { titulo: 'Contato Geral', campos: ['Descrição (Lugar ou Pessoa)', 'Número'] },
    'contatos-convenios': { titulo: 'Contato Convênio', campos: ['Nome do Convênio', 'Número'] },
    'senhas': { titulo: 'Senha de Acesso', campos: ['Convênio ou Sistema', 'Link de Acesso', 'Senha', 'Local de Acesso Permitido'] },
    'boletins': { titulo: 'Boletim Informativo', campos: ['Título do Informativo', 'Tipo (Urgente, Norma, Regra, etc)', 'Data de Publicação', 'Link do Arquivo', 'Motivo ou Observação'] },
    'boletins-privados': { titulo: 'Informativo Direto (Privado)', campos: ['Para qual Colaborador?', 'Título do Documento', 'Link do Arquivo', 'Data de Publicação'] }
};

// Autenticação
document.getElementById('btn-login').addEventListener('click', () => {
    signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('senha').value).catch(err => alert("Erro: " + err.message));
});
document.getElementById('btn-logout').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard-screen').style.display = 'flex';
        isAdmin = (user.email === EMAIL_GESTAO);
        
        document.getElementById('user-role-badge').textContent = isAdmin ? "Gestão Administrador" : "Acesso Geral";
        if(isAdmin) {
            document.getElementById('user-role-badge').classList.add('admin');
            document.getElementById('btn-nav-privados').style.display = 'flex';
            document.getElementById('btn-nav-colaboradores').style.display = 'flex';
        }
        
        document.getElementById('btn-novo').style.display = (isAdmin && abaAtual !== 'home') ? 'flex' : 'none';
        document.getElementById('search-box').style.display = (abaAtual !== 'home') ? 'flex' : 'none';
        
        Object.keys(configuracaoAbas).forEach(idColecao => renderizarCards(idColecao));
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('dashboard-screen').style.display = 'none';
    }
});

// Navegação
document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn[data-tab]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        btn.classList.add('active');
        abaAtual = btn.getAttribute('data-tab');
        document.getElementById(`tab-${abaAtual}`).style.display = 'block';
        document.getElementById('page-title').textContent = btn.textContent.trim();
        
        document.getElementById('btn-novo').style.display = (isAdmin && abaAtual !== 'home') ? 'flex' : 'none';
        document.getElementById('search-box').style.display = (abaAtual !== 'home') ? 'flex' : 'none';
        document.getElementById('input-pesquisa').value = ''; // Limpa pesquisa ao trocar de aba
        filtrarCards(''); // Reseta o filtro
        
        if(abaAtual !== 'contatos' && window.voltarSubAba) window.voltarSubAba();
    });
});

// Modal Dinâmico
const modal = document.getElementById('modal-cadastro');

function abrirModal(colecao, docId = null, dadosAntigos = null) {
    const config = configuracaoAbas[colecao];
    document.getElementById('modal-title').textContent = docId ? `Editar ${config.titulo}` : `Novo(a) ${config.titulo}`;
    document.getElementById('modal-doc-id').value = docId || "";
    document.getElementById('card-color').value = (dadosAntigos && dadosAntigos.corCard) ? dadosAntigos.corCard : "#8B252C";

    let htmlCampos = '';
    config.campos.forEach(campo => {
        const valorAntigo = (dadosAntigos && dadosAntigos[campo]) ? dadosAntigos[campo] : '';
        
        // Se for Boletim Privado e pedir o nome do Colaborador, cria um Select com a lista!
        if(colecao === 'boletins-privados' && campo === 'Para qual Colaborador?') {
            htmlCampos += `<select id="input-${campo}" class="form-input" style="margin-bottom:15px; width:100%; padding:12px; border-radius:10px;"><option value="">Selecione o Colaborador...</option>`;
            listaColaboradoresGlobal.forEach(nome => {
                htmlCampos += `<option value="${nome}" ${valorAntigo === nome ? 'selected' : ''}>${nome}</option>`;
            });
            htmlCampos += `</select>`;
        } 
        else if(colecao === 'consultas' && campo === 'Tipo') {
            htmlCampos += `<select id="input-${campo}" class="form-input" style="margin-bottom:15px; width:100%; padding:12px; border-radius:10px;"><option value="">Selecione...</option><option value="Consulta" ${valorAntigo === 'Consulta' ? 'selected' : ''}>Consulta</option><option value="Exame" ${valorAntigo === 'Exame' ? 'selected' : ''}>Exame</option><option value="Pacotes" ${valorAntigo === 'Pacotes' ? 'selected' : ''}>Pacotes</option><option value="Outros" ${valorAntigo === 'Outros' ? 'selected' : ''}>Outros</option></select>`;
        } else if (campo.includes('Data')) {
            htmlCampos += `<input type="date" id="input-${campo}" value="${valorAntigo}" class="form-input">`;
        } else if (campo.includes('Link')) {
            htmlCampos += `<input type="url" id="input-${campo}" placeholder="Cole o link (Drive, YouTube, etc)" value="${valorAntigo}" class="form-input">`;
        } else {
            htmlCampos += `<input type="text" id="input-${campo}" placeholder="${campo}" value="${valorAntigo}" class="form-input">`;
        }
    });
    
    document.getElementById('modal-form-area').innerHTML = htmlCampos;
    document.getElementById('btn-salvar-dados').setAttribute('data-colecao', colecao);
    modal.style.display = 'flex';
}

document.getElementById('btn-novo').addEventListener('click', () => {
    let aba = abaAtual;
    if(aba === 'contatos') aba = document.getElementById('btn-novo').getAttribute('data-sub-aba') || alert("Abra uma categoria!");
    if(aba !== 'contatos') abrirModal(aba);
});
document.getElementById('btn-fechar-modal').addEventListener('click', () => modal.style.display = 'none');

document.getElementById('btn-salvar-dados').addEventListener('click', async () => {
    if(!isAdmin) return;
    const colecaoNome = document.getElementById('btn-salvar-dados').getAttribute('data-colecao');
    const docId = document.getElementById('modal-doc-id').value;
    const config = configuracaoAbas[colecaoNome];
    
    let dados = {};
    config.campos.forEach(campo => {
        const valor = document.getElementById(`input-${campo}`).value.trim();
        if(valor) dados[campo] = valor;
    });

    dados.corCard = document.getElementById('card-color').value;
    
    document.getElementById('btn-salvar-dados').textContent = "Salvando...";
    try {
        if (docId) await updateDoc(doc(db, colecaoNome, docId), dados);
        else await addDoc(collection(db, colecaoNome), dados);
        modal.style.display = 'none';
    } catch(e) { alert("Erro: " + e); }
    document.getElementById('btn-salvar-dados').textContent = "Salvar Dados";
});

// FUNÇÃO PARA O POPUP DE MÍDIA
window.abrirMidaFlutuante = function(url) {
    // Corrige links do Drive para modo leitura no iframe
    if(url.includes("drive.google.com") && url.includes("/view")) {
        url = url.replace("/view", "/preview");
    }
    document.getElementById('iframe-media').src = url;
    document.getElementById('link-externo').href = url;
    document.getElementById('modal-media').style.display = 'flex';
}
document.getElementById('btn-fechar-media').addEventListener('click', () => {
    document.getElementById('modal-media').style.display = 'none';
    document.getElementById('iframe-media').src = ""; // Para o vídeo/audio
});

// SISTEMA DE PESQUISA (FILTRO)
document.getElementById('input-pesquisa').addEventListener('keyup', (e) => {
    filtrarCards(e.target.value.toLowerCase());
});

function filtrarCards(texto) {
    const cards = document.querySelectorAll(`#tab-${abaAtual} .card, #tab-${abaAtual} .cards-grid[style*="block"] .card`);
    cards.forEach(card => {
        if(card.innerText.toLowerCase().includes(texto)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Ações nos Cards (Excluir, Editar, Assinar)
document.querySelector('.main-content').addEventListener('click', async (e) => {
    const btnExcluir = e.target.closest('.btn-delete');
    const btnEditar = e.target.closest('.btn-edit');
    const btnAssinar = e.target.closest('.btn-assinar');

    if (btnExcluir && isAdmin && confirm("Excluir permanentemente?")) {
        await deleteDoc(doc(db, btnExcluir.dataset.colecao, btnExcluir.dataset.id));
    }
    if (btnEditar && isAdmin) {
        abrirModal(btnEditar.dataset.colecao, btnEditar.dataset.id, JSON.parse(btnEditar.dataset.info));
    }
    
    if (btnAssinar && isAdmin) {
        const idDoc = btnAssinar.dataset.id;
        const colecao = btnAssinar.dataset.colecao;
        const selectElement = document.getElementById(`leitor-${idDoc}`);
        const nomeColaborador = selectElement.value;
        
        if(!nomeColaborador) return alert("Selecione um colaborador na lista!");
        
        const dataHoje = new Date().toLocaleString('pt-BR');
        const registro = `${nomeColaborador} (Lido em: ${dataHoje})`;
        
        await updateDoc(doc(db, colecao, idDoc), {
            leituras: arrayUnion(registro)
        });
    }
});

// --- RENDERIZADOR UNIVERSAL ---
function renderizarCards(colecaoNome) {
    const grid = document.getElementById(`grid-${colecaoNome}`);
    if(!grid) return;

    onSnapshot(collection(db, colecaoNome), (snapshot) => {
        grid.innerHTML = '';
        if(snapshot.empty) return;

        let itens = [];
        snapshot.forEach(doc => itens.push({ id: doc.id, data: doc.data() }));

        // Se for a aba de Colaboradores, atualiza a lista global!
        if(colecaoNome === 'colaboradores') {
            listaColaboradoresGlobal = itens.map(item => item.data['Nome Completo do Colaborador']).filter(Boolean).sort();
        }

        const campoTitulo = configuracaoAbas[colecaoNome].campos[0];
        itens.sort((a, b) => {
            const tituloA = a.data[campoTitulo] ? a.data[campoTitulo].toUpperCase() : "";
            const tituloB = b.data[campoTitulo] ? b.data[campoTitulo].toUpperCase() : "";
            return tituloA.localeCompare(tituloB);
        });

        itens.forEach((item) => {
            const data = item.data;
            const docId = item.id;
            
            // LÓGICA DE ANIMAÇÃO URGENTE
            const isUrgente = data['Tipo (Urgente, Norma, Regra, etc)'] && data['Tipo (Urgente, Norma, Regra, etc)'].toLowerCase().includes('urgente');
            const classeUrgente = isUrgente ? 'card-urgente' : '';
            
            const corEscolhida = data.corCard && data.corCard !== "transparent" ? data.corCard : "#ffffff";
            const fundoColorido = corEscolhida !== "#ffffff" ? corEscolhida + "1A" : "var(--surface-color)";
            
            let cardHtml = `<div class="card ${classeUrgente}" style="display:flex; flex-direction:column; gap:8px; border-left: 6px solid ${corEscolhida}; background-color: ${fundoColorido};">`;
            
            if (data[campoTitulo]) cardHtml += `<div class="card-title" style="margin-bottom:10px; font-size:18px; color:var(--text-main); font-weight:600;">${data[campoTitulo]}</div>`;
            
            for (const [chave, valor] of Object.entries(data)) {
                if (chave !== campoTitulo && chave !== 'corCard' && chave !== 'leituras') {
                    if(chave.includes('Link')) {
                        // Chama a nova função do Modal!
                        cardHtml += `<div class="boletim-media"><button onclick="abrirMidaFlutuante('${valor}')" style="background: var(--primary-color); color: white; border:none; cursor:pointer; padding: 8px 16px; border-radius: 8px; font-size: 13px; margin-top: 10px;"><i class="ri-eye-line"></i> Acessar Material</button></div>`;
                    } else {
                        // Destaca se for urgente no texto também
                        const corTexto = (isUrgente && chave.includes('Tipo')) ? '#e53e3e; font-weight:bold;' : 'var(--text-main)';
                        cardHtml += `<div class="card-info" style="font-size:14px; color:${corTexto};"><strong style="color:var(--primary-color)">${chave}:</strong> ${valor}</div>`;
                    }
                }
            }
            
            // Área de Check de Boletins (Gerais e Privados)
            if(colecaoNome.includes('boletins')) {
                cardHtml += `<div class="leituras-lista" style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--border-color); font-size: 13px;"><strong>Status de Leitura/Ciente:</strong>`;
                if(data.leituras && data.leituras.length > 0) {
                    data.leituras.forEach(leitura => {
                        cardHtml += `<div class="leitura-item" style="display: flex; justify-content: space-between; background: rgba(255,255,255,0.6); padding: 6px 10px; border-radius: 6px; margin-top: 6px;"><i class="ri-check-double-line" style="color:#38a169;"></i> <span style="color: #38a169; font-weight: 600; font-size:11px;">${leitura}</span></div>`;
                    });
                } else {
                    cardHtml += `<div style="color:var(--text-muted); font-size: 12px; margin-top:5px;">Nenhuma assinatura registrada.</div>`;
                }
                
                if(isAdmin) {
                    cardHtml += `<div class="add-leitura-box" style="display: flex; gap: 8px; margin-top: 10px;">`;
                    
                    // CRIA A LISTA SUSPENSA COM OS COLABORADORES
                    cardHtml += `<select id="leitor-${docId}" style="flex:1; padding:6px; border-radius:4px; border:1px solid #ccc; font-size:12px; background:white;"><option value="">Selecionar quem leu...</option>`;
                    listaColaboradoresGlobal.forEach(colab => {
                        cardHtml += `<option value="${colab}">${colab}</option>`;
                    });
                    cardHtml += `</select>`;
                    
                    cardHtml += `<button class="btn-action btn-assinar" data-id="${docId}" data-colecao="${colecaoNome}" style="background:#38a169; color:white; padding:4px 10px; border-radius:4px; cursor:pointer;"><i class="ri-check-line"></i> Carimbar</button></div>`;
                }
                cardHtml += `</div>`;
            }
            
            if (isAdmin) {
                const dadosSeguros = JSON.stringify(data).replace(/'/g, "&apos;").replace(/"/g, "&quot;");
                cardHtml += `
                <div class="card-actions" style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 15px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                    <button class="btn-action btn-edit" data-id="${docId}" data-colecao="${colecaoNome}" data-info="${dadosSeguros}" title="Editar" style="background: none; border: none; cursor: pointer; font-size: 18px; color: #3182ce;"><i class="ri-pencil-line"></i></button>
                    <button class="btn-action btn-delete" data-id="${docId}" data-colecao="${colecaoNome}" title="Excluir" style="background: none; border: none; cursor: pointer; font-size: 18px; color: #e53e3e;"><i class="ri-delete-bin-line"></i></button>
                </div>`;
            }
            cardHtml += `</div>`;
            grid.innerHTML += cardHtml;
        });
    });
}
