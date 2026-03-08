// Configuração do Firebase
var firebaseConfig = {
    apiKey: "AIzaSyAYF8Deb-EElNATv_j-S-TEI_mrlFLpTos",
    authDomain: "rik-3d-epr.firebaseapp.com",
    databaseURL: "https://rik-3d-epr-default-rtdb.firebaseio.com",
    projectId: "rik-3d-epr",
    storageBucket: "rik-3d-epr.firebasestorage.app",
    messagingSenderId: "331521054701",
    appId: "1:331521054701:web:d794daaa1bdca3e0ecb9e4"
};

var db = { 
    produtos: [], estoque: [], financas: [], clientes: [], pedidos: [], marcas: [], consignados: [], 
    configGlobal: { tema: "#007acc", fonte: "13" },
    ultimaAtualizacao: 0
};

// ==========================================
// 🔄 CARREGAR DADOS (OFFLINE + ONLINE)
// ==========================================
function carregarBanco() {
    var memoria = localStorage.getItem('rik3d_erp_dados');
    if (memoria) { 
        db = JSON.parse(memoria);
        aplicarVisual();
    }
    setTimeout(conectarFirebase, 800);
}

function aplicarVisual() {
    document.documentElement.style.setProperty('--primary', db.configGlobal?.tema || "#007acc");
    document.body.style.fontSize = (db.configGlobal?.fonte || "13") + 'px';
}

// 🛡️ EXORCIZANDO O FANTASMA DA NUVEM (Força tudo a ser Lista de novo)
function sanitizarDadosNuvem(dados) {
    const listas = ['produtos', 'estoque', 'financas', 'clientes', 'pedidos', 'marcas', 'consignados'];
    listas.forEach(lista => {
        if (dados[lista]) {
            // Se o Firebase transformou em objeto, volta para Array (Lista)
            if (!Array.isArray(dados[lista])) {
                dados[lista] = Object.values(dados[lista]);
            }
            // Remove os "fantasmas" (itens nulos que o Firebase deixa no meio)
            dados[lista] = dados[lista].filter(item => item !== null && item !== undefined);
        } else {
            dados[lista] = [];
        }
    });
    return dados;
}

function conectarFirebase() {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        
        if (navigator.onLine) {
            firebase.database().ref('erp_dados').once('value').then(function(snapshot) {
                var dadosNuvem = snapshot.val();
                if (dadosNuvem && dadosNuvem.ultimaAtualizacao > (db.ultimaAtualizacao || 0)) {
                    
                    // Aplica a vacina contra o bug das listas do Firebase!
                    db = sanitizarDadosNuvem(dadosNuvem);
                    
                    localStorage.setItem('rik3d_erp_dados', JSON.stringify(db));
                    aplicarVisual();
                }
            });
        }

        firebase.database().ref('pedidos_online').on('child_added', function(snap) {
            var p = snap.val();
            if (p && !p.lido) mostrarToast("🚀 NOVO PEDIDO NA LOJA!");
        });
    }
}

// ==========================================
// 💾 SALVAR DADOS (OFFLINE -> ONLINE)
// ==========================================
function salvarBanco() {
    db.ultimaAtualizacao = Date.now();
    localStorage.setItem('rik3d_erp_dados', JSON.stringify(db));
    
    if (navigator.onLine) {
        sincronizarComNuvem();
    } else {
        mostrarToast("💾 Salvo offline. Subirá automático depois!");
    }
}

function sincronizarComNuvem() {
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
        firebase.database().ref('erp_dados').set(db).then(() => {
            firebase.database().ref('vitrine').set({ 
                produtos: db.produtos, 
                atualizado: new Date().toLocaleString() 
            });
            mostrarToast("☁️ Salvo e sincronizado!");
        });
    }
}

// ==========================================
// 💥 A MEGA LIMPEZA (Apaga PC e Nuvem)
// ==========================================
function nukeSistemaCompleto() {
    if(confirm("⚠️ ALERTA VERMELHO! Isso vai apagar TODO o seu ERP (Estoque, Produtos, Clientes) do PC e da Nuvem! Tem certeza absoluta?")) {
        // 1. Apaga a memória do Computador
        localStorage.removeItem('rik3d_erp_dados');
        
        // 2. Apaga o backup do Google Firebase
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
            firebase.database().ref('erp_dados').remove();
            firebase.database().ref('vitrine').remove();
        }
        
        alert("💥 BOOM! Sistema completamente zerado! O programa vai recarregar vazio.");
        window.location.reload();
    }
}

window.addEventListener('online', function() {
    mostrarToast("📶 Internet voltou! Sincronizando sistema...");
    sincronizarComNuvem(); 
});

// ==========================================
// 🎨 MENU E TOAST
// ==========================================
function construirMenu(abaAtiva) {
    var menu = `
    <div id="toast" class="toast">Mensagem</div>
    <div class="top-bar">
        <div><b>Rik 3D Studio</b></div>
    </div>
    <div class="menu" style="display:flex; gap:4px; overflow-x:auto; padding-bottom:5px;">
        <button class="${abaAtiva === 'calc' ? 'active' : ''}" onclick="window.location.href='calc.html'">CALC</button>
        <button class="${abaAtiva === 'estoque' ? 'active' : ''}" onclick="window.location.href='estoque.html'">ESTOQUE</button>
        <button class="${abaAtiva === 'catalogo' ? 'active' : ''}" onclick="window.location.href='catalogo.html'">CATÁLOGO</button>
        <button class="${abaAtiva === 'pedidos' ? 'active' : ''}" onclick="window.location.href='pedidos.html'">🚀 PEDIDOS</button>
        <button class="${abaAtiva === 'clientes' ? 'active' : ''}" onclick="window.location.href='clientes.html'">👥 CLIENTES</button>
        <button class="${abaAtiva === 'caixa' ? 'active' : ''}" onclick="window.location.href='caixa.html'">💰 CAIXA</button>
        <button class="${abaAtiva === 'divulgar' ? 'active' : ''}" onclick="window.location.href='divulgar.html'">📢 DIVULGAR</button>
        <button class="${abaAtiva === 'opcoes' ? 'active' : ''}" onclick="window.location.href='opcoes.html'">⚙️</button>
    </div>`;
    
    var container = document.getElementById('menu-container');
    if(container) container.innerHTML = menu;
}

function mostrarToast(msg) {
    var t = document.getElementById("toast");
    if(t) { 
        t.innerText = msg; 
        t.className = "toast show"; 
        setTimeout(function(){ t.className = "toast"; }, 3000); 
    }
}
