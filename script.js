// Estado em memória
let produtos = [
  { id: 1, nome: "Teclado mecânico", preco: 289.9 },
  { id: 2, nome: "Mouse sem fio", preco: 119.5 },
  { id: 3, nome: "Monitor 24\"", preco: 849 },
];
let proximoId = 4;
let aviso = "";

const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

// Rotas no estilo Express: "/produtos/:id" gera params.id
const rotas = [
  { path: "/", view: Inicio },
  { path: "/produtos", view: Lista },
  { path: "/produtos/:id", view: Detalhe },
  { path: "/sobre", view: Sobre },
];

function casar(padrao, caminho) {
  const a = padrao.split("/");
  const b = caminho.split("/");

  if (a.length !== b.length) return null;

  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) {
      params[a[i].slice(1)] = decodeURIComponent(b[i]);
    } else if (a[i] !== b[i]) {
      return null;
    }
  }

  return params;
}

function render() {
  const caminho = (location.hash.slice(1) || "/").replace(/\/$/, "") || "/";
  let html = null;

  for (const r of rotas) {
    const params = casar(r.path, caminho);
    if (params) {
      html = r.view(params);
      break;
    }
  }

  const app = document.getElementById("app");
  app.innerHTML = html ?? NaoEncontrada(caminho);
  document.querySelectorAll("#nav a").forEach((a) => {
    const ativo = a.dataset.p === "/" ? caminho === "/" : caminho.startsWith(a.dataset.p);
    if (ativo) {
      a.setAttribute("aria-current", "page");
    } else {
      a.removeAttribute("aria-current");
    }
  });

  document.title = "Mini SPA — " + caminho;
  window.scrollTo(0, 0);
  app.focus({ preventScroll: true });
}

function Inicio() {
  return `<h1>Uma SPA em um único arquivo</h1>
  <p>A página nunca recarrega: o roteador lê o <code>#</code> da URL e troca só o conteúdo. Abra <a href="#/produtos" style="color:var(--accent)">Produtos</a> e clique em um item para ver a rota <code>/produtos/:id</code> em ação.</p>`;
}

function Lista() {
  const itens = produtos
    .map(
      (p) =>
        `<li><a href="#/produtos/${p.id}"><span>${esc(p.nome)}</span><span class="price">${brl(p.preco)}</span></a></li>`
    )
    .join("");

  return `<h1>Produtos</h1>
  <ul class="list">${itens || '<li><a>Nenhum produto cadastrado. Adicione o primeiro abaixo.</a></li>'}</ul>
  <h2>Adicionar produto</h2>
  <div class="panel"><form id="novo">
    <label>Nome<input name="nome" required maxlength="40"></label>
    <label>Preço (R$)<input name="preco" type="number" min="0" step="0.01" required></label>
    <button>Adicionar produto</button>
  </form><p class="msg" role="status">${aviso}</p></div>`;
}

function Detalhe({ id }) {
  const p = produtos.find((x) => x.id === Number(id));

  if (!p) {
    return `<a class="back" href="#/produtos">Voltar aos produtos</a><h1>Produto não encontrado</h1><p class="muted">Nenhum produto com o código ${esc(id)}.</p>`;
  }

  return `<a class="back" href="#/produtos">Voltar aos produtos</a>
  <h1>${esc(p.nome)}</h1>
  <p class="muted">Código lido da rota: <code>params.id = ${esc(id)}</code></p>
  <p class="price" style="font-size:1.6rem">${brl(p.preco)}</p>
  <div class="panel"><form id="editar" data-id="${p.id}">
    <label>Novo preço (R$)<input name="preco" type="number" min="0" step="0.01" value="${p.preco}" required></label>
    <button>Atualizar preço</button>
  </form><p class="msg" role="status">${aviso}</p></div>
  <div class="row"><button class="ghost" id="excluir" data-id="${p.id}">Excluir produto</button></div>`;
}

function Sobre() {
  return `<h1>Sobre</h1><p>Projeto de estudo com HTML, CSS e JavaScript puro, sem bibliotecas. Os dados ficam só na memória: ao recarregar a página, a lista volta ao início.</p>`;
}

function NaoEncontrada(c) {
  return `<h1>Página não encontrada</h1><p class="muted">A rota <code>${esc(c)}</code> não existe. <a href="#/" style="color:var(--accent)">Voltar ao início</a>.</p>`;
}

// Eventos delegados
document.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const d = new FormData(f);

  if (f.id === "novo") {
    produtos.push({ id: proximoId++, nome: d.get("nome").trim(), preco: Number(d.get("preco")) });
    aviso = "Produto adicionado.";
    render();
    aviso = "";
  } else if (f.id === "editar") {
    const p = produtos.find((x) => x.id === Number(f.dataset.id));
    p.preco = Number(d.get("preco"));
    aviso = "Preço atualizado.";
    render();
    aviso = "";
  }
});

document.addEventListener("click", (e) => {
  if (e.target.id === "excluir") {
    produtos = produtos.filter((x) => x.id !== Number(e.target.dataset.id));
    location.hash = "#/produtos";
  }
});

window.addEventListener("hashchange", render);
render();
