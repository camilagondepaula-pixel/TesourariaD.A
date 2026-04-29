let tipo = "entrada";
let dados = JSON.parse(localStorage.getItem("tesourariaDA")) || [];
let grafico;
let mesSelecionado = new Date().getMonth(); // começa no mês atual

const btnEntrada = document.getElementById("btnEntrada");
const btnSaida = document.getElementById("btnSaida");
const formulario = document.getElementById("formulario");
const lista = document.getElementById("lista");
const abasMeses = document.getElementById("abasMeses");

btnEntrada.onclick = () => trocarTipo("entrada");
btnSaida.onclick = () => trocarTipo("saida");

function trocarTipo(novoTipo) {
  tipo = novoTipo;
  btnEntrada.classList.toggle("ativo", tipo === "entrada");
  btnSaida.classList.toggle("ativo", tipo === "saida");
}

formulario.addEventListener("submit", function(e) {
  e.preventDefault();

  const novo = {
    tipo: tipo,
    descricao: document.getElementById("descricao").value,
    valor: Number(document.getElementById("valor").value),
    data: document.getElementById("data").value,
    evento: document.getElementById("evento").value,
    categoria: document.getElementById("categoria").value,
    obs: document.getElementById("obs").value
  };

  dados.push(novo);
  salvar();
  formulario.reset();
  renderizar();
});

function salvar() {
  localStorage.setItem("tesourariaDA", JSON.stringify(dados));
}

function moeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function limparHistorico() {
  if (confirm("Tem certeza que deseja apagar todo o histórico?")) {
    dados = [];
    localStorage.removeItem("tesourariaDA");
    renderizar();
  }
}

function renderizar() {
  let entradas = 0;
  let saidas = 0;
  lista.innerHTML = "";
  abasMeses.innerHTML = "";

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  // Criar abas de meses
  meses.forEach((mes, i) => {
    const btn = document.createElement("button");
    btn.textContent = mes;
    btn.className = (i === mesSelecionado) ? "ativo" : "";
    btn.onclick = () => { mesSelecionado = i; renderizar(); };
    abasMeses.appendChild(btn);
  });

  // Filtrar lançamentos do mês selecionado
  const anoAtual = new Date().getFullYear();
  const chave = meses[mesSelecionado] + "/" + anoAtual;

  const lancamentosMes = dados.filter(item => {
    const dataObj = new Date(item.data);
    return dataObj.getMonth() === mesSelecionado && dataObj.getFullYear() === anoAtual;
  });

  if (lancamentosMes.length === 0) {
    lista.innerHTML = `<p><em>Sem lançamentos em ${chave}</em></p>`;
  } else {
    lancamentosMes.forEach((item, index) => {
      if (item.tipo === "entrada") entradas += item.valor;
      else saidas += item.valor;

      lista.innerHTML += `
        <div class="item">
          <strong>${item.descricao}</strong><br>
          ${item.data}<br>
          ${item.evento}<br>
          ${item.categoria}<br>
          <span class="${item.tipo === 'entrada' ? 'tipoEntrada' : 'tipoSaida'}">
            ${item.tipo === 'entrada' ? '+' : '-'} ${moeda(item.valor)}
          </span><br>
          <small>${item.obs}</small><br>
          <button onclick="excluir(${dados.indexOf(item)})">Excluir</button>
        </div>
      `;
    });
  }

  document.getElementById("saldo").textContent = moeda(entradas - saidas);
  document.getElementById("entradas").textContent = moeda(entradas);
  document.getElementById("saidas").textContent = moeda(saidas);

  desenharGrafico(entradas, saidas);
}

function excluir(index) {
  dados.splice(index, 1);
  salvar();
  renderizar();
}

function desenharGrafico(entradas, saidas) {
  const ctx = document.getElementById("grafico");
  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Entradas", "Saídas"],
      datasets: [{
        data: [entradas, saidas],
        backgroundColor: ["#27ae60", "#c0392b"]
      }]
    }
  });
}

renderizar();
