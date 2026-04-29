// ===== ESTADO =====
let tipo = 'entrada';
let dados = JSON.parse(localStorage.getItem('caixaDA')) || [];
let mesSelecionado = new Date().getMonth();   // 0-11
let anoSelecionado = new Date().getFullYear();
let chart = null;

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

// ===== REFERÊNCIAS DOM =====
const entradaBtn   = document.getElementById('entradaBtn');
const saidaBtn     = document.getElementById('saidaBtn');
const form         = document.getElementById('form');
const descricaoEl  = document.getElementById('descricao');
const valorEl      = document.getElementById('valor');
const dataEl       = document.getElementById('data');
const eventoEl     = document.getElementById('evento');
const obsEl        = document.getElementById('obs');
const listaEl      = document.getElementById('lista');
const saldoEl      = document.getElementById('saldo');
const entradasEl   = document.getElementById('entradas');
const saidasEl     = document.getElementById('saidas');
const tabsEl       = document.getElementById('tabs');
const anoLabelEl   = document.getElementById('anoLabel');
const graficoSubEl = document.getElementById('graficoSub');

// Data padrão: hoje
dataEl.value = hojeISO();

// ===== TIPO ENTRADA/SAÍDA =====
entradaBtn.onclick = () => trocar('entrada');
saidaBtn.onclick   = () => trocar('saida');

function trocar(v) {
  tipo = v;
  entradaBtn.classList.toggle('active', v === 'entrada');
  saidaBtn.classList.toggle('active', v === 'saida');
}

// ===== NAVEGAÇÃO DE ANO =====
document.getElementById('prevAno').onclick = () => { anoSelecionado--; render(); };
document.getElementById('nextAno').onclick = () => { anoSelecionado++; render(); };

// ===== REGISTRAR =====
form.onsubmit = function (e) {
  e.preventDefault();

  const novo = {
    tipo,
    descricao: descricaoEl.value.trim(),
    valor: Number(valorEl.value),
    data: dataEl.value,
    evento: eventoEl.value,
    obs: obsEl.value.trim()
  };

  dados.push(novo);
  salvar();
  form.reset();
  dataEl.value = hojeISO();

  // Selecionar automaticamente o mês do lançamento registrado
  const d = parseData(novo.data);
  mesSelecionado = d.getMonth();
  anoSelecionado = d.getFullYear();

  render();
};

// ===== EXCLUIR INDIVIDUAL =====
// Usamos ID único para evitar bug de índice após remoções
function excluir(id) {
  if (!confirm('Excluir este lançamento?')) return;
  dados = dados.filter(d => d._id !== id);
  salvar();
  render();
}

// ===== LIMPAR TUDO =====
function limparHistorico() {
  if (!confirm('Tem certeza que deseja apagar todo o histórico?')) return;
  dados = [];
  localStorage.removeItem('caixaDA');
  render();
}

// ===== SALVAR =====
function salvar() {
  // Garantir IDs únicos em todos os registros
  dados.forEach(d => { if (!d._id) d._id = Date.now() + Math.random(); });
  localStorage.setItem('caixaDA', JSON.stringify(dados));
}

// Migração: garantir _id em dados antigos ao carregar
salvar();

// ===== RENDER PRINCIPAL =====
function render() {
  renderCards();
  renderTabs();
  renderLista();
  renderGrafico();
}

// --- Cards: totais GERAIS (todos os anos) ---
function renderCards() {
  let totalEntrada = 0, totalSaida = 0;
  dados.forEach(d => {
    if (d.tipo === 'entrada') totalEntrada += d.valor;
    else totalSaida += d.valor;
  });
  saldoEl.textContent   = formatBRL(totalEntrada - totalSaida);
  entradasEl.textContent = formatBRL(totalEntrada);
  saidasEl.textContent   = formatBRL(totalSaida);
}

// --- Abas dos 12 meses ---
function renderTabs() {
  anoLabelEl.textContent = anoSelecionado;

  tabsEl.innerHTML = MESES.map((m, i) => {
    const temDados = dados.some(d => {
      const dt = parseData(d.data);
      return dt.getMonth() === i && dt.getFullYear() === anoSelecionado;
    });
    const dot = temDados ? ' •' : '';
    return `<button class="tab ${i === mesSelecionado ? 'active' : ''}"
              onclick="selecionarMes(${i})">${m}${dot}</button>`;
  }).join('');
}

// --- Lista do mês selecionado ---
function renderLista() {
  const doMes = dados
    .filter(d => {
      const dt = parseData(d.data);
      return dt.getMonth() === mesSelecionado && dt.getFullYear() === anoSelecionado;
    })
    .sort((a, b) => parseData(a.data) - parseData(b.data));

  if (doMes.length === 0) {
    listaEl.innerHTML = `<p class="vazio">Nenhum lançamento em ${MESES[mesSelecionado]}/${anoSelecionado}</p>`;
    return;
  }

  let mesEntrada = 0, mesSaida = 0;
  const itens = doMes.map(item => {
    if (item.tipo === 'entrada') mesEntrada += item.valor;
    else mesSaida += item.valor;

    const dataFmt = parseData(item.data).toLocaleDateString('pt-BR');
    const sinal   = item.tipo === 'entrada' ? '+' : '−';
    const obs     = item.obs
      ? `<span class="obs">${esc(item.obs)}</span>`
      : '';

    return `
      <div class="item">
        <div class="item-info">
          <span class="item-desc">${esc(item.descricao)}</span>
          <span class="item-valor ${item.tipo}">${sinal}${formatBRL(item.valor)}</span>
        </div>
        <div class="item-meta">
          <span>${dataFmt}</span>
          <span class="tag">${esc(item.evento)}</span>
          ${obs}
        </div>
        <button class="btn-excluir" onclick="excluir(${item._id})" title="Excluir">✕</button>
      </div>`;
  });

  listaEl.innerHTML = `
    <div class="mes-resumo">
      <span>Entradas: <strong class="entrada">${formatBRL(mesEntrada)}</strong></span>
      <span>Saídas: <strong class="saida">${formatBRL(mesSaida)}</strong></span>
      <span>Saldo: <strong>${formatBRL(mesEntrada - mesSaida)}</strong></span>
    </div>
    ${itens.join('')}`;
}

// --- Gráfico de barras mensal ---
function renderGrafico() {
  const ctx = document.getElementById('financeChart').getContext('2d');
  const wrap = document.querySelector('.grafico-wrap');

  const entradasData = new Array(12).fill(0);
  const saidasData   = new Array(12).fill(0);
  let temQualquerDado = false;

  dados.forEach(d => {
    const dt = parseData(d.data);
    if (dt.getFullYear() === anoSelecionado) {
      const m = dt.getMonth();
      if (d.tipo === 'entrada') entradasData[m] += d.valor;
      else saidasData[m] += d.valor;
      temQualquerDado = true;
    }
  });

  graficoSubEl.textContent = `Entradas e saídas mês a mês — ${anoSelecionado}`;

  // Sem dados: mostrar mensagem sem renderizar chart vazio
  if (!temQualquerDado) {
    if (chart) { chart.destroy(); chart = null; }
    wrap.innerHTML = `<p class="sem-dados">Nenhum dado para ${anoSelecionado}</p>`;
    return;
  }

  // Garantir canvas existe (pode ter sido substituído pelo parágrafo acima)
  if (!document.getElementById('financeChart')) {
    wrap.innerHTML = '<canvas id="financeChart"></canvas>';
  }

  const ctx2 = document.getElementById('financeChart').getContext('2d');

  if (chart) chart.destroy();

  chart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: MESES.map(m => m.slice(0, 3)),
      datasets: [
        {
          label: 'Entradas',
          data: entradasData,
          backgroundColor: 'rgba(45,125,70,0.75)',
          borderColor: '#2d7d46',
          borderWidth: 1.5,
          borderRadius: 5,
        },
        {
          label: 'Saídas',
          data: saidasData,
          backgroundColor: 'rgba(184,50,50,0.70)',
          borderColor: '#b83232',
          borderWidth: 1.5,
          borderRadius: 5,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { family: 'DM Sans', size: 13 }, boxRadius: 4 }
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${formatBRL(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => 'R$\u00A0' + v.toLocaleString('pt-BR'),
            font: { family: 'DM Sans', size: 11 }
          },
          grid: { color: '#f0e6ea' }
        }
      }
    }
  });
}

// ===== SELECIONAR MÊS =====
function selecionarMes(i) {
  mesSelecionado = i;
  render();
}

// ===== UTILITÁRIOS =====
function formatBRL(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function hojeISO() {
  return new Date().toISOString().split('T')[0];
}

// Evita bug de fuso: interpreta data como local, não UTC
function parseData(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== INICIALIZAR =====
render();
