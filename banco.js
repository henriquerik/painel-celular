// Configuração Simples
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
    produtos: [], 
    estoque: [], 
    financas: [], 
    clientes: [], 
    pedidos: [], 
    marcas: [], 
    consignados: [], 
    configGlobal: { tema: "#007acc", fonte: "13" },
    ultimaAtualizacao: 0
};

// ==========================================
// 🔄 CARREGAR DADOS (OFFLINE + ONLINE)
// ==========================================
function carregarBanco() {
    // 1. Puxa rápido da memória do aparelho (offline)
    var memoria = localStorage.getItem('rik3d_erp_dados');
    if (memoria) { 
        db = JSON.parse(memoria);
        aplicarVisual();
    }
    
    // 2. Conecta no Firebase para ver se tem dados mais novos
    setTimeout(conectarFirebase, 800);
}

function aplicarVisual() {
    document.documentElement.style.setProperty('--primary', db.configGlobal?.tema || "#007acc");
    document.body.style.fontSize = (db.configGlobal?.fonte || "13") + 'px';
}

function conectarFirebase() {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        
        // Sincroniza o ERP inteiro puxando da nuvem
        if (navigator.onLine) {
            firebase.database().ref('erp_dados').once('value').then(function(snapshot) {
                var dadosNuvem = snapshot.val();
                // Só atualiza a tela se a nuvem tiver dados mais recentes que o aparelho
                if (dadosNuvem && dadosNuvem.ultimaAtualizacao > (db.ultimaAtualizacao || 0)) {
                    db = dadosNuvem;
                    localStorage.setItem('rik3d_erp_dados', JSON.stringify(db));
                    aplicarVisual();
                    // Opcional: recarrega a página para mostrar os dados novos que chegaram
                    // location.reload(); 
                }
            });
        }

        // Fica vigiando novos pedidos da vitrine
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
    // 1. Salva na memória na hora, com a data/hora exata
    db.ultimaAtualizacao = Date.now();
    localStorage.setItem('rik3d_erp_dados', JSON.stringify(db));
    
    // 2. Se tiver internet, manda pra nuvem. Se não, avisa.
    if (navigator.onLine) {
        sincronizarComNuvem();
    } else {
        mostrarToast("💾 Salvo offline. Subirá automático depois!");
    }
}

function sincronizarComNuvem() {
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
        // Envia o ERP inteiro para as suas máquinas conversarem
        firebase.database().ref('erp_dados').set(db).then(() => {
            
            // Também atualiza a vitrine para os clientes
            firebase.database().ref('vitrine').set({ 
                produtos: db.produtos, 
                atualizado: new Date().toLocaleString() 
            });
            
            mostrarToast("☁️ Salvo e sincronizado!");
        });
    }
}

// ==========================================
// 📶 O "OLHEIRO" DE INTERNET (AUTO-SYNC)
// ==========================================
window.addEventListener('online', function() {
    mostrarToast("📶 Internet voltou! Sincronizando sistema...");
    sincronizarComNuvem(); // Empurra pra nuvem o que você fez offline
});


// ==========================================
// 🎨 MENU E TOAST (MANTIDOS INTACTOS)
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
    if(container) {
        container.innerHTML = menu;
    }
}

function mostrarToast(msg) {
    var t = document.getElementById("toast");
    if(t) { 
        t.innerText = msg; 
        t.className = "toast show"; 
        setTimeout(function(){ t.className = "toast"; }, 3000); 
    }
}
