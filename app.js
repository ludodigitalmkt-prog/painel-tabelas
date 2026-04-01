window.aplicarImagemClimaHome = function(imageUrl = '') {
    const weatherWidget = document.querySelector('.weather-widget');
    if (!weatherWidget) return;
    const bruto = window.formatarLinkImagem ? window.formatarLinkImagem(imageUrl) : imageUrl;
    const urlFormatada = String(bruto || '').trim();
    if (!urlFormatada) {
        weatherWidget.style.backgroundImage = '';
        weatherWidget.style.backgroundSize = '';
        weatherWidget.style.backgroundPosition = '';
        weatherWidget.style.backgroundRepeat = '';
        return;
    }
    weatherWidget.style.backgroundImage = `linear-gradient(rgba(30,60,114,0.72), rgba(30,60,114,0.72)), url("${urlFormatada}")`;
    weatherWidget.style.backgroundSize = 'cover';
    weatherWidget.style.backgroundPosition = 'center';
    weatherWidget.style.backgroundRepeat = 'no-repeat';
};

window.carregarConfiguracoes = function() {
    onSnapshot(doc(db, "configuracoes", "gerais"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const area = document.getElementById('banner-content');
            if(area) { if(data.banner_texto && data.banner_texto.trim() !== '') area.innerHTML = `<h2>${data.banner_texto.replace(/\n/g, '<br>')}</h2>`; else area.innerHTML = `<h2>Bem-vindo ao Painel Clínico</h2>`; }
            
            const mapIds = {
                'tab-input-banner': 'banner_texto', 'tab-input-locais': 'locais', 'tab-input-setores': 'setores',
                'tab-input-especialidades': 'especialidades', 'tab-input-motivos': 'motivos', 'tab-input-imagem-pastas': 'imagem_padrao_pastas',
                'tab-input-chat-logo': 'chat_logo', 'tab-color-chat': 'chat_cor', 'tab-color-pendente': 'cor_pendente', 'tab-color-concluido': 'cor_concluido', 'tab-input-weather-image': 'weather_image'
            };

            Object.keys(mapIds).forEach(id => {
                const el = document.getElementById(id);
                if(el && data[mapIds[id]] !== undefined) el.value = data[mapIds[id]];
            });

            const chatLogo = data.chat_logo || "https://cdn-icons-png.flaticon.com/512/8943/8943377.png";
            const chatCor = data.chat_cor || "#0ba360";
            document.documentElement.style.setProperty('--chat-primary', chatCor);
            
            const fabImg = document.getElementById('chat-fab-img'); const headerImg = document.getElementById('chat-header-img');
            const _chatLogoFinal = window.formatarLinkImagem(chatLogo) || chatLogo || './logo.png';
            if(fabImg){ fabImg.src = _chatLogoFinal; fabImg.onerror = () => { fabImg.src = './logo.png'; }; }
            if(headerImg){ headerImg.src = _chatLogoFinal; headerImg.onerror = () => { headerImg.src = './logo.png'; }; }
            window.aplicarImagemClimaHome(data.weather_image || '');

            window.corStatusPendente = data.cor_pendente || '#e53e3e'; window.corStatusConcluido = data.cor_concluido || '#38a169';
            
            locaisGlobais = data.locais ? data.locais.split('\n').filter(l => l.trim() !== '') : [];
            setoresGlobais = data.setores ? data.setores.split('\n').filter(s => s.trim() !== '') : [];
            especialidadesGlobais = data.especialidades ? data.especialidades.split('\n').filter(s => s.trim() !== '') : [];
            motivosGlobais = data.motivos ? data.motivos.split('\n').filter(m => m.trim() !== '') : [];
            
            if(abaAtual === 'boletins' && !window.pastaBoletimAtual) window.renderizarPastasBoletins();
            if(abaAtual === 'boletins-privados' && !window.pastaPrivadoAtual) window.renderizarPastasPrivados();
        }
    });
};

window.toggleChat = function() {
    const win = document.getElementById('chat-window');
    const fab = document.getElementById('chat-fab');
    const input = document.getElementById('chat-input');
    if (!win || !fab) return;

    const abrindo = (win.style.display === 'none' || win.style.display === '');
    if (abrindo) {
        win.style.display = 'flex';
        if (typeof window.ocultarTooltipChatbot === 'function') window.ocultarTooltipChatbot();

        if (!window.chatJaInicializado) {
            if (typeof window.abrirSaudacaoChat === 'function') window.abrirSaudacaoChat();
            window.chatJaInicializado = true;
        } else {
            const body = document.getElementById('chat-body');
            if (body && body.innerHTML.trim() === '') {
                if (typeof window.abrirSaudacaoChat === 'function') window.abrirSaudacaoChat();
            }
        }
    } else {
        win.style.display = 'none';
    }
};

window.renderizarSugestoesChat = function() {
    const quickRepliesDiv = document.querySelector('.chat-quick-replies');
    if (!quickRepliesDiv) return;

    const termosPopulares = [
        { label: 'Cardiologia', icon: 'ri-heart-pulse-line' },
        { label: 'Ultrassom', icon: 'ri-pulse-line' },
        { label: 'Unimed', icon: 'ri-shield-cross-line' },
        { label: 'Raio-X', icon: 'ri-scan-2-line' },
        { label: 'Pediatria', icon: 'ri-user-heart-line' },
        { label: 'Ortopedia', icon: 'ri-wheelchair-line' },
        { label: 'Consulta', icon: 'ri-stethoscope-line' },
        { label: 'Boletim', icon: 'ri-newspaper-line' }
    ];

    termosPopulares.sort(() => 0.5 - Math.random());
    const top4 = termosPopulares.slice(0, 4);

    quickRepliesDiv.innerHTML = top4.map(item =>
        `<button type="button" onclick="window.sendQuickMsg('${item.label.replace(/'/g, "\\'")}')">
            <i class="${item.icon}"></i>
            <span>${item.label}</span>
        </button>`
    ).join('');
};

window.sendQuickMsg = function(texto) { const input = document.getElementById('chat-input'); if(input) { input.value = texto; window.sendChat(); } };
window.sendChat = function() {
    const input = document.getElementById('chat-input'); if(!input) return;
    const msg = input.value.trim(); if (!msg) return;
    window.addChatBubble(msg, 'user'); input.value = '';
    setTimeout(() => { const resposta = window.processarLogicaDoBot(msg); window.addChatBubble(resposta, 'bot'); }, 600);
};

window.addChatBubble = function(text, sender) { const chatArea = document.getElementById('chat-body'); if(!chatArea) return; const div = document.createElement('div'); div.className = `chat-msg ${sender}`; div.innerHTML = text; chatArea.appendChild(div); chatArea.scrollTop = chatArea.scrollHeight; };
window.handleChatFollowUp = function(resposta, btnElement) {
    if(btnElement && btnElement.parentElement) { btnElement.parentElement.innerHTML = `<span style="color: var(--text-muted); font-size: 11px;">Opção selecionada: ${resposta === 'sim' ? 'Sim' : 'Não'}</span>`; }
    if (resposta === 'sim') { window.addChatBubble("Pode escrever aqui abaixo que estou aqui para te ajudar! ", 'bot'); } else {
        const frasesMotivacionais = ["Ter uma inteligência artificial para ajudar é ótimo, mas lembre-se: conte sempre com o seu colega ao lado. O trabalho em equipe nos leva mais longe! ", "Que você tenha um excelente turno! A tecnologia agiliza, mas é o calor humano da nossa equipe que faz a clínica brilhar. ", "Agradeço a consulta! Juntos somos mais fortes. O sucesso é a soma do esforço de toda a equipe. Um abraço virtual! "];
        window.addChatBubble(frasesMotivacionais[Math.floor(Math.random() * frasesMotivacionais.length)], 'bot');
    }
};

window.processarLogicaDoBot = function(mensagemUser) {
    const texto = mensagemUser.toLowerCase().trim();
    if (texto === 'oi' || texto === 'ol' || texto === 'ola' || texto.includes('bom dia') || texto.includes('boa tarde')) return "Olá! Sou a assistente virtual da clínica. Como posso ajudar? Busque por especialidades, médicos ou exames!";
    let resultadosUnicos = {};
    ['corpo-clinico', 'ultrassom', 'exames-imagem', 'consultas', 'convenios', 'ramais', 'pacotes', 'institutos', 'boletins'].forEach(colecao => {
        const itens = window.todosOsDadosDoSistema[colecao] || window.dadosGlobaisAbas[colecao] || [];
        itens.forEach(item => {
            let textoItem = ""; Object.entries(item.data).forEach(([key, val]) => { textoItem += `${key} ${val} `; }); textoItem = textoItem.toLowerCase();
            let matches = false;
            if (texto === 'unimed' || texto === 'convênio' || texto === 'convenio') {
                if ((item.data['Unimed'] && item.data['Unimed'].toString().toLowerCase() !== 'não' && item.data['Unimed'].toString().toLowerCase() !== 'nao') || (item.data['Convênios Aceitos'] && String(item.data['Convênios Aceitos']).toLowerCase().includes('unimed')) || (item.data['Convênios'] && String(item.data['Convênios']).toLowerCase().includes('unimed')) || colecao === 'convenios') matches = true;
            } else if (textoItem.includes(texto)) { matches = true; }

            if(colecao === 'boletins' && (String(item.data['Título do Informativo'] || '').toLowerCase().includes(texto) || String(item.data['Motivo'] || '').toLowerCase().includes(texto) || String(item.data['Para quais Setores?'] || '').toLowerCase().includes(texto))) matches = true;

            if (matches) {
                const config = configuracaoAbas[colecao];
                let tituloItem = item.data[config.campos[0]] || 'Detalhes'; let detalhesStr = '';
                if(colecao === 'boletins') tituloItem = `Boletim: ${item.data['Título do Informativo']}`;
                
                let profissionais = item.data['Profissionais que realizam (Opcional)'];
                if(profissionais && profissionais.trim() !== '') {
                    detalhesStr += `<div style="background:#eefbf4; padding:8px; border-radius:8px; margin-bottom:8px; border-left:3px solid #38a169;"><b>️ Quem realiza:</b> ${profissionais}</div>`;
                }

                let cont = 0;
                Object.entries(item.data).forEach(([k, v]) => { if(v && k !== config.campos[0] && k !== 'corCard' && !String(k).includes('Link') && k !== 'Profissionais que realizam (Opcional)' && cont < 2) { detalhesStr += `<b>${k}:</b> ${v}<br>`; cont++; } });

                let pastaAgrupadora = config.campoAgrupador ? item.data[config.campoAgrupador] : null; let btnAction = '';
                
                if (pastaAgrupadora && colecao !== 'colaboradores') { 
                    btnAction = `<button onclick="window.irParaAba('${colecao}'); setTimeout(() => { window.abrirPastaGenerica('${colecao}', '${pastaAgrupadora.replace(/'/g, "\\'")}', '${item.id}') }, 200); window.toggleChat();" class="btn-hover color-5" style="height: 30px; font-size: 11px; padding: 0 15px; margin-top: 8px; width: 100%; border-radius: 6px;"><i class="ri-folder-open-line"></i> Ver na Pasta</button>`; 
                } 
                else if (colecao === 'boletins') { 
                    const setorBoletim = item.data['Para quais Setores?'] ? String(item.data['Para quais Setores?']).split(',')[0] : 'Geral'; 
                    btnAction = `<button onclick="window.irParaAba('${colecao}'); setTimeout(() => { window.abrirPastaBoletim('${setorBoletim.replace(/'/g, "\\'")}', '${item.id}') }, 200); window.toggleChat();" class="btn-hover color-5" style="height: 30px; font-size: 11px; padding: 0 15px; margin-top: 8px; width: 100%; border-radius: 6px;"><i class="ri-folder-open-line"></i> Abrir Boletim</button>`; 
                } 
                else { 
                    btnAction = `<button onclick="window.irParaAba('${colecao}'); setTimeout(() => { window.destacarCard('${item.id}') }, 300); window.toggleChat();" class="btn-hover color-8" style="height: 30px; font-size: 11px; padding: 0 15px; margin-top: 8px; width: 100%; border-radius: 6px;"><i class="ri-arrow-right-circle-line"></i> Localizar na Aba</button>`; 
                }

                resultadosUnicos[item.id] = `<div style="background: white; border: 1px solid var(--border-color); padding: 12px; border-radius: 10px; margin-bottom: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);"><div style="font-weight: 700; color: var(--primary-color); margin-bottom: 5px; font-size: 14px; line-height: 1.2;">${tituloItem}</div><div style="font-size: 12px; color: var(--text-main); line-height: 1.4;">${detalhesStr}</div>${btnAction}</div>`;
            }
        });
    });

    let resultadosEncontrados = Object.values(resultadosUnicos);
    if (resultadosEncontrados.length > 0) {
        let respostaFormatada = `Encontrei isso no sistema para <b>"${mensagemUser}"</b>:<br><br>`;
        const limite = resultadosEncontrados.slice(0, 3); respostaFormatada += limite.join('');
        if (resultadosEncontrados.length > 3) { respostaFormatada += `<div style="text-align:center; font-size:11px; color:var(--text-muted); margin-top:5px;">+${resultadosEncontrados.length - 3} resultados ocultos.</div><br>`; }
        const dicas = ["Dica: Se o paciente precisar de exames, pesquise o nome do exame que eu te digo qual médico faz! ", "Você também pode pesquisar por Convênios para ver as regras de atendimento!", "Na dúvida? Pesquise pelo setor e eu te mostro os ramais."];
        respostaFormatada += `<div style="background: #e2e8f0; padding: 10px; border-radius: 8px; font-size: 11px; margin-top: 10px; border-left: 3px solid var(--primary-color);"> <b>Dica:</b> ${dicas[Math.floor(Math.random() * dicas.length)]}</div>`;
        return respostaFormatada;
    }
    return "Desculpe, não localizei nenhuma informação no sistema sobre isso. <br><br>Tente pesquisar por uma palavra-chave mais simples, como o nome de um exame ou especialidade!";
};

if (!document.getElementById('modal-resposta-aluno')) {
    const m = document.createElement('div'); m.id = 'modal-resposta-aluno'; m.className = 'modal-overlay'; m.style.display = 'none'; m.style.zIndex = '10001';
    m.innerHTML = `<div class="modal-box glass-effect" style="max-width: 600px; max-height: 90vh; display:flex; flex-direction:column;"><header class="modal-header"><h3 id="resposta-titulo">Responder Atividade</h3><button onclick="document.getElementById('modal-resposta-aluno').style.display='none'" class="btn-icon"><i class="ri-close-line"></i></button></header><div class="modal-body" style="overflow-y: auto; flex:1;" id="area-perguntas-dinamicas"></div><input type="hidden" id="resposta-docid"><button onclick="window.enviarRespostaTreinamento()" class="btn-hover color-11" style="width: 100%; margin-top: 15px; background: #3182ce; color:white; border:none;"><i class="ri-send-plane-fill"></i> Enviar Resposta para Correção</button></div>`;
    document.body.appendChild(m);
}

if (!document.getElementById('modal-correcao-admin')) {
    const c = document.createElement('div'); c.id = 'modal-correcao-admin'; c.className = 'modal-overlay'; c.style.display = 'none'; c.style.zIndex = '10005';
    c.innerHTML = `<div class="modal-box glass-effect" style="max-width: 600px; max-height: 90vh; display:flex; flex-direction:column;"><header class="modal-header"><h3>Corrigir Resposta</h3><button onclick="document.getElementById('modal-correcao-admin').style.display='none'; document.getElementById('modal-leituras').style.display='flex';" class="btn-icon"><i class="ri-close-line"></i></button></header><div class="modal-body" style="overflow-y: auto; flex:1;"><div id="correcao-respostas-aluno" style="margin-bottom:15px; background:rgba(0,0,0,0.03); padding:10px; border-radius:8px; font-size:13px; white-space:pre-wrap;"></div><label style="font-size:12px; font-weight:600;">Nota Atribuída (XP):</label><input type="number" id="correcao-nota" class="form-input" style="margin-bottom:10px;"><label style="font-size:12px; font-weight:600;">Feedback / Observação do Gestor:</label><textarea id="correcao-feedback" class="form-input" style="height:80px; resize:vertical;"></textarea><input type="hidden" id="correcao-docid"><input type="hidden" id="correcao-nomealuno"></div><button onclick="window.salvarCorrecaoAdmin()" class="btn-hover color-11" style="width: 100%; margin-top: 15px; background: #38a169; color:white; border:none;"><i class="ri-check-line"></i> Salvar Correção</button></div>`;
    document.body.appendChild(c);
}

if (!document.getElementById('modal-feedback-aluno')) {
    const fb = document.createElement('div'); fb.id = 'modal-feedback-aluno'; fb.className = 'modal-overlay'; fb.style.display = 'none'; fb.style.zIndex = '10002';
    fb.innerHTML = `<div class="modal-box glass-effect" style="max-width: 500px;"><header class="modal-header"><h3>Feedback do Supervisor</h3><button onclick="document.getElementById('modal-feedback-aluno').style.display='none'" class="btn-icon"><i class="ri-close-line"></i></button></header><div class="modal-body"><div style="text-align:center; margin-bottom:15px;"><div style="font-size:40px; color:#38a169;"><i class="ri-award-fill"></i></div><h2 style="color:var(--primary-color);">Nota: <span id="feedback-nota"></span></h2></div><div style="background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 14px; color: var(--text-main); border-left: 4px solid var(--primary-color);"><span id="feedback-texto" style="white-space: pre-wrap;"></span></div></div></div>`;
    document.body.appendChild(fb);
}


window.abrirListaLeituras = function(docId, colecao) {
    const modal = document.getElementById('modal-leituras');
    const titulo = document.getElementById('modal-leitura-titulo');
    const areaOk = document.getElementById('lista-lidos-content');
    const areaPend = document.getElementById('lista-falta-content');
    if(!modal || !titulo || !areaOk || !areaPend) return;

    let data = null;
    if(colecao === 'treinamentos') data = window.todosTreinamentosData.find(item => item.id === docId)?.data || null;
    else if(colecao === 'boletins') data = window.todosBoletinsData.find(item => item.id === docId)?.data || null;
    else if(colecao === 'boletins-privados') data = window.todosPrivadosData.find(item => item.id === docId)?.data || null;
    if(!data) return alert('Não localizei este registro atualizado.');

    const renderEmpty = (texto) => `<div style="padding:12px; border:1px dashed var(--border-color); border-radius:12px; color:var(--text-muted); background:#f8fafc;">${texto}</div>`;
    const cardBase = (conteudo, cor='#cbd5e1') => `<div style="padding:12px; border-radius:12px; background:#fff; border-left:4px solid ${cor}; margin-bottom:10px; box-shadow:var(--shadow-soft);">${conteudo}</div>`;

    areaOk.innerHTML = '';
    areaPend.innerHTML = '';

    if(colecao === 'treinamentos') {
        titulo.textContent = `Respostas da atividade: ${data['Título da Atividade'] || 'Treinamento'}`;
        const publico = window.obterPublicoAlvo(data['Para quais Setores?'], data['Colaborador Específico (Opcional)']);
        const respostas = (data.respostas_alunos || []).map(item => window.safeParseJSON(item)).filter(Boolean);
        const respondidos = new Set();

        respostas.forEach(resp => {
            respondidos.add(resp.nome);
            const nota = (resp.nota !== '' && resp.nota !== undefined && resp.nota !== null) ? `<span style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:999px; font-size:11px; font-weight:700;">Nota: ${resp.nota}</span>` : `<span style="background:#fef3c7; color:#92400e; padding:4px 8px; border-radius:999px; font-size:11px; font-weight:700;">Aguardando correção</span>`;
            const nomeEscapado = String(resp.nome || '').replace(/'/g, "\\'");
            const btnCorrigir = isAdmin ? `<button onclick="window.abrirCorrecaoAdmin('${docId}', '${nomeEscapado}')" class="btn-hover color-8" style="height:32px; font-size:11px; padding:0 14px; margin-top:10px;"><i class="ri-edit-2-line"></i> ${resp.nota !== '' ? 'Revisar correção' : 'Corrigir resposta'}</button>` : '';
            areaOk.innerHTML += cardBase(`
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
                    <div>
                        <strong style="display:block; color:var(--text-main);">${window.escapeHTML(resp.nome || 'Colaborador')}</strong>
                        <span style="font-size:12px; color:var(--text-muted);">Enviado em: ${window.escapeHTML(resp.data || '-')}</span>
                    </div>
                    ${nota}
                </div>
                <div style="margin-top:10px; font-size:12px; color:var(--text-muted);">${(resp.respostas || []).length} resposta(s) enviada(s).</div>
                ${btnCorrigir}
            `, '#38a169');
        });

        if(!respostas.length) areaOk.innerHTML = renderEmpty('Nenhuma resposta enviada ainda.');

        const faltantes = publico.filter(nome => !respondidos.has(nome));
        areaPend.innerHTML = faltantes.length
            ? faltantes.map(nome => cardBase(`<strong style="display:block; color:var(--text-main);">${window.escapeHTML(nome)}</strong><span style="font-size:12px; color:var(--text-muted);">Ainda não enviou a atividade.</span>`, '#e53e3e')).join('')
            : renderEmpty('Todos os colaboradores do público-alvo já responderam.');
    } else {
        const publico = colecao === 'boletins-privados'
            ? [String(data['Para qual Colaborador?'] || '').trim()].filter(Boolean)
            : window.obterPublicoAlvo(data['Para quais Setores?']);
        titulo.textContent = `${colecao === 'boletins-privados' ? 'Leitura do informativo direto' : 'Leitura do boletim'}: ${data['Título do Documento'] || data['Título do Informativo'] || 'Documento'}`;
        const leituras = (data.leituras || []).filter(Boolean);
        const lidosMap = new Map();
        leituras.forEach(registro => lidosMap.set(window.extrairNomeRegistro(registro), registro));

        const lidos = publico.filter(nome => lidosMap.has(nome));
        const faltantes = publico.filter(nome => !lidosMap.has(nome));

        areaOk.innerHTML = lidos.length
            ? lidos.map(nome => cardBase(`<strong style="display:block; color:var(--text-main);">${window.escapeHTML(nome)}</strong><span style="font-size:12px; color:var(--text-muted);">${window.escapeHTML(lidosMap.get(nome) || '')}</span>`, '#38a169')).join('')
            : renderEmpty('Nenhuma leitura registrada até o momento.');

        areaPend.innerHTML = faltantes.length
            ? faltantes.map(nome => cardBase(`<strong style="display:block; color:var(--text-main);">${window.escapeHTML(nome)}</strong><span style="font-size:12px; color:var(--text-muted);">Leitura pendente.</span>`, '#e53e3e')).join('')
            : renderEmpty('Nenhuma pendência restante.');
    }

    modal.style.display = 'flex';
};

window.sairPortalAluno = function() { window.alunoLogado = null; document.getElementById('ensino-dashboard-area').style.display = 'none'; document.getElementById('ensino-login-area').style.display = 'block'; document.getElementById('login-aluno-pin').value = ''; };

window.renderizarTrilhaAluno = function() {
    if(!window.alunoLogado) return;
    const grid = document.getElementById('grid-trilha-aluno'); if(!grid) return; grid.innerHTML = '';
    const nomeAluno = window.alunoLogado['Nome Completo do Colaborador'];
    const setorAluno = window.alunoLogado['Setor da Clínica'] || 'Geral';

    let pontos = 0; let pendentes = 0;
    const treinamentosAluno = window.todosTreinamentosData.filter(item => {
        const setorAlvo = String(item.data['Para quais Setores?'] || 'Geral');
        const colabAlvo = String(item.data['Colaborador Específico (Opcional)'] || '');
        if (colabAlvo && colabAlvo !== '' && !colabAlvo.includes('Nenhum')) return colabAlvo === nomeAluno;
        return setorAlvo.includes('Geral') || setorAlvo.includes(setorAluno);
    });

    if(treinamentosAluno.length === 0) { grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--text-muted); background: white; padding: 20px; border-radius: 10px;">Sem treinamentos pendentes. Parabéns! </p>'; }

    treinamentosAluno.forEach(item => {
        const d = item.data; const docId = item.id;
        const respostas = d.respostas_alunos || [];
        let minhaResposta = null; respostas.forEach(r => { try { let obj = window.safeParseJSON(r, null); if(obj.nome === nomeAluno) minhaResposta = obj; } catch(e){} });

        const concluidos = d.leituras || []; const jaLeu = concluidos.some(txt => txt.startsWith(nomeAluno));
        const tipo = d['Tipo (Vídeo, PDF, Tarefa, Prova)'] || 'Vídeo';
        const precisaResponder = tipo && (tipo.includes('Tarefa') || tipo.includes('Prova'));
        const pontosItem = parseInt(d['Pontos Valendo']) || 0;
        
        let jaFez = false; let statusTexto = 'Pendente'; let corStatus = '#e53e3e'; let iconeStatus = 'ri-time-line';

        if(precisaResponder) {
            if(minhaResposta) {
                jaFez = true;
                if(minhaResposta.nota && minhaResposta.nota !== "") { statusTexto = `Corrigido (Nota: ${minhaResposta.nota})`; corStatus = '#38a169'; iconeStatus = 'ri-award-fill'; pontos += parseInt(minhaResposta.nota) || 0; } 
                else { statusTexto = 'Aguardando Correção'; corStatus = '#ecc94b'; iconeStatus = 'ri-hourglass-line'; }
            } else { pendentes++; }
        } else {
            if(jaLeu) { jaFez = true; statusTexto = 'Concluído'; corStatus = '#38a169'; iconeStatus = 'ri-check-double-line'; pontos += pontosItem; } 
            else { pendentes++; }
        }

        let btnAcao = '';
        if(d['Link do Material (Se houver)']) btnAcao += `<button onclick="window.abrirMidiaFlutuante('${String(d['Link do Material (Se houver)']).trim()}')" class="btn-hover color-8" style="width: 100%; height: 35px; border-radius: 8px; font-size: 13px; margin-bottom: 8px;"><i class="ri-eye-line"></i> Acessar Material</button>`;

        if(!jaFez) {
            if(precisaResponder) {
                const confJSON = (d['Configuração da Avaliação'] || '[]').replace(/'/g, "&apos;").replace(/"/g, "&quot;");
                btnAcao += `<button onclick="window.abrirModalResposta('${docId}', '${confJSON}')" class="btn-hover color-11" style="width: 100%; height: 35px; border-radius: 8px; font-size: 13px; background: #3182ce; color:white; border:none;"><i class="ri-pencil-fill"></i> Responder Atividade</button>`;
            } else {
                btnAcao += `<button onclick="window.concluirTreinamento('${docId}')" class="btn-hover color-11" style="width: 100%; height: 35px; border-radius: 8px; font-size: 13px; background: #38a169; color:white; border:none;"><i class="ri-check-double-line"></i> Marcar como LIDO</button>`;
            }
        } else if (precisaResponder && minhaResposta && minhaResposta.nota !== "") {
            btnAcao += `<button onclick="window.verFeedback('${minhaResposta.nota}', \`${(minhaResposta.feedback || 'Sem comentrios.').replace(/'/g, "&apos;")}\`)" class="btn-hover color-8" style="width: 100%; height: 35px; border-radius: 8px; font-size: 13px; margin-top:8px;"><i class="ri-message-3-line"></i> Ver Correção</button>`;
        }

        grid.innerHTML += `<div class="card" style="border: 2px solid ${corStatus}; display:flex; flex-direction:column; background: white; border-radius: 10px; padding: 15px;"><div style="font-size:10px; opacity:0.7; text-transform:uppercase; font-weight:700; margin-bottom:5px; color: var(--primary-color);"><i class="ri-book-open-line"></i> MÓDULO: ${d['Pasta / Módulo']} | TIPO: ${tipo}</div><div style="font-size:16px; font-weight:600; margin-bottom:10px; line-height: 1.2;">${d['Título da Atividade']}</div><div style="font-size:12px; color:var(--text-muted); margin-bottom:15px; flex:1;"><b>Pontos Base:</b> <span style="color:#e75516; font-weight:700;">+${pontosItem} XP</span><br><b>Status:</b> <span style="color:${corStatus}; font-weight:600;"><i class="${iconeStatus}"></i> ${statusTexto}</span></div>${btnAcao}</div>`;
    });

    const ptsEl = document.getElementById('aluno-pontos'); const pendEl = document.getElementById('aluno-tarefas-pendentes');
    if(ptsEl) ptsEl.textContent = pontos; if(pendEl) pendEl.textContent = pendentes;
    
    if(window.renderizarPesquisasAluno) window.renderizarPesquisasAluno(); 
};

window.concluirTreinamento = async function(docId) {
    if(!window.alunoLogado) return;
    const nomeAluno = window.alunoLogado['Nome Completo do Colaborador'];
    if(!confirm(`Você realmente assistiu/leu este material, ${nomeAluno}?\nAo confirmar, os pontos serão computados na sua jornada.`)) return;
    const registro = `${nomeAluno} (Concluído em: ${new Date().toLocaleString('pt-BR')})`;
    try { await window.updateDoc(window.doc(window.db, 'treinamentos', docId), { leituras: window.arrayUnion(registro) }); alert("Concluído com sucesso! +XP "); } catch(e) { alert("Erro ao salvar: " + e.message); }
};

window.abrirModalResposta = function(docId, configJSON) {
    document.getElementById('resposta-docid').value = docId;
    const area = document.getElementById('area-perguntas-dinamicas'); area.innerHTML = '';
    try {
        const jsonStr = String(configJSON).replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        const perguntas = window.safeParseJSON(jsonStr, []);
        perguntas.forEach((q, idx) => {
            let html = `<div class="pergunta-aluno-bloco" style="margin-bottom:15px; background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2e8f0;">`;
            html += `<div style="font-weight:600; font-size:13px; margin-bottom:10px;">${idx+1}. ${q.p}</div>`;
            html += `<input type="hidden" class="resp-tipo" value="${q.tipo}">`;
            html += `<input type="hidden" class="resp-pergunta-txt" value="${q.p}">`;
            if(q.tipo === 'descritiva') {
                html += `<textarea class="form-input resp-valor" style="height:80px; resize:vertical;" placeholder="Sua resposta..."></textarea>`;
            } else {
                q.ops.forEach((op, oIdx) => {
                    if(op.trim() !== '') { html += `<label style="display:flex; align-items:center; gap:8px; font-size:13px; margin-bottom:5px; cursor:pointer;"><input type="radio" name="q_${idx}" class="resp-radio" value="${op}"> ${op}</label>`; }
                });
            }
            html += `</div>`; area.innerHTML += html;
        });
    } catch(e) { area.innerHTML = '<p>Erro ao carregar perguntas do sistema.</p>'; }
    document.getElementById('modal-resposta-aluno').style.display = 'flex';
};

window.enviarRespostaTreinamento = async function() {
    if(!window.alunoLogado) return;
    const docId = document.getElementById('resposta-docid').value;
    const nomeAluno = window.alunoLogado['Nome Completo do Colaborador'];
    const blocos = document.querySelectorAll('.pergunta-aluno-bloco');
    let respostasFinais = [];
    blocos.forEach(bloco => {
        const tipo = bloco.querySelector('.resp-tipo').value;
        const p = bloco.querySelector('.resp-pergunta-txt').value;
        let r = '';
        if(tipo === 'descritiva') { r = bloco.querySelector('.resp-valor').value.trim(); } 
        else { const checked = bloco.querySelector('.resp-radio:checked'); r = checked ? checked.value : 'Nenhuma opção selecionada'; }
        respostasFinais.push({ pergunta: p, resposta: r });
    });
    const respostaObj = { nome: nomeAluno, data: new Date().toLocaleString('pt-BR'), respostas: respostasFinais, nota: "", feedback: "" };
    try {
        await window.updateDoc(window.doc(window.db, 'treinamentos', docId), { respostas_alunos: window.arrayUnion(JSON.stringify(respostaObj)) });
        alert("Sua resposta foi enviada para correção do supervisor! ");
        document.getElementById('modal-resposta-aluno').style.display = 'none';
        window.renderizarTrilhaAluno(); 
    } catch(e) { alert("Erro ao enviar resposta: " + e.message); }
};

window.verFeedback = function(nota, feedback) {
    document.getElementById('feedback-nota').textContent = nota; document.getElementById('feedback-texto').textContent = feedback;
    document.getElementById('modal-feedback-aluno').style.display = 'flex';
};

window.abrirCorrecaoAdmin = function(docId, nomeAluno) {
    const data = window.todosTreinamentosData.find(i=>i.id===docId)?.data;
    if(!data) return;
    const respostas = data.respostas_alunos || [];
    let respObj = null; let respStr = null;
    respostas.forEach(r => { try { let o = window.safeParseJSON(r, null); if(o && o.nome === nomeAluno) { respObj = o; respStr = r; } } catch(e){} });
    if(!respObj) return;
    
    let html = `<b>Aluno:</b> ${nomeAluno} <br><b>Enviado em:</b> ${respObj.data}<br><br>`;
    (respObj.respostas || []).forEach((r, i) => { html += `<div style="margin-bottom:10px; border-bottom:1px solid #e2e8f0; padding-bottom:5px;"><b>Q${i+1}:</b> ${r.pergunta}<br><span style="color:#3182ce;">R: ${r.resposta}</span></div>`; });
    
    document.getElementById('correcao-respostas-aluno').innerHTML = html;
    document.getElementById('correcao-nota').value = respObj.nota || '';
    document.getElementById('correcao-feedback').value = respObj.feedback || '';
    document.getElementById('correcao-docid').value = docId;
    document.getElementById('correcao-nomealuno').value = nomeAluno;
    
    document.getElementById('modal-correcao-admin').style.display = 'flex';
    document.getElementById('modal-leituras').style.display = 'none';
};

window.salvarCorrecaoAdmin = async function() {
    const docId = document.getElementById('correcao-docid').value;
    const nomeAluno = document.getElementById('correcao-nomealuno').value;
    const nota = document.getElementById('correcao-nota').value;
    const fb = document.getElementById('correcao-feedback').value;
    
    const data = window.todosTreinamentosData.find(i=>i.id===docId)?.data;
    const respostas = data.respostas_alunos || [];
    let respObjAntigo = null; let respStrAntiga = null;
    respostas.forEach(r => { try { let o = window.safeParseJSON(r, null); if(o && o.nome === nomeAluno) { respObjAntigo = o; respStrAntiga = r; } } catch(e){} });
    if(!respObjAntigo) return;
    
    let respNovaObj = { ...respObjAntigo, nota: nota, feedback: fb };
    let respStrNova = JSON.stringify(respNovaObj);
    try {
        const ref = window.doc(window.db, 'treinamentos', docId);
        await window.updateDoc(ref, { respostas_alunos: window.arrayRemove(respStrAntiga) });
        await window.updateDoc(ref, { respostas_alunos: window.arrayUnion(respStrNova) });
        alert("Correção salva com sucesso!");
        document.getElementById('modal-correcao-admin').style.display = 'none';
        document.getElementById('modal-leituras').style.display = 'flex'; // Volta pra lista
    } catch(e) { alert("Erro ao salvar: "+e.message); }
};

window.entrarPortalAluno = function() {
    const nomeDigitado = document.getElementById('login-aluno-nome').value.trim().toLowerCase();
    const pinDigitado = document.getElementById('login-aluno-pin').value.trim();
    if(!nomeDigitado || !pinDigitado) return alert("Preencha Nome e PIN!");
    const dadosColaboradores = window.todosOsDadosDoSistema['colaboradores'] || [];
    const colaboradorEncontrado = dadosColaboradores.find(item => { return String(item.data['Nome Completo do Colaborador'] || "").toLowerCase() === nomeDigitado && String(item.data['PIN de Acesso (Treinamentos)'] || "") === pinDigitado; });
    if(colaboradorEncontrado) {
        window.alunoLogado = colaboradorEncontrado.data;
        document.getElementById('ensino-login-area').style.display = 'none'; document.getElementById('ensino-dashboard-area').style.display = 'block';
        document.getElementById('nome-aluno-logado').textContent = window.alunoLogado['Nome Completo do Colaborador'];
        window.renderizarTrilhaAluno(); 
    } else { alert("Nome ou PIN incorretos. Verifique com a Gestão."); }
};

window.escutarRH = function() {
    if(!isAdmin) return;
    window.onSnapshot(window.collection(window.db, 'rh-pesquisas'), (snap) => {
        window.todosPesquisasRH = []; snap.forEach(d => window.todosPesquisasRH.push({id: d.id, data: d.data()}));
        if(abaAtual === 'rh') window.renderizarDashboardRH();
        if(window.alunoLogado) window.renderizarPesquisasAluno();
    });
    window.onSnapshot(window.collection(window.db, 'rh-respostas-pesquisa'), (snap) => {
        window.todosRespostasRH = []; snap.forEach(d => window.todosRespostasRH.push({id: d.id, data: d.data()}));
        if(abaAtual === 'rh') window.renderizarDashboardRH();
        if(window.alunoLogado) window.renderizarPesquisasAluno();
    });
    window.onSnapshot(window.collection(window.db, 'rh-perfil-avaliacoes'), (snap) => {
        window.todosPerfilAvaliacoes = []; snap.forEach(d => window.todosPerfilAvaliacoes.push({id: d.id, data: d.data()}));
        if(abaAtual === 'rh') window.renderizarDashboardRH();
        if(window.alunoLogado) window.renderizarPesquisasAluno();
    });
    window.onSnapshot(window.collection(window.db, 'rh-perfil-respostas'), (snap) => {
        window.todosRespostasPerfil = []; snap.forEach(d => window.todosRespostasPerfil.push({id: d.id, data: d.data()}));
        if(abaAtual === 'rh') window.renderizarDashboardRH();
    });
};

window.atualizarOpcoesFiltrosRH = function() {
    const setorSel = document.getElementById('rh-filter-setor');
    const colSel = document.getElementById('rh-filter-colaborador');
    if(setorSel) {
        const atual = window.rhFiltroAtual.setor || '';
        const setores = window.getSetoresRHDisponiveis();
        setorSel.innerHTML = `<option value="">Visão Geral</option>` + setores.map(setor => `<option value="${setor}">${setor}</option>`).join('');
        setorSel.value = atual;
    }
    if(colSel) {
        const colaboradores = window.getColaboradoresFiltradosPorSetor(window.rhFiltroAtual.setor || '');
        const atual = window.rhFiltroAtual.colaborador || '';
        colSel.innerHTML = `<option value="">Todos os colaboradores</option>` + colaboradores.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
        if(atual && !colaboradores.some(c => c.nome === atual)) window.rhFiltroAtual.colaborador = '';
        colSel.value = window.rhFiltroAtual.colaborador || '';
    }
};

window.aplicarFiltrosRH = function() {
    const setorSel = document.getElementById('rh-filter-setor');
    const colSel = document.getElementById('rh-filter-colaborador');
    window.rhFiltroAtual.setor = setorSel ? setorSel.value : '';
    window.rhFiltroAtual.colaborador = colSel ? colSel.value : '';
    window.atualizarOpcoesFiltrosRH();
    window.renderizarDashboardRH();
};

window.limparFiltrosRH = function() {
    window.rhFiltroAtual = { setor: '', colaborador: '' };
    window.atualizarOpcoesFiltrosRH();
    window.renderizarDashboardRH();
};

window.selecionarColaboradorRH = function(nome) {
    window.rhFiltroAtual.colaborador = nome || '';
    const colSel = document.getElementById('rh-filter-colaborador');
    if(colSel) colSel.value = window.rhFiltroAtual.colaborador;
    window.renderizarDashboardRH();
};

window.calcularEstatisticasRH = function() {
    const filtroSetor = window.rhFiltroAtual.setor || '';
    const filtroColaborador = window.rhFiltroAtual.colaborador || '';
    const colaboradoresBase = listaColaboradoresGlobal.filter(c => (!filtroSetor || c.setor === filtroSetor) && (!filtroColaborador || c.nome === filtroColaborador));
    const colabStats = {};
    colaboradoresBase.forEach(c => { colabStats[c.nome] = { xp: 0, treinamentos: 0, setor: c.setor, mediaNota: 0, respostas: 0 }; });

    window.todosTreinamentosData.forEach(t => {
        const data = t.data || {};
        const avaliativo = window.isTreinamentoAvaliativo(data);
        const pontosBase = parseInt(data['Pontos Valendo']) || 0;
        if(avaliativo) {
            (data.respostas_alunos || []).forEach(raw => {
                const resp = window.safeParseJSON(raw);
                if(!resp || !colabStats[resp.nome]) return;
                const nota = Number(resp.nota);
                if(String(resp.nota).trim() === '' || !Number.isFinite(nota)) return;
                colabStats[resp.nome].xp += nota;
                colabStats[resp.nome].treinamentos += 1;
                colabStats[resp.nome].respostas += 1;
            });
        } else {
            (data.leituras || []).forEach(raw => {
                const nome = window.extrairNomeRegistro(raw);
                if(!colabStats[nome]) return;
                colabStats[nome].xp += pontosBase;
                colabStats[nome].treinamentos += 1;
            });
        }
    });

    const nomes = Object.keys(colabStats);
    const totalXP = nomes.reduce((acc, nome) => acc + (colabStats[nome].xp || 0), 0);
    const mediaGeral = nomes.length ? Math.round(totalXP / nomes.length) : 0;
    let altaPerformance = 0;
    nomes.forEach(nome => {
        const stat = colabStats[nome];
        stat.mediaNota = stat.respostas ? Number((stat.xp / stat.respostas).toFixed(1)) : 0;
        if(stat.xp > 0 && stat.xp >= mediaGeral) altaPerformance += 1;
    });
    return { totalColaboradores: nomes.length, mediaGeral, altaPerformance, colabStats };
};

window.renderizarDashboardRH = function() {
    window.atualizarOpcoesFiltrosRH();
    const resumo = window.calcularEstatisticasRH();
    const search = (document.getElementById('rh-search-colab')?.value || '').toLowerCase();

    const elTot = document.getElementById('rh-tot-colab');
    const elAvg = document.getElementById('rh-avg-xp');
    const elHigh = document.getElementById('rh-tot-high');
    if(elTot) elTot.textContent = resumo.totalColaboradores;
    if(elAvg) elAvg.textContent = resumo.mediaGeral;
    if(elHigh) elHigh.textContent = resumo.altaPerformance;

    const scope = document.getElementById('rh-scope-label');
    if(scope) {
        if(window.rhFiltroAtual.colaborador) scope.textContent = `Visão individual: ${window.rhFiltroAtual.colaborador}`;
        else if(window.rhFiltroAtual.setor) scope.textContent = `Visão por setor: ${window.rhFiltroAtual.setor}`;
        else scope.textContent = 'Visão geral da empresa';
    }

    const grid = document.getElementById('rh-grid-colaboradores');
    if(grid) {
        const nomes = Object.keys(resumo.colabStats).filter(nome => !search || nome.toLowerCase().includes(search)).sort((a,b) => a.localeCompare(b));
        grid.innerHTML = nomes.length ? nomes.map(nome => {
            const stat = resumo.colabStats[nome];
            let statusClass = 'neutro';
            let statusText = 'Em Desenvolvimento';
            if(stat.xp > 0 && stat.xp >= resumo.mediaGeral) { statusClass = 'destaque'; statusText = 'Alta Performance'; }
            else if(stat.xp === 0) { statusClass = 'risco'; statusText = 'Em Atenção'; }
            const ativo = window.rhFiltroAtual.colaborador === nome ? ' box-shadow:0 0 0 3px rgba(139,37,44,.15); transform:translateY(-2px);' : '';
            const nomeEscapado = String(nome).replace(/'/g, "\'");
            return `<div class="rh-collab-card ${statusClass}" onclick="window.selecionarColaboradorRH('${nomeEscapado}')" style="cursor:pointer;${ativo}">
                <div class="rh-collab-header">
                    <div class="rh-avatar">${nome.substring(0,2).toUpperCase()}</div>
                    <div class="rh-collab-meta"><h4>${window.escapeHTML(nome)}</h4><p>${window.escapeHTML(stat.setor || 'Geral')}</p></div>
                    <div class="rh-score-badge">${stat.xp} XP</div>
                </div>
                <div class="rh-collab-grid">
                    <div><span>Treinamentos Concluídos</span><strong>${stat.treinamentos}</strong></div>
                    <div><span>Status RH</span><span class="rh-chip ${statusClass}" style="margin:0; padding:4px 8px;">${statusText}</span></div>
                    <div><span>Média Individual</span><strong>${stat.mediaNota || 0}</strong></div>
                    <div><span>Setor</span><strong>${window.escapeHTML(stat.setor || 'Geral')}</strong></div>
                </div>
            </div>`;
        }).join('') : '<p style="padding:20px; color:var(--text-muted);">Nenhum colaborador encontrado para o filtro selecionado.</p>';
    }

    const gridP = document.getElementById('rh-grid-pesquisas');
    if(gridP) {
        gridP.innerHTML = '';
        window.todosPesquisasRH.slice().sort((a,b) => String(b.data.dataCriacao || '').localeCompare(String(a.data.dataCriacao || ''))).forEach(p => {
            const resps = window.todosRespostasRH.filter(r => r.data.pesquisaId === p.id).length;
            gridP.innerHTML += `<div class="rh-survey-card">
                <div>
                    <h4 style="margin:0; color:var(--text-main); font-weight:600;">${window.escapeHTML(p.data.titulo || 'Pesquisa')}</h4>
                    <p style="margin:0; color:var(--text-muted); font-size:12px;">Categoria: ${window.escapeHTML(p.data.categoria || 'Clima')} | Público: ${window.escapeHTML(p.data.alvoValor || p.data.alvo || 'Geral')}</p>
                </div>
                <div class="rh-survey-stats"><b>${resps}</b> Respostas</div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <button onclick="window.verResultadosPesquisaRH('${p.id}')" class="btn-hover color-8" style="height:30px; font-size:11px; padding:0 15px;">Resultados</button>
                    <button onclick="window.abrirModalCriarPesquisa('${p.id}')" class="btn-action btn-edit" title="Editar pesquisa"><i class="ri-pencil-line"></i></button>
                    <button onclick="window.excluirPesquisaRH('${p.id}')" class="btn-action btn-delete" title="Excluir pesquisa"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>`;
        });
        if(window.todosPesquisasRH.length === 0) gridP.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Nenhuma pesquisa ativa.</p>';
    }

    const gridPerfis = document.getElementById('rh-grid-perfis');
    if(gridPerfis) {
        gridPerfis.innerHTML = '';
        window.todosPerfilAvaliacoes.slice().sort((a,b) => String(b.data.dataCriacao || '').localeCompare(String(a.data.dataCriacao || ''))).forEach(item => {
            const resps = window.todosRespostasPerfil.filter(r => r.data.avaliacaoId === item.id).length;
            gridPerfis.innerHTML += `<div class="rh-survey-card">
                <div>
                    <h4 style="margin:0; color:var(--text-main); font-weight:600;">${window.escapeHTML(item.data.titulo || 'Avaliação de perfil')}</h4>
                    <p style="margin:0; color:var(--text-muted); font-size:12px;">Alvo: ${window.escapeHTML(item.data.alvoTipo || 'Geral')}${item.data.alvoValor ? ' | ' + window.escapeHTML(item.data.alvoValor) : ''}</p>
                </div>
                <div class="rh-survey-stats"><b>${resps}</b> Respostas</div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <button onclick="window.abrirModalPerfilProfissional()" class="btn-hover color-8" style="height:30px; font-size:11px; padding:0 15px;">Radar</button>
                    <button onclick="window.abrirModalCriarPerfil('${item.id}')" class="btn-action btn-edit" title="Editar avaliação"><i class="ri-pencil-line"></i></button>
                    <button onclick="window.excluirAvaliacaoPerfil('${item.id}')" class="btn-action btn-delete" title="Excluir avaliação"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>`;
        });
        if(window.todosPerfilAvaliacoes.length === 0) gridPerfis.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Nenhuma avaliação de perfil ativa.</p>';
    }
};

window.abrirModalCriarPesquisa = function(pesquisaId = '') {
    const editId = document.getElementById('rh-pesq-edit-id');
    if(editId) editId.value = pesquisaId || '';
    document.getElementById('rh-pesq-titulo').value = '';
    document.getElementById('rh-pesq-perguntas-list').innerHTML = '';
    const alvoTipo = document.getElementById('rh-pesq-alvo-tipo');
    const alvoValor = document.getElementById('rh-pesq-alvo');
    if(alvoTipo) alvoTipo.value = 'Geral';
    if(alvoValor) alvoValor.innerHTML = '<option value="">Todos (Geral)</option>';
    window.atualizarAlvoPesquisaRHFormulario();

    if(pesquisaId) {
        const pesquisa = window.todosPesquisasRH.find(item => item.id === pesquisaId);
        if(pesquisa) {
            document.getElementById('rh-pesq-titulo').value = pesquisa.data.titulo || '';
            document.getElementById('rh-pesq-categoria').value = pesquisa.data.categoria || 'Clima';
            if(alvoTipo) alvoTipo.value = pesquisa.data.alvoTipo || (String(pesquisa.data.alvo || '').startsWith('Setor: ') ? 'Setor' : 'Geral');
            window.atualizarAlvoPesquisaRHFormulario();
            if(alvoValor) alvoValor.value = pesquisa.data.alvoValor || String(pesquisa.data.alvo || '').replace('Setor: ', '').trim();
            (pesquisa.data.perguntas || []).forEach(pergunta => window.adicionarPerguntaRH(pergunta.tipo || 'escala', pergunta));
        }
    }

    const tituloModal = document.getElementById('rh-modal-pesquisa-titulo');
    if(tituloModal) tituloModal.innerHTML = pesquisaId ? '<i class="ri-pencil-line"></i> Editar Pesquisa (RH)' : '<i class="ri-survey-line"></i> Criar Nova Pesquisa (RH)';
    document.getElementById('modal-criar-pesquisa').style.display = 'flex';
};

window.atualizarAlvoPesquisaRHFormulario = function() {
    const alvoTipo = document.getElementById('rh-pesq-alvo-tipo');
    const alvoValor = document.getElementById('rh-pesq-alvo');
    if(!alvoTipo || !alvoValor) return;
    if(alvoTipo.value === 'Setor') {
        alvoValor.innerHTML = `<option value="">Selecione o setor</option>` + window.getSetoresRHDisponiveis().map(setor => `<option value="${setor}">${setor}</option>`).join('');
        alvoValor.disabled = false;
    } else if(alvoTipo.value === 'Colaborador') {
        alvoValor.innerHTML = `<option value="">Selecione o colaborador</option>` + listaColaboradoresGlobal.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
        alvoValor.disabled = false;
    } else {
        alvoValor.innerHTML = `<option value="">Todos (Geral)</option>`;
        alvoValor.disabled = true;
        alvoValor.value = '';
    }
};

window.adicionarPerguntaRH = function(tipo, perguntaAntiga = null) {
    const area = document.getElementById('rh-pesq-perguntas-list');
    const div = document.createElement('div');
    div.className = 'rh-pergunta-item';
    div.style = 'background:#f8fafc; padding:15px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:10px; position:relative;';
    div.innerHTML = `
        <button onclick="this.parentElement.remove()" style="position:absolute; top:10px; right:10px; color:red; background:none; border:none; cursor:pointer;"><i class="ri-delete-bin-line"></i></button>
        <input type="hidden" class="rh-p-tipo" value="${tipo}">
        <label style="font-size:12px; font-weight:600;">Pergunta (${tipo === 'escala' ? 'Escala 1 a 5' : 'Texto Aberto'}):</label>
        <input type="text" class="form-input rh-p-texto" style="margin-bottom:0;" placeholder="Digite a pergunta..." value="${window.escapeHTML(perguntaAntiga?.texto || '')}">
    `;
    area.appendChild(div);
};

window.salvarPesquisaRH = async function() {
    const editId = document.getElementById('rh-pesq-edit-id')?.value || '';
    const titulo = document.getElementById('rh-pesq-titulo').value.trim();
    const categoria = document.getElementById('rh-pesq-categoria').value;
    const alvoTipo = document.getElementById('rh-pesq-alvo-tipo').value;
    const alvoValor = document.getElementById('rh-pesq-alvo').value;
    const blocos = document.querySelectorAll('.rh-pergunta-item');
    if(!titulo || blocos.length === 0) return alert('Preencha o título e adicione pelo menos uma pergunta!');
    if(alvoTipo !== 'Geral' && !alvoValor) return alert('Selecione o alvo da pesquisa.');

    const perguntas = Array.from(blocos).map(b => ({ tipo: b.querySelector('.rh-p-tipo').value, texto: b.querySelector('.rh-p-texto').value.trim() })).filter(item => item.texto);
    if(!perguntas.length) return alert('Adicione pelo menos uma pergunta válida.');

    const payload = {
        titulo, categoria, perguntas,
        alvoTipo,
        alvoValor: alvoTipo === 'Geral' ? '' : alvoValor,
        alvo: alvoTipo === 'Setor' ? `Setor: ${alvoValor}` : (alvoTipo === 'Colaborador' ? alvoValor : 'Geral'),
        dataCriacao: new Date().toISOString()
    };

    try {
        if(editId) {
            await window.updateDoc(window.doc(window.db, 'rh-pesquisas', editId), payload);
            alert('Pesquisa atualizada com sucesso!');
        } else {
            await window.addDoc(window.collection(window.db, 'rh-pesquisas'), payload);
            alert('Pesquisa enviada com sucesso!');
        }
        document.getElementById('modal-criar-pesquisa').style.display = 'none';
    } catch(e) { alert('Erro ao salvar pesquisa: ' + e.message); }
};

window.excluirPesquisaRH = async function(id) {
    if(!confirm("Excluir esta pesquisa e todas as respostas?")) return;
    try { await window.deleteDoc(window.doc(window.db, 'rh-pesquisas', id)); alert("Excluída!"); } catch(e) {}
};

window.renderizarPesquisasAluno = function() {
    if(!window.alunoLogado) return;
    const area = document.getElementById('aluno-pesquisas-pendentes');
    const lista = document.getElementById('lista-pesquisas-aluno');
    const areaPerfil = document.getElementById('aluno-perfil-pendentes');
    const listaPerfil = document.getElementById('lista-perfis-aluno');
    if(!area || !lista) return;

    const nomeAluno = window.alunoLogado['Nome Completo do Colaborador'];
    const setorAluno = window.alunoLogado['Setor da Clínica'] || 'Geral';

    const minhasPesquisas = window.todosPesquisasRH.filter(p => window.obterPublicoPesquisaRH(p.data, nomeAluno, setorAluno));
    const pendentes = minhasPesquisas.filter(p => !window.todosRespostasRH.some(r => r.data.pesquisaId === p.id && r.data.nome === nomeAluno));

    if(pendentes.length > 0) {
        lista.innerHTML = pendentes.map(p => `
            <div style="background: #fff5f5; border-left: 4px solid #e53e3e; padding: 15px; border-radius: 8px; display:flex; justify-content:space-between; align-items:center; box-shadow: var(--shadow-soft); gap:12px; flex-wrap:wrap;">
                <div>
                    <strong style="color: var(--primary-color); display:block; font-size:15px;">${window.escapeHTML(p.data.titulo || 'Pesquisa RH')}</strong>
                    <span style="font-size:12px; color:var(--text-muted);"><i class="ri-survey-fill"></i> ${window.escapeHTML(p.data.categoria || 'Clima')}</span>
                </div>
                <button onclick="window.responderPesquisaRH('${p.id}')" class="btn-hover color-11" style="height:35px; font-size:12px; padding:0 15px;">Responder Agora</button>
            </div>
        `).join('');
        area.style.display = 'block';
    } else {
        area.style.display = 'none';
    }

    if(areaPerfil && listaPerfil) {
        const perfisPendentes = window.obterAvaliacoesPerfilDisponiveis(nomeAluno, setorAluno).filter(item => !window.todosRespostasPerfil.some(resp => resp.data.avaliacaoId === item.id && resp.data.nome === nomeAluno));
        if(perfisPendentes.length) {
            listaPerfil.innerHTML = perfisPendentes.map(item => `
                <div style="background: #eff6ff; border-left: 4px solid #3182ce; padding: 15px; border-radius: 8px; display:flex; justify-content:space-between; align-items:center; box-shadow: var(--shadow-soft); gap:12px; flex-wrap:wrap;">
                    <div>
                        <strong style="color: #1e3a5f; display:block; font-size:15px;">${window.escapeHTML(item.data.titulo || 'Avaliação de Perfil')}</strong>
                        <span style="font-size:12px; color:var(--text-muted);"><i class="ri-radar-line"></i> Perfil Profissional</span>
                    </div>
                    <button onclick="window.responderPerfilRH('${item.id}')" class="btn-hover color-9" style="height:35px; font-size:12px; padding:0 15px;">Responder Agora</button>
                </div>
            `).join('');
            areaPerfil.style.display = 'block';
        } else {
            areaPerfil.style.display = 'none';
        }
    }
};

window.responderPesquisaRH = function(pesquisaId) {
    const p = (window.todosPesquisasRH || []).find(x => x.id === pesquisaId);
    if (!p || !p.data) { return; }

    const tituloEl = document.getElementById('rh-resp-titulo');
    const idEl = document.getElementById('rh-resp-id');
    const areaEl = document.getElementById('rh-resp-area');
    const modalEl = document.getElementById('modal-responder-pesquisa');

    if (!tituloEl || !idEl || !areaEl || !modalEl) { return; }

    tituloEl.textContent = p.data.titulo || 'Responder Pesquisa';
    idEl.value = pesquisaId;

    const perguntas = Array.isArray(p.data.perguntas) ? p.data.perguntas : [];
    let html = '';

    perguntas.forEach((q, idx) => {
        const textoSeguro = window.escapeHTML(String(q?.texto || 'Pergunta'));
        const tipoSeguro = String(q?.tipo || 'texto');

        html += `
            <div class="rh-resp-bloco" style="margin-bottom:15px; background:#f8fafc; padding:15px; border-radius:8px; border:1px solid var(--border-color);">
                <input type="hidden" class="resp-q-texto" value="${textoSeguro}">
                <input type="hidden" class="resp-q-tipo" value="${tipoSeguro}">
                <label style="font-weight:600; font-size:13px; display:block; margin-bottom:10px; color:var(--text-main);">
                    ${idx + 1}. ${textoSeguro}
                </label>
        `;

        if (tipoSeguro === 'escala') {
            html += `<div style="display:flex; gap:10px; justify-content:space-between; flex-wrap:wrap;">`;
            [1,2,3,4,5].forEach(n => {
                html += `
                    <label style="flex:1; min-width:56px; text-align:center; background:white; border:1px solid #cbd5e1; padding:10px; border-radius:8px; cursor:pointer;">
                        <input type="radio" name="p_${pesquisaId}_q_${idx}" value="${n}" class="resp-q-val" style="margin-bottom:5px;">
                        <div style="font-weight:bold; color:var(--primary-color);">${n}</div>
                    </label>
                `;
            });
            html += `</div>`;
        } else {
            html += `<textarea class="form-input resp-q-val" style="height:90px; resize:vertical; margin:0;" placeholder="Sua resposta franca e sincera."></textarea>`;
        }

        html += `</div>`;
    });

    areaEl.innerHTML = html;
    modalEl.style.display = 'flex';
};

window.enviarRespostaRH = async function() {
    try {
        if (!window.alunoLogado) { return; }

        const pesquisaId = document.getElementById('rh-resp-id')?.value?.trim();
        if (!pesquisaId) { return; }

        const nomeAluno = window.alunoLogado['Nome Completo do Colaborador'] || window.alunoLogado.nome || window.alunoLogado.Nome || 'Colaborador';

        const blocos = Array.from(document.querySelectorAll('#rh-resp-area .rh-resp-bloco'));
        if (!blocos.length) { return; }

        const respostas = [];
        let ok = true;

        blocos.forEach((b, idx) => {
            const textoEl = b.querySelector('.resp-q-texto');
            const tipoEl = b.querySelector('.resp-q-tipo');

            const textoP = textoEl ? textoEl.value : `Pergunta ${idx + 1}`;
            const tipo = tipoEl ? tipoEl.value : 'texto';

            let val = '';

            if (tipo === 'escala') {
                const checked = b.querySelector('input[type="radio"]:checked');
                if (!checked) { ok = false; return; }
                val = checked.value;
            } else {
                const textarea = b.querySelector('textarea');
                if (!textarea) { ok = false; return; }
                val = textarea.value.trim();
                if (!val) { ok = false; return; }
            }

            respostas.push({ pergunta: textoP, resposta: val, tipo });
        });

        if (!ok || respostas.length !== blocos.length) {
            alert('Por favor, responda todas as perguntas antes de enviar!');
            return;
        }

        const antiga = (window.todosRespostasRH || []).find(item => item?.data?.pesquisaId === pesquisaId && item?.data?.nome === nomeAluno);

        const payload = { pesquisaId, nome: nomeAluno, respostas, data: new Date().toISOString() };

        if (antiga?.id) { await window.updateDoc(window.doc(window.db, 'rh-respostas-pesquisa', antiga.id), payload); } 
        else { await window.addDoc(window.collection(window.db, 'rh-respostas-pesquisa'), payload); }

        alert('Muito obrigado pelas suas respostas! Isso nos ajuda a crescer juntos.');
        const modal = document.getElementById('modal-responder-pesquisa');
        if (modal) modal.style.display = 'none';

        if (typeof window.renderizarPesquisasAluno === 'function') { window.renderizarPesquisasAluno(); }
    } catch (e) { alert('Erro ao enviar: ' + (e?.message || 'falha desconhecida')); }
};

window.verResultadosPesquisaRH = function(pesquisaId) {
    const p = window.todosPesquisasRH.find(x => x.id === pesquisaId);
    const resps = window.todosRespostasRH.filter(r => r.data.pesquisaId === pesquisaId);
    if(!p) return;

    let html = `<h4 style="margin-bottom:15px; color:var(--primary-color); font-size:18px;">${p.data.titulo}</h4>`;
    html += `<p style="font-size:13px; color:var(--text-muted); margin-bottom:20px; background:#f8fafc; padding:10px; border-radius:8px;">Total de respostas coletadas: <b>${resps.length}</b></p>`;

    p.data.perguntas.forEach(q => {
        html += `<div style="margin-bottom:20px; background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0;">
                    <strong style="display:block; margin-bottom:10px; font-size:14px; color:var(--text-main);">${q.texto}</strong>`;
        
        if(q.tipo === 'escala') {
            let soma = 0; let qtd = 0;
            resps.forEach(r => {
                const ans = r.data.respostas.find(x => x.pergunta === q.texto);
                if(ans && ans.resposta) { soma += parseInt(ans.resposta); qtd++; }
            });
            const media = qtd > 0 ? (soma / qtd).toFixed(1) : 0;
            html += `<div style="font-size:28px; font-weight:700; color:#38a169;"><i class="ri-star-fill" style="color:#ecc94b;"></i> ${media} <span style="font-size:14px; font-weight:500; color:var(--text-muted);">/ 5</span></div>`;
        } else {
            html += `<div style="max-height:200px; overflow-y:auto; font-size:13px; background:white; border-radius:8px; padding:10px; border:1px solid #e2e8f0;">`;
            if(resps.length === 0) html += `<span style="color:var(--text-muted);">Nenhuma resposta ainda.</span>`;
            resps.forEach(r => {
                const ans = r.data.respostas.find(x => x.pergunta === q.texto);
                if(ans && ans.resposta) { html += `<div style="margin-bottom:10px; border-bottom:1px dashed #cbd5e1; padding-bottom:8px;"><b>${r.data.nome}:</b> <span style="color:var(--text-muted);">${ans.resposta}</span></div>`; }
            });
            html += `</div>`;
        }
        html += `</div>`;
    });

    document.getElementById('rh-resultados-area').innerHTML = html;
    document.getElementById('modal-ver-respostas-rh').style.display = 'flex';
};

window.abrirModalCriarPerfil = function(avaliacaoId = '') {
    const editId = document.getElementById('rh-perfil-edit-id');
    if(editId) editId.value = avaliacaoId || '';
    const titulo = document.getElementById('rh-perfil-titulo');
    const tipoSel = document.getElementById('rh-perfil-alvo-tipo');
    const valorSel = document.getElementById('rh-perfil-alvo-valor');
    const perguntasArea = document.getElementById('rh-perfil-perguntas-list');
    if(titulo) titulo.value = '';
    if(tipoSel) tipoSel.value = 'Geral';
    if(perguntasArea) perguntasArea.innerHTML = '';
    window.atualizarAlvoPerfilFormulario();

    if(avaliacaoId) {
        const avaliacao = window.todosPerfilAvaliacoes.find(item => item.id === avaliacaoId);
        if(avaliacao) {
            if(titulo) titulo.value = avaliacao.data.titulo || '';
            if(tipoSel) tipoSel.value = avaliacao.data.alvoTipo || 'Geral';
            window.atualizarAlvoPerfilFormulario();
            if(valorSel) valorSel.value = avaliacao.data.alvoValor || '';
            (avaliacao.data.perguntas || []).forEach(pergunta => window.adicionarPerguntaPerfil(pergunta));
        }
    }

    const titleEl = document.getElementById('rh-modal-perfil-titulo');
    if(titleEl) titleEl.innerHTML = avaliacaoId ? '<i class="ri-pencil-line"></i> Editar Avaliação de Perfil' : '<i class="ri-radar-line"></i> Nova Avaliação de Perfil';
    document.getElementById('modal-criar-perfil').style.display = 'flex';
};

window.atualizarAlvoPerfilFormulario = function() {
    const tipo = document.getElementById('rh-perfil-alvo-tipo');
    const valor = document.getElementById('rh-perfil-alvo-valor');
    if(!tipo || !valor) return;
    if(tipo.value === 'Setor') {
        valor.innerHTML = `<option value="">Selecione o setor</option>` + window.getSetoresRHDisponiveis().map(setor => `<option value="${setor}">${setor}</option>`).join('');
        valor.disabled = false;
    } else if(tipo.value === 'Colaborador') {
        valor.innerHTML = `<option value="">Selecione o colaborador</option>` + listaColaboradoresGlobal.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
        valor.disabled = false;
    } else {
        valor.innerHTML = `<option value="">Todos (Geral)</option>`;
        valor.value = '';
        valor.disabled = true;
    }
};

window.adicionarPerguntaPerfil = function(perguntaAntiga = null) {
    const area = document.getElementById('rh-perfil-perguntas-list');
    if(!area) return;
    const div = document.createElement('div');
    div.className = 'rh-perfil-pergunta-item';
    div.style = 'background:#f8fafc; padding:15px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:10px; position:relative;';
    div.innerHTML = `
        <button onclick="this.parentElement.remove()" style="position:absolute; top:10px; right:10px; color:red; background:none; border:none; cursor:pointer;"><i class="ri-delete-bin-line"></i></button>
        <div class="rh-form-grid">
            <div>
                <label style="font-size:12px; font-weight:600;">Categoria do Radar</label>
                <select class="form-input rh-perfil-categoria">
                    <option value="Qualidades" ${perguntaAntiga?.categoria === 'Qualidades' ? 'selected' : ''}>Qualidades</option>
                    <option value="Pontos Fortes" ${perguntaAntiga?.categoria === 'Pontos Fortes' ? 'selected' : ''}>Pontos Fortes</option>
                    <option value="Pontos Fracos" ${perguntaAntiga?.categoria === 'Pontos Fracos' ? 'selected' : ''}>Pontos Fracos</option>
                    <option value="Skills" ${perguntaAntiga?.categoria === 'Skills' ? 'selected' : ''}>Skills</option>
                </select>
            </div>
            <div>
                <label style="font-size:12px; font-weight:600;">Pergunta</label>
                <input type="text" class="form-input rh-perfil-texto" value="${window.escapeHTML(perguntaAntiga?.texto || '')}" placeholder="Ex: Demonstra iniciativa no dia a dia?">
            </div>
        </div>
    `;
    area.appendChild(div);
};

window.salvarAvaliacaoPerfil = async function() {
    const editId = document.getElementById('rh-perfil-edit-id')?.value || '';
    const titulo = document.getElementById('rh-perfil-titulo').value.trim();
    const alvoTipo = document.getElementById('rh-perfil-alvo-tipo').value;
    const alvoValor = document.getElementById('rh-perfil-alvo-valor').value;
    const perguntas = Array.from(document.querySelectorAll('.rh-perfil-pergunta-item')).map(item => ({
        categoria: item.querySelector('.rh-perfil-categoria').value,
        texto: item.querySelector('.rh-perfil-texto').value.trim(),
        tipo: 'escala'
    })).filter(item => item.texto);

    if(!titulo || !perguntas.length) return alert('Preencha o título e adicione pelo menos uma pergunta.');
    if(alvoTipo !== 'Geral' && !alvoValor) return alert('Selecione o alvo da avaliação.');

    const payload = { titulo, alvoTipo, alvoValor: alvoTipo === 'Geral' ? '' : alvoValor, perguntas, dataCriacao: new Date().toISOString() };
    try {
        if(editId) {
            await window.updateDoc(window.doc(window.db, 'rh-perfil-avaliacoes', editId), payload);
            alert('Avaliação de perfil atualizada com sucesso!');
        } else {
            await window.addDoc(window.collection(window.db, 'rh-perfil-avaliacoes'), payload);
            alert('Avaliação de perfil enviada com sucesso!');
        }
        document.getElementById('modal-criar-perfil').style.display = 'none';
    } catch(e) { alert('Erro ao salvar avaliação: ' + e.message); }
};

window.excluirAvaliacaoPerfil = async function(id) {
    if(!confirm('Excluir esta avaliação de perfil?')) return;
    try { await window.deleteDoc(window.doc(window.db, 'rh-perfil-avaliacoes', id)); alert('Avaliação excluída!'); } catch(e) { alert('Erro ao excluir: ' + e.message); }
};

window.responderPerfilRH = function(avaliacaoId) {
    const avaliacao = window.todosPerfilAvaliacoes.find(item => item.id === avaliacaoId);
    if(!avaliacao) return;
    document.getElementById('rh-perfil-resp-id').value = avaliacaoId;
    document.getElementById('rh-perfil-resp-titulo').textContent = avaliacao.data.titulo || 'Avaliação de Perfil';
    const area = document.getElementById('rh-perfil-resp-area');
    if(!area) return;
    area.innerHTML = (avaliacao.data.perguntas || []).map((pergunta, idx) => `
        <div class="rh-resp-bloco" style="margin-bottom:15px; background:#f8fafc; padding:15px; border-radius:8px; border:1px solid var(--border-color);">
            <label style="font-weight:600; font-size:13px; display:block; margin-bottom:10px; color:var(--text-main);">${idx+1}. ${window.escapeHTML(pergunta.texto)} <span style="display:inline-block; margin-left:8px; padding:4px 8px; border-radius:999px; font-size:11px; background:#eef2ff; color:#4338ca;">${window.escapeHTML(pergunta.categoria)}</span></label>
            <input type="hidden" class="rh-perfil-pergunta-texto" value="${window.escapeHTML(pergunta.texto)}">
            <input type="hidden" class="rh-perfil-pergunta-categoria" value="${window.escapeHTML(pergunta.categoria)}">
            <div class="rh-scale-row">${[1,2,3,4,5].map(n => `<label class="rh-scale-option"><input type="radio" name="perfil_${avaliacaoId}_${idx}" value="${n}"><span>${n}</span></label>`).join('')}</div>
        </div>
    `).join('');
    document.getElementById('modal-responder-perfil').style.display = 'flex';
};

window.enviarRespostaPerfilRH = async function() {
    if(!window.alunoLogado) return;
    const avaliacaoId = document.getElementById('rh-perfil-resp-id').value;
    const nome = window.alunoLogado['Nome Completo do Colaborador'];
    const setor = window.alunoLogado['Setor da Clínica'] || 'Geral';
    const blocos = Array.from(document.querySelectorAll('#rh-perfil-resp-area .rh-resp-bloco'));
    const respostas = [];
    let incompleto = false;
    blocos.forEach(bloco => {
        const texto = bloco.querySelector('.rh-perfil-pergunta-texto').value;
        const categoria = bloco.querySelector('.rh-perfil-pergunta-categoria').value;
        const marcado = bloco.querySelector('input[type="radio"]:checked');
        if(!marcado) incompleto = true;
        respostas.push({ pergunta: texto, categoria, resposta: marcado ? Number(marcado.value) : null });
    });
    if(incompleto) return alert('Responda todas as perguntas para enviar a avaliação.');
    try {
        const antiga = window.todosRespostasPerfil.find(item => item.data.avaliacaoId === avaliacaoId && item.data.nome === nome);
        if(antiga) {
            await window.updateDoc(window.doc(window.db, 'rh-perfil-respostas', antiga.id), { respostas, data: new Date().toISOString(), setor });
        } else {
            await window.addDoc(window.collection(window.db, 'rh-perfil-respostas'), { avaliacaoId, nome, setor, respostas, data: new Date().toISOString() });
        }
        alert('Avaliação de perfil enviada com sucesso!');
        document.getElementById('modal-responder-perfil').style.display = 'none';
        window.renderizarPesquisasAluno();
    } catch(e) { alert('Erro ao enviar avaliação: ' + e.message); }
};

window.abrirModalPerfilProfissional = function() {
    const modal = document.getElementById('modal-perfil-profissional');
    const select = document.getElementById('rh-perfil-select-colaborador');
    if(!modal || !select) return;
    select.innerHTML = `<option value="">Selecione um colaborador</option>` + listaColaboradoresGlobal.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
    if(window.rhFiltroAtual.colaborador) select.value = window.rhFiltroAtual.colaborador;
    modal.style.display = 'flex';
    if(select.value) window.renderizarGraficoPerfilProfissional(select.value);
};

window.obterResumoPerfilColaborador = function(nome) {
    const respostas = window.todosRespostasPerfil.filter(item => item.data.nome === nome);
    const buckets = { 'Qualidades': [], 'Pontos Fortes': [], 'Pontos Fracos': [], 'Skills': [] };
    respostas.forEach(item => {
        (item.data.respostas || []).forEach(resp => {
            if(resp && buckets[resp.categoria] && Number.isFinite(Number(resp.resposta))) buckets[resp.categoria].push(Number(resp.resposta));
        });
    });
    const medias = Object.fromEntries(Object.entries(buckets).map(([categoria, valores]) => [categoria, valores.length ? Number((valores.reduce((a,b) => a+b, 0) / valores.length).toFixed(1)) : 0]));
    return { medias, totalAvaliacoes: respostas.length, totalRespostas: Object.values(buckets).reduce((acc, arr) => acc + arr.length, 0) };
};

window.renderizarGraficoPerfilProfissional = function(nome) {
    const resumo = window.obterResumoPerfilColaborador(nome);
    const canvas = document.getElementById('rh-perfil-radar-chart');
    const info = document.getElementById('rh-perfil-radar-info');
    if(!canvas || !info) return;
    const colaborador = listaColaboradoresGlobal.find(item => item.nome === nome);
    const labels = ['Qualidades', 'Pontos Fortes', 'Pontos Fracos', 'Skills'];
    const data = labels.map(label => resumo.medias[label] || 0);
    if(window.rhPerfilRadarChart) window.rhPerfilRadarChart.destroy();
    window.rhPerfilRadarChart = new Chart(canvas, {
        type: 'radar',
        data: { labels, datasets: [{ label: nome, data, fill: true, backgroundColor: 'rgba(139, 37, 44, 0.18)', borderColor: '#8B252C', pointBackgroundColor: '#8B252C', pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: '#8B252C' }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: true, min: 0, max: 5, ticks: { stepSize: 1, backdropColor: 'transparent' }, pointLabels: { font: { size: 13, weight: '600' } }, grid: { color: 'rgba(148,163,184,.35)' }, angleLines: { color: 'rgba(148,163,184,.25)' } } }, plugins: { legend: { display: false } } }
    });
    const mediaGeral = data.filter(v => v > 0).length ? (data.reduce((a,b)=>a+b,0) / data.filter(v => v > 0).length).toFixed(1) : '0.0';
    info.innerHTML = `
        <div class="rh-profile-summary-card"><span>Colaborador</span><strong>${window.escapeHTML(nome)}</strong><small>${window.escapeHTML(colaborador?.setor || 'Geral')}</small></div>
        <div class="rh-profile-summary-card"><span>Avaliações Respondidas</span><strong>${resumo.totalAvaliacoes}</strong><small>coletas válidas</small></div>
        <div class="rh-profile-summary-card"><span>Média Global do Perfil</span><strong>${mediaGeral}</strong><small>escala 0 a 5</small></div>
        <div class="rh-profile-summary-card"><span>Qualidades / Skills</span><strong>${(resumo.medias['Qualidades'] || 0).toFixed(1)} / ${(resumo.medias['Skills'] || 0).toFixed(1)}</strong><small>forças-chave</small></div>
    `;
};

// ==========================================
// 8. ATRIBUIÇÃO DE EVENTOS DE CLIQUES E INICIALIZAÇÃO
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    
    const mainContent = document.querySelector('.main-content');
    if(mainContent) {
        mainContent.addEventListener('click', async (e) => {
            const btnExcluir = e.target.closest('.btn-delete');
            const btnEditar = e.target.closest('.btn-edit');
            const btnAssinar = e.target.closest('.btn-assinar');

            if (btnAssinar) {
                await window.confirmarAssinaturaLeitura(btnAssinar.dataset.id, btnAssinar.dataset.colecao);
                return;
            }
            if (btnExcluir && isAdmin && confirm("Excluir permanentemente?")) {
                await window.deleteDoc(window.doc(window.db, btnExcluir.dataset.colecao, btnExcluir.dataset.id));
                return;
            }
            if (btnEditar && isAdmin) {
                window.abrirModal(btnEditar.dataset.colecao, btnEditar.dataset.id, window.safeParseJSON(btnEditar.dataset.info, {}));
            }
        });
    }

    const btnSalvar = document.getElementById('btn-salvar-dados');
    if(btnSalvar) {
        btnSalvar.addEventListener('click', async () => {
            if (btnSalvar.getAttribute('data-colecao') === 'treinamentos' && document.getElementById('quiz-questions-list')) {
                window.sincronizarQuizJSON();
            }
            
            const colecao = btnSalvar.getAttribute('data-colecao');
            const docId = document.getElementById('modal-doc-id').value;
            const config = configuracaoAbas[colecao];
            if(!config) return;
            
            const btnOriginal = btnSalvar.innerHTML;
            btnSalvar.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Salvando...';
            
            let dados = { corCard: document.getElementById('card-color') ? document.getElementById('card-color').value : '#ffffff' };
            
            config.campos.forEach(c => {
                const val = document.getElementById('input-'+c);
                if((colecao === 'boletins' || colecao === 'treinamentos') && c === 'Para quais Setores?') {
                    const checks = Array.from(document.querySelectorAll('.check-setor:checked')).map(el => el.value);
                    dados[c] = checks.join(', ');
                } else if(val) { dados[c] = val.value; }
            });
            
            try {
                if(docId) { await window.updateDoc(window.doc(window.db, colecao, docId), dados); } else { await window.addDoc(window.collection(window.db, colecao), dados); }
                window.fecharModal();
            } catch(e) { alert("Erro ao salvar: " + e.message); }
            btnSalvar.innerHTML = btnOriginal;
        });
    }

    const btnSalvarAjustes = document.getElementById('btn-salvar-ajustes');
    if(btnSalvarAjustes) {
        btnSalvarAjustes.addEventListener('click', async () => {
            if(!isAdmin) return;
            const texto = document.getElementById('tab-input-banner').value;
            const locaisTexto = document.getElementById('tab-input-locais').value; 
            const setoresTexto = document.getElementById('tab-input-setores').value; 
            const especialidadesTexto = document.getElementById('tab-input-especialidades').value; 
            const motivosTexto = document.getElementById('tab-input-motivos').value; 
            const corPend = document.getElementById('tab-color-pendente').value; 
            const corConc = document.getElementById('tab-color-concluido').value; 
            
            const imgPastaInput = document.getElementById('tab-input-imagem-pastas'); const imgPastasTexto = imgPastaInput ? imgPastaInput.value : "";
            const chatLogoInput = document.getElementById('tab-input-chat-logo'); const chatLogoTexto = chatLogoInput ? chatLogoInput.value : "";
            const chatCorInput = document.getElementById('tab-color-chat'); const chatCorVal = chatCorInput ? chatCorInput.value : "#0ba360";
            
            btnSalvarAjustes.innerHTML = "Salvando...";
            try {
                await window.setDoc(window.doc(window.db, "configuracoes", "gerais"), { 
                    banner_texto: texto, locais: locaisTexto, setores: setoresTexto, especialidades: especialidadesTexto, motivos: motivosTexto, 
                    cor_pendente: corPend, cor_concluido: corConc, imagem_padrao_pastas: imgPastasTexto, chat_logo: chatLogoTexto, chat_cor: chatCorVal
                }, { merge: true });
                alert("Configurações salvas com sucesso!");
            } catch(e) { alert("Erro ao salvar configurações: " + e.message); }
            btnSalvarAjustes.innerHTML = 'Salvar Alterações';
        });
    }

    const inputPesqGlobal = document.getElementById('input-pesquisa-global');
    if(inputPesqGlobal) {
        inputPesqGlobal.addEventListener('keyup', (e) => {
            const texto = e.target.value.toLowerCase().trim();
            const areaRes = document.getElementById('resultados-globais');
            if(!areaRes) return;
            if(texto.length < 2) { areaRes.style.display = 'none'; areaRes.innerHTML = ''; return; }

            const colecoesBusca = ['convenios', 'ultrassom', 'consultas', 'exames-imagem', 'institutos', 'corpo-clinico', 'pacotes', 'remocoes', 'colaboradores', 'ramais', 'emails', 'contatos-gerais', 'contatos-convenios', 'boletins', 'boletins-privados', 'treinamentos'];
            const vistos = new Set();
            let htmlResultados = '';
            let encontrou = false;

            colecoesBusca.forEach(colecao => {
                const itens = window.todosOsDadosDoSistema[colecao] || window.dadosGlobaisAbas[colecao] || [];
                itens.forEach(item => {
                    const textoItem = Object.values(item.data || {}).join(' ').toLowerCase();
                    const chave = `${colecao}:${item.id}`;
                    if(textoItem.includes(texto) && !vistos.has(chave)) {
                        vistos.add(chave);
                        htmlResultados += window.gerarHTMLCard(colecao, item.id, item.data);
                        encontrou = true;
                    }
                });
            });

            areaRes.style.display = 'grid';
            areaRes.innerHTML = '<h3 style="grid-column: 1/-1; margin-bottom: 10px; border-bottom: 2px solid var(--border-color); padding-bottom: 5px; color: var(--primary-color);">Resultados da Busca Global:</h3>' + (encontrou ? htmlResultados : '<p style="color:var(--text-muted); font-size:14px; grid-column: 1/-1;">Nenhum resultado encontrado no sistema.</p>');
        });
    }

    const inputPesqAba = document.getElementById('input-pesquisa');
    if(inputPesqAba) {
        inputPesqAba.addEventListener('keyup', (e) => {
            const texto = e.target.value.toLowerCase();
            const abaContainer = document.getElementById(`tab-${abaAtual}`);
            if(!abaContainer) return;
            abaContainer.querySelectorAll('.card, .shortcut-card, .mini-card').forEach(card => {
                if(card.innerText.toLowerCase().includes(texto)) card.style.display = 'flex';
                else card.style.display = 'none';
            });
        });
    }

    ['privado-lista-data-inicio', 'privado-lista-data-fim'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => window.renderizarListaPrivados());
    });
    const btnLimparFiltroPrivado = document.getElementById('btn-limpar-filtro-privado-lista');
    if (btnLimparFiltroPrivado) {
        btnLimparFiltroPrivado.addEventListener('click', () => {
            const dtInicioPriv = document.getElementById('privado-lista-data-inicio');
            const dtFimPriv = document.getElementById('privado-lista-data-fim');
            if (dtInicioPriv) dtInicioPriv.value = '';
            if (dtFimPriv) dtFimPriv.value = '';
            window.renderizarListaPrivados();
        });
    }

    document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn[data-tab]').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            btn.classList.add('active');
            abaAtual = btn.getAttribute('data-tab');
            const tabEl = document.getElementById(`tab-${abaAtual}`);
            if(tabEl) tabEl.style.display = 'block';
            
            const titleEl = document.getElementById('page-title');
            if(titleEl) titleEl.textContent = btn.textContent.trim();
            const inputPesqLocal = document.getElementById('input-pesquisa');
            if(inputPesqLocal) inputPesqLocal.value = ''; 
            
            if(abaAtual === 'boletins') window.fecharPastaBoletim(); 
            if(abaAtual === 'boletins-privados') window.fecharPastaPrivado();
            ['convenios', 'ultrassom', 'consultas', 'exames-imagem', 'institutos', 'corpo-clinico', 'treinamentos', 'pacotes'].forEach(col => { if(abaAtual === col) window.fecharPastaGenerica(col); });
            if(abaAtual === 'rh' && isAdmin) { window.atualizarOpcoesFiltrosRH(); window.renderizarDashboardRH(); }
            if (window.atualizarBottomQuickbar) window.atualizarBottomQuickbar();
        });
    });
});

window.efetuarLogin = window.efetuarLogin;
window.safeParseJSON = window.safeParseJSON;
window.aplicarImagemClimaHome = window.aplicarImagemClimaHome;
window.abrirMidiaFlutuante = window.abrirMidiaFlutuante;
window.abrirMidaFlutuante = window.abrirMidiaFlutuante;
window.fecharMidiaFlutuante = window.fecharMidiaFlutuante;
window.abrirListaLeituras = window.abrirListaLeituras;
window.fecharModalImpressao = window.fecharModalImpressao;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.info('Novo service worker ativo.');
    });
}
window.abrirModalImpressao = function(tipo = 'boletins') {
    const modal = document.getElementById('modal-imprimir-boletim');
    const inputTipo = document.getElementById('print-boletim-id');

    if (!modal) {
        alert('Modal de impressão não encontrado.');
        return;
    }

    if (inputTipo) inputTipo.value = tipo;
    modal.style.display = 'flex';
};

window.gerarImpressaoBoletim = function() {
    const incluirNome = document.getElementById('print-chk-nome')?.checked;
    const incluirData = document.getElementById('print-chk-data')?.checked;
    const incluirTema = document.getElementById('print-chk-tema')?.checked;
    const incluirMotivo = document.getElementById('print-chk-motivo')?.checked;
    const incluirPublicacao = document.getElementById('print-chk-publicacao')?.checked;

    let boletins = Array.isArray(window.todosBoletinsData) ? [...window.todosBoletinsData] : [];

    if (window.pastaBoletimAtual) {
        boletins = boletins.filter(item => {
            const setor = String(item?.data?.['Para quais Setores?'] || 'Geral');
            return setor.includes(window.pastaBoletimAtual);
        });
    }

    if (!boletins.length) {
        alert('Não há dados de boletins carregados para gerar o relatório.');
        return;
    }

    const linhas = [];

    boletins.forEach(item => {
        const data = item.data || {};
        const leituras = Array.isArray(data.leituras) ? data.leituras : [];
        const titulo = data['Título do Documento'] || data['Título do Informativo'] || 'Sem título';
        const motivo = data['Motivo do Informativo'] || data['Motivo'] || '-';
        const dataPublicacao = data['Data de Publicação'] || data['Publicado em'] || '-';

        if (!leituras.length) {
            linhas.push({
                nome: 'Nenhuma assinatura registrada',
                dataHora: '-',
                tema: titulo,
                motivo,
                publicacao: dataPublicacao
            });
            return;
        }

        leituras.forEach(registro => {
            const texto = String(registro || '').trim();

            let nomeColaborador = texto;
            let dataHora = '-';

            const matchParenteses = texto.match(/^(.*?)\s*\((.*?)\)$/);
            const matchHifen = texto.match(/^(.*?)\s*-\s*(\d{2}\/\d{2}\/\d{4}.*)$/);
            if (matchParenteses) {
                nomeColaborador = matchParenteses[1].trim();
                dataHora = matchParenteses[2].trim();
            } else if (matchHifen) {
                nomeColaborador = matchHifen[1].trim();
                dataHora = matchHifen[2].trim();
            }

            linhas.push({
                nome: nomeColaborador || '-',
                dataHora,
                tema: titulo,
                motivo,
                publicacao: dataPublicacao
            });
        });
    });

    const ths = [];
    if (incluirNome) ths.push('<th>Nome do Colaborador</th>');
    if (incluirData) ths.push('<th>Data/Hora da Assinatura</th>');
    if (incluirTema) ths.push('<th>Tema</th>');
    if (incluirMotivo) ths.push('<th>Motivo</th>');
    if (incluirPublicacao) ths.push('<th>Data de Publicação</th>');

    const escape = (valor) => {
        const texto = String(valor ?? '');
        return texto
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    };

    const trs = linhas.map(linha => {
        const cols = [];
        if (incluirNome) cols.push(`<td>${escape(linha.nome)}</td>`);
        if (incluirData) cols.push(`<td>${escape(linha.dataHora)}</td>`);
        if (incluirTema) cols.push(`<td>${escape(linha.tema)}</td>`);
        if (incluirMotivo) cols.push(`<td>${escape(linha.motivo)}</td>`);
        if (incluirPublicacao) cols.push(`<td>${escape(linha.publicacao)}</td>`);
        return `<tr>${cols.join('')}</tr>`;
    }).join('');

    const totalColunas = Math.max(ths.length, 1);

    const janela = window.open('', '_blank', 'width=1200,height=800');

    if (!janela) {
        alert('O navegador bloqueou a janela de impressão. Libere pop-ups para este site.');
        return;
    }

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório de Assinaturas</title>
<style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
    h1 { color: #8B252C; margin-bottom: 8px; }
    p { margin: 0 0 18px; color: #6b7280; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; font-size: 13px; vertical-align: top; }
    th { background: #8B252C; color: white; }
    tr:nth-child(even) td { background: #f9fafb; }
    @media print {
        @page { size: A4 portrait; margin: 12mm; }
        body { margin: 0; }
    }
</style>
</head>
<body>
    <h1>Relatório de Assinaturas</h1>
    <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
    <table>
        <thead>
            <tr>${ths.join('')}</tr>
        </thead>
        <tbody>
            ${trs || `<tr><td colspan="${totalColunas}">Nenhum registro encontrado.</td></tr>`}
        </tbody>
    </table>
</body>
</html>
`;

    janela.document.open();
    janela.document.write(html);
    janela.document.close();

    setTimeout(() => {
        janela.focus();
        janela.print();
    }, 500);

    window.fecharModalImpressao();
};

window.fecharModalImpressao = function() {
    const modal = document.getElementById('modal-imprimir-boletim');
    if (modal) modal.style.display = 'none';
};

window.abrirJanelaFlutuante = function(url, titulo) {
    const win = document.getElementById('floating-window-persistent');
    const iframe = document.getElementById('fw-iframe');
    const titleEl = document.getElementById('fw-title');
    if(!win || !iframe) return;
    
    const urlFinal = typeof window.obterUrlEmbedMaterial === 'function' ? (window.obterUrlEmbedMaterial(url) || url) : url;
    
    iframe.src = urlFinal;
    if(titleEl) titleEl.innerHTML = `<i class="ri-global-line"></i> ${titulo || 'Navegador Interno'}`;
    
    win.classList.remove('minimized');
    win.style.display = 'flex';
};

window.minimizarJanelaFlutuante = function() {
    const win = document.getElementById('floating-window-persistent');
    if(win) win.classList.add('minimized');
};

window.restaurarJanelaFlutuante = function() {
    const win = document.getElementById('floating-window-persistent');
    if(win) win.classList.remove('minimized');
};

window.fecharJanelaFlutuante = function() {
    const win = document.getElementById('floating-window-persistent');
    const iframe = document.getElementById('fw-iframe');
    if(win) win.style.display = 'none';
    if(iframe) iframe.src = 'about:blank';
};

window.abrirJanelaFlutuanteNovaGuia = function() {
    const iframe = document.getElementById('fw-iframe');
    if(iframe && iframe.src && iframe.src !== 'about:blank') {
        window.open(iframe.src, '_blank');
        window.fecharJanelaFlutuante();
    }
};

window.atualizarBottomQuickbar = function() {
  const bar = document.getElementById('colaboradores-quickbar');
  if (bar) bar.style.display = 'none';
};
