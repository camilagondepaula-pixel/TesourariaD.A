let tipo = "entrada";
let dados = JSON.parse(localStorage.getItem("tesourariaDA")) || [];
let grafico;

const btnEntrada = document.getElementById("btnEntrada");
const btnSaida = document.getElementById("btnSaida");
const formulario = document.getElementById("formulario");
const lista = document.getElementById("lista");

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

function renderizar() {
  let entradas = 0;
  let saidas = 0;

  lista.innerHTML = "";

  dados.forEach(item => {

    if (item.tipo === "entrada") {
      entradas += item.valor;
    } else {
      saidas += item.valor;
    }

    lista.innerHTML += `
      <div class="item">
        <strong>${item.descricao}</strong><br>
        ${item.data}<br>
        ${item.evento}<br>
        ${item.categoria}<br>
        <span class="${item.tipo === 'entrada' ? 'tipoEntrada' : 'tipoSaida'}">
          ${item.tipo === 'entrada' ? '+' : '-'} ${moeda(item.valor)}
        </span><br>
        <small>${item.obs}</small>
      </div>
    `;
  });

  document.getElementById("saldo").textContent = moeda(entradas - saidas);
  document.getElementById("entradas").textContent = moeda(entradas);
  document.getElementById("saidas").textContent = moeda(saidas);

  desenharGrafico(entradas, saidas);
}

function desenharGrafico(entradas, saidas) {
  const ctx = document.getElementById("grafico");

  if (grafico) {
    grafico.destroy();
  }

  grafico = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Entradas", "Saídas"],
      datasets: [{
        data: [entradas, saidas]
      }]
    }
  });
}

renderizar();