import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiArchive,
  FiCamera,
  FiEdit2,
  FiEye,
  FiHardDrive,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import { apiRequest } from "../services/api";

const formularioInicial = {
  tipo: "desktop",
  patrimonio: "",
  marca: "",
  modelo: "",
  numero_serie: "",
  setor_id: "",
  usuario_responsavel: "",
  status: "em_uso",
  produto_novo: false,
  data_compra: "",
  fornecedor: "",
  numero_nota_fiscal: "",
  valor_compra: "",
  garantia_ate: "",
  origem: "",
  observacoes: "",
};

const tiposPadrao = [
  { value: "desktop", label: "Desktop" },
  { value: "notebook", label: "Notebook" },
  { value: "impressora", label: "Impressora" },
  { value: "monitor", label: "Monitor" },
  { value: "roteador", label: "Roteador" },
  { value: "switch", label: "Switch" },
  { value: "nobreak", label: "Nobreak" },
  { value: "celular", label: "Celular" },
  { value: "tablet", label: "Tablet" },
  { value: "outro", label: "Outro" },
];

const statusPadrao = [
  { value: "em_uso", label: "Em uso" },
  { value: "estoque", label: "Em estoque" },
  { value: "manutencao", label: "Em manutenção" },
  { value: "inativo", label: "Baixado/Inativo" },
];

const origensPadrao = [
  { value: "compra", label: "Compra" },
  { value: "doacao", label: "Doação" },
  { value: "transferencia", label: "Transferência" },
  { value: "reaproveitamento", label: "Reaproveitamento" },
];

function somenteDigitos(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function moedaParaDecimal(valor) {
  const digitos = somenteDigitos(valor);

  if (!digitos) {
    return "";
  }

  return (Number(digitos) / 100).toFixed(2);
}

function formatarMoeda(valor) {
  const texto = String(valor ?? "").trim();

  if (!texto) {
    return "";
  }

  const digitos = somenteDigitos(texto);

  if (!digitos) {
    return "";
  }

  const numero = Number(digitos) / 100;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function valorOuTraco(valor) {
  return valor || "-";
}

function Aviso({ aviso, onFechar }) {
  if (!aviso) {
    return null;
  }

  const estilos = {
    sucesso: "border-emerald-200 bg-emerald-50 text-emerald-900",
    erro: "border-red-200 bg-red-50 text-red-900",
    duplicado: "border-amber-200 bg-amber-50 text-amber-950",
  };

  return (
    <div className={`mb-5 border p-4 ${estilos[aviso.tipo] || estilos.erro}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{aviso.titulo}</p>

          {aviso.texto && (
            <p className="mt-1 text-sm">
              {aviso.texto}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="text-sm font-bold opacity-70 hover:opacity-100"
        >
          X
        </button>
      </div>

      {aviso.duplicados?.length > 0 && (
        <div className="mt-4 overflow-x-auto border border-amber-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-amber-100 text-xs uppercase tracking-wide text-amber-950">
              <tr>
                <th className="px-3 py-2">Conflito</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Patrimônio</th>
                <th className="px-3 py-2">Série</th>
                <th className="px-3 py-2">Modelo</th>
              </tr>
            </thead>

            <tbody>
              {aviso.duplicados.map((item) => (
                <tr key={item.id} className="border-t border-amber-100">
                  <td className="px-3 py-2 font-semibold">
                    {item.conflitos?.join(" / ")}
                  </td>
                  <td className="px-3 py-2">{item.tipo_display}</td>
                  <td className="px-3 py-2">{item.patrimonio || "-"}</td>
                  <td className="px-3 py-2">{item.numero_serie || "-"}</td>
                  <td className="px-3 py-2">
                    {[item.marca, item.modelo].filter(Boolean).join(" ") || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function badgeStatus(status) {
  if (status === "em_uso") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "estoque") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  if (status === "manutencao") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function descricaoEquipamento(equipamento) {
  return [equipamento.marca, equipamento.modelo].filter(Boolean).join(" ") || "-";
}

function ResumoCard({ titulo, valor, descricao, icone: Icone }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {titulo}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {valor}
          </p>
          {descricao && (
            <p className="mt-1 text-sm text-slate-500">
              {descricao}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-slate-950 text-white">
          <Icone size={20} />
        </div>
      </div>
    </div>
  );
}

function InfoCompacta({ titulo, valor }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {titulo}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
        {valorOuTraco(valor)}
      </p>
    </div>
  );
}

function EquipamentoCard({
  equipamento,
  aoVerDetalhes,
  aoEditar,
  aoExcluir,
  podeEditar,
  podeExcluir,
}) {
  const fotoPrincipal = equipamento.fotos?.[0];
  const descricao = descricaoEquipamento(equipamento);

  return (
    <article className="group border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[104px_1fr_auto] lg:items-start">
        <div className="h-28 w-full overflow-hidden border border-slate-200 bg-slate-100 lg:h-24 lg:w-24">
          {fotoPrincipal ? (
            <a href={fotoPrincipal.url} target="_blank" rel="noreferrer">
              <img
                src={fotoPrincipal.url}
                alt="Foto do equipamento"
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </a>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
              <FiCamera size={22} />
              <span className="text-xs font-bold">Sem foto</span>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-slate-950 sm:text-lg">
              {equipamento.tipo_display}
            </h3>

            {equipamento.produto_novo && (
              <span className="border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-800">
                Novo
              </span>
            )}

            <span className={`inline-flex border px-2 py-1 text-xs font-bold ${badgeStatus(equipamento.status)}`}>
              {equipamento.status_display}
            </span>
          </div>

          <p className="mt-1 text-sm font-semibold text-slate-600">
            {descricao}
          </p>

          {equipamento.produto_novo && (
            <p className="mt-1 text-xs text-slate-500">
              {equipamento.origem_display || "Origem não informada"}
              {equipamento.valor_compra ? ` · ${formatarMoeda(equipamento.valor_compra)}` : ""}
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <InfoCompacta titulo="Patrimônio" valor={equipamento.patrimonio} />
            <InfoCompacta titulo="Série" valor={equipamento.numero_serie} />
            <InfoCompacta titulo="Setor" valor={equipamento.setor?.nome} />
            <InfoCompacta titulo="Responsável" valor={equipamento.usuario_responsavel} />
            <InfoCompacta titulo="Fotos" valor={equipamento.fotos?.length ? `${equipamento.fotos.length} anexo(s)` : "-"} />
          </div>

          {equipamento.observacoes && (
            <p className="mt-4 line-clamp-2 border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-500">
              {equipamento.observacoes}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 lg:min-w-36">
          <button
            type="button"
            onClick={() => aoVerDetalhes?.(equipamento.id)}
            className="flex items-center justify-center gap-2 border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 lg:py-2.5"
          >
            <FiEye size={16} />
            Ver detalhes
          </button>

          {podeEditar && (
            <button
              type="button"
              onClick={() => aoEditar(equipamento)}
              className="flex items-center justify-center gap-2 border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 lg:py-2.5"
            >
              <FiEdit2 size={16} />
              Editar
            </button>
          )}

          {podeExcluir && (
            <button
              type="button"
              onClick={() => aoExcluir(equipamento)}
              className="flex items-center justify-center gap-2 border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50 lg:py-2.5"
            >
              <FiTrash2 size={16} />
              Excluir
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function SecaoFormulario({ titulo, descricao, children }) {
  return (
    <section className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <h3 className="text-sm font-black text-slate-950">
          {titulo}
        </h3>
        {descricao && (
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {descricao}
          </p>
        )}
      </div>

      <div className="space-y-4 p-4">
        {children}
      </div>
    </section>
  );
}

function Campo({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClasse = "w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5";

export default function EquipamentosPage({ aoVerDetalhes, permissoes }) {
  const [equipamentos, setEquipamentos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [tipos, setTipos] = useState(tiposPadrao);
  const [statusOpcoes, setStatusOpcoes] = useState(statusPadrao);
  const [origens, setOrigens] = useState(origensPadrao);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [fotosSelecionadas, setFotosSelecionadas] = useState([]);
  const [fotosAtuais, setFotosAtuais] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);

  const inputFotosRef = useRef(null);

  const podeEditar = permissoes?.podeEditarInventario ?? true;
  const podeExcluir = permissoes?.podeExcluir ?? true;

  const resumo = useMemo(() => {
    const total = equipamentos.length;
    const emUso = equipamentos.filter((item) => item.status === "em_uso").length;
    const manutencao = equipamentos.filter((item) => item.status === "manutencao").length;
    const semSetor = equipamentos.filter((item) => !item.setor?.id).length;

    return {
      total,
      emUso,
      manutencao,
      semSetor,
    };
  }, [equipamentos]);

  async function carregarSetores() {
    try {
      const dados = await apiRequest("/setores/");
      setSetores(dados.resultados || []);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar setores",
        texto: erro.message,
      });
    }
  }

  async function carregarEquipamentos(termoBusca = busca) {
    setCarregando(true);

    try {
      const query = termoBusca.trim()
        ? `?q=${encodeURIComponent(termoBusca.trim())}`
        : "";

      const dados = await apiRequest(`/equipamentos/${query}`);

      setEquipamentos(dados.resultados || []);
      setTipos(dados.opcoes?.tipos || tiposPadrao);
      setStatusOpcoes(dados.opcoes?.status || statusPadrao);
      setOrigens(dados.opcoes?.origens || origensPadrao);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar equipamentos",
        texto: erro.message,
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarSetores();
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      carregarEquipamentos(busca);
    }, 250);

    return () => clearTimeout(temporizador);
  }, [busca]);

  function atualizarCampo(evento) {
    const { name, value, type, checked } = evento.target;

    setFormulario((estadoAtual) => {
      const novoEstado = {
        ...estadoAtual,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "produto_novo" && !checked) {
        novoEstado.data_compra = "";
        novoEstado.fornecedor = "";
        novoEstado.numero_nota_fiscal = "";
        novoEstado.valor_compra = "";
        novoEstado.garantia_ate = "";
        novoEstado.origem = "";
      }

      return novoEstado;
    });
  }

  function atualizarCampoMoeda(evento, campo) {
    const decimal = moedaParaDecimal(evento.target.value);

    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: decimal,
    }));
  }

  function atualizarFotos(evento) {
    setFotosSelecionadas(Array.from(evento.target.files || []));
  }

  function limparFormulario() {
    setFormulario(formularioInicial);
    setEditandoId(null);
    setFotosSelecionadas([]);
    setFotosAtuais([]);

    if (inputFotosRef.current) {
      inputFotosRef.current.value = "";
    }
  }

  function abrirNovoEquipamento() {
    limparFormulario();
    setAviso(null);
    setModalCadastroAberto(true);
  }

  function fecharModalCadastro() {
    if (salvando) {
      return;
    }

    limparFormulario();
    setModalCadastroAberto(false);
  }

  async function enviarFotos(equipamentoId) {
    if (fotosSelecionadas.length === 0) {
      return;
    }

    const formData = new FormData();

    fotosSelecionadas.forEach((foto) => {
      formData.append("fotos", foto);
    });

    await apiRequest(`/equipamentos/${equipamentoId}/fotos/`, {
      method: "POST",
      body: formData,
    });
  }

  async function salvarEquipamento(evento) {
    evento.preventDefault();

    setSalvando(true);
    setAviso(null);

    const editando = Boolean(editandoId);

    const endpoint = editando
      ? `/equipamentos/${editandoId}/`
      : "/equipamentos/";

    const metodo = editando ? "PUT" : "POST";

    try {
      const dados = await apiRequest(endpoint, {
        method: metodo,
        body: JSON.stringify(formulario),
      });

      const equipamentoId = dados.equipamento?.id || editandoId;

      if (equipamentoId) {
        await enviarFotos(equipamentoId);
      }

      setAviso({
        tipo: "sucesso",
        titulo: editando ? "Equipamento atualizado" : "Equipamento cadastrado",
        texto: fotosSelecionadas.length > 0
          ? `${dados.mensagem} Foto(s) anexada(s) com sucesso.`
          : dados.mensagem,
      });

      limparFormulario();
      setModalCadastroAberto(false);
      setBusca("");
      await carregarEquipamentos("");
    } catch (erro) {
      if (erro.status === 409) {
        setAviso({
          tipo: "duplicado",
          titulo: "Equipamento duplicado encontrado",
          texto: erro.dados?.erro || "Já existe equipamento usando esse patrimônio ou número de série.",
          duplicados: erro.dados?.duplicados || [],
        });

        return;
      }

      setAviso({
        tipo: "erro",
        titulo: "Não foi possível salvar",
        texto: erro.message,
      });
    } finally {
      setSalvando(false);
    }
  }

  function editarEquipamento(equipamento) {
    setEditandoId(equipamento.id);
    setAviso(null);

    setFormulario({
      tipo: equipamento.tipo || "desktop",
      patrimonio: equipamento.patrimonio || "",
      marca: equipamento.marca || "",
      modelo: equipamento.modelo || "",
      numero_serie: equipamento.numero_serie || "",
      setor_id: equipamento.setor?.id || "",
      usuario_responsavel: equipamento.usuario_responsavel || "",
      status: equipamento.status || "em_uso",
      produto_novo: Boolean(equipamento.produto_novo),
      data_compra: equipamento.data_compra || "",
      fornecedor: equipamento.fornecedor || "",
      numero_nota_fiscal: equipamento.numero_nota_fiscal || "",
      valor_compra: equipamento.valor_compra || "",
      garantia_ate: equipamento.garantia_ate || "",
      origem: equipamento.origem || "",
      observacoes: equipamento.observacoes || "",
    });

    setFotosAtuais(equipamento.fotos || []);
    setFotosSelecionadas([]);

    if (inputFotosRef.current) {
      inputFotosRef.current.value = "";
    }

    setModalCadastroAberto(true);
  }

  async function excluirFoto(foto) {
    const confirmar = window.confirm("Deseja remover esta foto?");

    if (!confirmar) {
      return;
    }

    try {
      const dados = await apiRequest(`/equipamentos/fotos/${foto.id}/`, {
        method: "DELETE",
      });

      setAviso({
        tipo: "sucesso",
        titulo: "Foto removida",
        texto: dados.mensagem,
      });

      setFotosAtuais((listaAtual) => listaAtual.filter((item) => item.id !== foto.id));
      await carregarEquipamentos();
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao remover foto",
        texto: erro.message,
      });
    }
  }

  async function excluirEquipamento(equipamento) {
    const descricao = [
      equipamento.tipo_display,
      equipamento.marca,
      equipamento.modelo,
      equipamento.patrimonio ? `Patrimônio ${equipamento.patrimonio}` : "",
    ].filter(Boolean).join(" - ");

    const confirmar = window.confirm(
      `Deseja realmente remover este equipamento?\n\n${descricao}`
    );

    if (!confirmar) {
      return;
    }

    try {
      const dados = await apiRequest(`/equipamentos/${equipamento.id}/`, {
        method: "DELETE",
      });

      setAviso({
        tipo: "sucesso",
        titulo: "Equipamento removido",
        texto: dados.mensagem,
      });

      await carregarEquipamentos();
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao remover",
        texto: erro.message,
      });
    }
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      {!modalCadastroAberto && (
        <Aviso aviso={aviso} onFechar={() => setAviso(null)} />
      )}

      <div className="mb-5 flex flex-col gap-4 border border-slate-200 bg-white p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Equipamentos cadastrados
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Visualização rápida do patrimônio, fotos, setor, responsável e status.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-80">
            <FiSearch
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por patrimônio, marca, setor..."
              className="w-full border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
            />
          </div>

          {podeEditar && (
            <button
              type="button"
              onClick={abrirNovoEquipamento}
              className="flex items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 sm:py-2.5"
            >
              <FiPlus size={17} />
              Novo equipamento
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ResumoCard
          titulo="Total"
          valor={resumo.total}
          descricao="Equipamentos na lista"
          icone={FiHardDrive}
        />
        <ResumoCard
          titulo="Em uso"
          valor={resumo.emUso}
          descricao="Itens ativos"
          icone={FiArchive}
        />
        <ResumoCard
          titulo="Em manutenção"
          valor={resumo.manutencao}
          descricao="Precisam de atenção"
          icone={FiEdit2}
        />
        <ResumoCard
          titulo="Sem setor"
          valor={resumo.semSetor}
          descricao="Itens sem localização"
          icone={FiSearch}
        />
      </div>

      <section className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-black text-slate-950">
              Lista de equipamentos
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Total encontrado: {equipamentos.length}
            </p>
          </div>

          {carregando && (
            <div className="text-sm font-semibold text-slate-500">
              Carregando...
            </div>
          )}
        </div>

        <div className="space-y-4 bg-slate-50/60 p-4 sm:p-5">
          {carregando && equipamentos.length === 0 && (
            <div className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Carregando equipamentos...
            </div>
          )}

          {!carregando && equipamentos.length === 0 && (
            <div className="border border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center bg-slate-100 text-slate-400">
                <FiHardDrive size={25} />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-800">
                Nenhum equipamento encontrado.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Cadastre um novo item ou ajuste a busca para visualizar os registros.
              </p>
            </div>
          )}

          {equipamentos.map((equipamento) => (
            <EquipamentoCard
              key={equipamento.id}
              equipamento={equipamento}
              aoVerDetalhes={aoVerDetalhes}
              aoEditar={editarEquipamento}
              aoExcluir={excluirEquipamento}
              podeEditar={podeEditar}
              podeExcluir={podeExcluir}
            />
          ))}
        </div>
      </section>

      {modalCadastroAberto && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div
            className="absolute inset-0"
            onClick={fecharModalCadastro}
          />

          <div className="absolute inset-y-0 right-0 flex w-full justify-end">
            <div className="relative flex h-full w-full max-w-4xl flex-col bg-[#f4f5f7] shadow-2xl">
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      {editandoId ? "Editar equipamento" : "Novo equipamento"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Preencha os dados do patrimônio, localização, compra e fotos.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fecharModalCadastro}
                    className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-100"
                    title="Fechar"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                <Aviso aviso={aviso} onFechar={() => setAviso(null)} />

                <form onSubmit={salvarEquipamento} className="space-y-5 pb-24">
                  <SecaoFormulario
                    titulo="Identificação"
                    descricao="Dados principais usados para localizar o item no inventário."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <Campo label="Tipo do equipamento">
                        <select
                          name="tipo"
                          value={formulario.tipo}
                          onChange={atualizarCampo}
                          className={inputClasse}
                        >
                          {tipos.map((tipo) => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                      </Campo>

                      <Campo label="Status">
                        <select
                          name="status"
                          value={formulario.status}
                          onChange={atualizarCampo}
                          className={inputClasse}
                        >
                          {statusOpcoes.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </Campo>

                      <Campo label="Patrimônio">
                        <input
                          type="text"
                          name="patrimonio"
                          value={formulario.patrimonio}
                          onChange={atualizarCampo}
                          placeholder="Ex: TI-0001"
                          className={inputClasse}
                        />
                      </Campo>

                      <Campo label="Número de série">
                        <input
                          type="text"
                          name="numero_serie"
                          value={formulario.numero_serie}
                          onChange={atualizarCampo}
                          placeholder="Ex: SN123456"
                          className={inputClasse}
                        />
                      </Campo>

                      <Campo label="Marca">
                        <input
                          type="text"
                          name="marca"
                          value={formulario.marca}
                          onChange={atualizarCampo}
                          placeholder="Ex: Dell"
                          className={inputClasse}
                        />
                      </Campo>

                      <Campo label="Modelo">
                        <input
                          type="text"
                          name="modelo"
                          value={formulario.modelo}
                          onChange={atualizarCampo}
                          placeholder="Ex: OptiPlex 3080"
                          className={inputClasse}
                        />
                      </Campo>
                    </div>
                  </SecaoFormulario>

                  <SecaoFormulario
                    titulo="Localização e responsável"
                    descricao="Informe onde o equipamento está e quem está responsável pelo uso."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <Campo label="Setor">
                        <select
                          name="setor_id"
                          value={formulario.setor_id}
                          onChange={atualizarCampo}
                          className={inputClasse}
                        >
                          <option value="">Sem setor definido</option>

                          {setores.map((setor) => (
                            <option key={setor.id} value={setor.id}>
                              {setor.nome}
                            </option>
                          ))}
                        </select>
                      </Campo>

                      <Campo label="Usuário responsável">
                        <input
                          type="text"
                          name="usuario_responsavel"
                          value={formulario.usuario_responsavel}
                          onChange={atualizarCampo}
                          placeholder="Ex: João Silva"
                          className={inputClasse}
                        />
                      </Campo>
                    </div>
                  </SecaoFormulario>

                  <SecaoFormulario
                    titulo="Compra e origem"
                    descricao="Use esta área quando o item entrou como compra, doação, transferência ou reaproveitamento."
                  >
                    <div className="border border-slate-200 bg-slate-50 p-4">
                      <label className="flex items-center gap-3 text-sm font-bold text-slate-800">
                        <input
                          type="checkbox"
                          name="produto_novo"
                          checked={formulario.produto_novo}
                          onChange={atualizarCampo}
                          className="h-5 w-5 sm:h-4 sm:w-4"
                        />
                        Produto novo
                      </label>
                    </div>

                    {formulario.produto_novo && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <Campo label="Data de compra">
                          <input
                            type="date"
                            name="data_compra"
                            value={formulario.data_compra}
                            onChange={atualizarCampo}
                            className={inputClasse}
                          />
                        </Campo>

                        <Campo label="Garantia até">
                          <input
                            type="date"
                            name="garantia_ate"
                            value={formulario.garantia_ate}
                            onChange={atualizarCampo}
                            className={inputClasse}
                          />
                        </Campo>

                        <Campo label="Fornecedor">
                          <input
                            type="text"
                            name="fornecedor"
                            value={formulario.fornecedor}
                            onChange={atualizarCampo}
                            placeholder="Ex: Magazine, Amazon, fornecedor local..."
                            className={inputClasse}
                          />
                        </Campo>

                        <Campo label="Número da nota fiscal">
                          <input
                            type="text"
                            name="numero_nota_fiscal"
                            value={formulario.numero_nota_fiscal}
                            onChange={atualizarCampo}
                            placeholder="Ex: NF-12345"
                            className={inputClasse}
                          />
                        </Campo>

                        <Campo label="Valor de compra">
                          <input
                            type="text"
                            inputMode="numeric"
                            name="valor_compra"
                            value={formatarMoeda(formulario.valor_compra)}
                            onChange={(evento) => atualizarCampoMoeda(evento, "valor_compra")}
                            placeholder="R$ 0,00"
                            className={inputClasse}
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            Digite apenas os números. Ex: 350000 vira R$ 3.500,00.
                          </p>
                        </Campo>

                        <Campo label="Origem">
                          <select
                            name="origem"
                            value={formulario.origem}
                            onChange={atualizarCampo}
                            className={inputClasse}
                          >
                            <option value="">Selecione a origem</option>

                            {origens.map((origem) => (
                              <option key={origem.value} value={origem.value}>
                                {origem.label}
                              </option>
                            ))}
                          </select>
                        </Campo>
                      </div>
                    )}
                  </SecaoFormulario>

                  <SecaoFormulario
                    titulo="Fotos e observações"
                    descricao="Anexe imagens para facilitar a identificação visual do equipamento."
                  >
                    <Campo label="Fotos do equipamento">
                      <input
                        ref={inputFotosRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={atualizarFotos}
                        className={inputClasse}
                      />

                      <p className="mt-1 text-xs text-slate-500">
                        Você pode anexar uma ou mais fotos do equipamento.
                      </p>

                      {fotosSelecionadas.length > 0 && (
                        <p className="mt-2 text-xs font-semibold text-slate-700">
                          {fotosSelecionadas.length} foto(s) selecionada(s).
                        </p>
                      )}
                    </Campo>

                    {fotosAtuais.length > 0 && (
                      <div className="border border-slate-200 p-3">
                        <p className="mb-3 text-sm font-bold text-slate-800">
                          Fotos atuais
                        </p>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                          {fotosAtuais.map((foto) => (
                            <div key={foto.id} className="border border-slate-200 bg-white p-2">
                              <a href={foto.url} target="_blank" rel="noreferrer">
                                <img
                                  src={foto.url}
                                  alt="Foto do equipamento"
                                  className="h-28 w-full object-cover"
                                />
                              </a>

                              <button
                                type="button"
                                onClick={() => excluirFoto(foto)}
                                className="mt-2 w-full border border-red-200 px-2 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Campo label="Observações">
                      <textarea
                        name="observacoes"
                        value={formulario.observacoes}
                        onChange={atualizarCampo}
                        placeholder="Ex: equipamento novo, em manutenção, sem carregador..."
                        rows={4}
                        className="w-full resize-none border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 sm:py-2.5"
                      />
                    </Campo>
                  </SecaoFormulario>
                </form>
              </div>

              <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={fecharModalCadastro}
                    disabled={salvando}
                    className="border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60 sm:min-w-32"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={(evento) => salvarEquipamento(evento)}
                    disabled={salvando}
                    className="bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-52"
                  >
                    {salvando
                      ? "Salvando..."
                      : editandoId
                        ? "Atualizar equipamento"
                        : "Cadastrar equipamento"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
