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

// Função para limpar todo histórico
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

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  const grupos = {};
  dados.forEach((item, index) => {
    const dataObj = new Date(item.data);
    const mesNome = meses[dataObj.getMonth()] + "/" + dataObj.getFullYear();
    if (!grupos[mesNome]) grupos[mesNome] = [];
    grupos[mesNome].push({ ...item, index });
  });

  const anoAtual = new Date().getFullYear();
  meses.forEach(mes => {
    const chave = mes + "/" + anoAtual;
    lista.innerHTML += `<h3>${chave}</h3>`;
    if (grupos[chave]) {
      grupos[chave].forEach(item => {
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
            <button onclick="excluir(${item.index})">Excluir</button>
