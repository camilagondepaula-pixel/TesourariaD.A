let tipo = 'entrada';
let dados = JSON.parse(localStorage.getItem('caixaDA')) || [];

// Elementos do DOM
const entradaBtn = document.getElementById('entradaBtn');
const saidaBtn = document.getElementById('saidaBtn');
const form = document.getElementById('form');

const descricao = document.getElementById('descricao');
const valor = document.getElementById('valor');
const data = document.getElementById('data');
const evento = document.getElementById('evento');
const obs = document.getElementById('obs');

const lista = document.getElementById('lista');
const saldo = document.getElementById('saldo');
const entradas = document.getElementById('entradas');
const saidas = document.getElementById('saidas');

// Alternar tipo
entradaBtn.onclick = () => trocar('entrada');
saidaBtn.onclick = () => trocar('saida');

function trocar(valor){
  tipo = valor;
  entradaBtn.classList.toggle('active', valor === 'entrada');
  saidaBtn.classList.toggle('active', valor === 'saida');
}

// Registrar lançamento
form.onsubmit = function(e){
  e.preventDefault();

  const novo = {
    tipo,
    descricao: descricao.value,
    valor: Number(valor.value),
    data: data.value,
    evento: evento.value,
    obs: obs.value
  };

  dados.push(novo);
  localStorage.setItem('caixaDA', JSON.stringify(dados));
  form.reset();
  render();
}

// Renderizar histórico mês a mês
function render(){
  let entrada = 0;
  let saida = 0;
  lista.innerHTML = '';

  // Agrupar por mês/ano
  const grupos = {};
  dados.forEach((item, index) => {
    const mesAno = new Date(item.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if(!grupos[mesAno]) grupos[mesAno] = [];
    grupos[mesAno].push({ ...item, index });
  });

  // Renderizar cada mês
  for(const mes in grupos){
    lista.innerHTML += `<h3>${mes}</h3>`;
    grupos[mes].forEach(item => {
      if(item.tipo === 'entrada') entrada += item.valor;
      else saida += item.valor;

      lista.innerHTML += `
        <div class='item'>
          <strong>${item.descricao}</strong> - R$${item.valor.toFixed(2)}<br>
          ${item.data} | ${item.evento}<br>
          ${item.obs}
          <button onclick="excluir(${item.index})">Excluir</button>
        </div>
      `;
    });
  }

  saldo.innerText = `R$${(entrada - saida).toFixed(2)}`;
  entradas.innerText = `R$${entrada.toFixed(2)}`;
  saidas.innerText = `R$${saida.toFixed(2)}`;

  gerarGrafico(entrada, saida);
}

// Excluir lançamento
function excluir(index){
  dados.splice(index, 1);
  localStorage.setItem('caixaDA', JSON.stringify(dados));
  render();
}

// Gráfico com Chart.js
function gerarGrafico(entrada, saida){
  const ctx = document.getElementById('financeChart').getContext('2d');
  if (window.financeChart) window.financeChart.destroy();

  window.financeChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Entradas', 'Saídas'],
      datasets: [{
        data: [entrada, saida],
        backgroundColor: ['#27ae60', '#c0392b']
      }]
    }
  });
}

render();

