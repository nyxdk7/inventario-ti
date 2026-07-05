import { useEffect, useState } from "react";

import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import ComputadoresPage from "./pages/ComputadoresPage";
import EquipamentoDetalhePage from "./pages/EquipamentoDetalhePage";
import EquipamentosPage from "./pages/EquipamentosPage";
import LoginPage from "./pages/LoginPage";
import ManutencoesPage from "./pages/ManutencoesPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import SetorDetalhePage from "./pages/SetorDetalhePage";
import SetoresPage from "./pages/SetoresPage";
import UsuariosPage from "./pages/UsuariosPage";
import { apiRequest } from "./services/api";

function montarPermissoes(usuario) {
  const perfil = usuario?.perfil;

  return {
    admin: perfil === "admin",
    tecnico: perfil === "tecnico",
    consulta: perfil === "consulta",

    podeGerenciarUsuarios: perfil === "admin",
    podeGerenciarSetores: perfil === "admin",
    podeExcluir: perfil === "admin",
    podeEditarInventario: perfil === "admin" || perfil === "tecnico",
    podeGerarRelatorios: perfil === "admin" || perfil === "consulta",
  };
}

export default function App() {
  const [paginaAtual, setPaginaAtual] = useState("dashboard");
  const [equipamentoDetalheId, setEquipamentoDetalheId] = useState(null);
  const [setorDetalheId, setSetorDetalheId] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  const permissoes = montarPermissoes(usuario);

  async function carregarSessao() {
    setCarregandoSessao(true);

    try {
      const dados = await apiRequest("/auth/me/");

      if (dados.autenticado) {
        setUsuario(dados.usuario);
      } else {
        setUsuario(null);
      }
    } catch {
      setUsuario(null);
    } finally {
      setCarregandoSessao(false);
    }
  }

  useEffect(() => {
    carregarSessao();

    function encerrarSessao() {
      setUsuario(null);
      setPaginaAtual("dashboard");
    }

    window.addEventListener("sessao-expirada", encerrarSessao);

    return () => {
      window.removeEventListener("sessao-expirada", encerrarSessao);
    };
  }, []);

  function trocarPagina(pagina) {
    if (pagina === "usuarios" && !permissoes.podeGerenciarUsuarios) {
      return;
    }

    if (pagina === "relatorios" && !permissoes.podeGerarRelatorios) {
      return;
    }

    setPaginaAtual(pagina);

    if (pagina !== "equipamento_detalhe") {
      setEquipamentoDetalheId(null);
    }

    if (pagina !== "setor_detalhe") {
      setSetorDetalheId(null);
    }
  }

  function abrirDetalhesEquipamento(equipamentoId) {
    setEquipamentoDetalheId(equipamentoId);
    setSetorDetalheId(null);
    setPaginaAtual("equipamento_detalhe");
  }

  function abrirDetalhesSetor(setorId) {
    setSetorDetalheId(setorId);
    setEquipamentoDetalheId(null);
    setPaginaAtual("setor_detalhe");
  }

  async function sair() {
    try {
      await apiRequest("/auth/logout/", {
        method: "POST",
      });
    } finally {
      setUsuario(null);
      setPaginaAtual("dashboard");
      setEquipamentoDetalheId(null);
      setSetorDetalheId(null);
    }
  }

  function renderizarPagina() {
    if (paginaAtual === "dashboard") {
      return <DashboardPage permissoes={permissoes} />;
    }

    if (paginaAtual === "computadores") {
      return <ComputadoresPage permissoes={permissoes} />;
    }

    if (paginaAtual === "setores") {
      return (
        <SetoresPage
          permissoes={permissoes}
          aoVerDetalhes={abrirDetalhesSetor}
        />
      );
    }

    if (paginaAtual === "setor_detalhe" && setorDetalheId) {
      return (
        <SetorDetalhePage
          setorId={setorDetalheId}
          aoVoltar={() => trocarPagina("setores")}
          permissoes={permissoes}
        />
      );
    }

    if (paginaAtual === "equipamentos") {
      return (
        <EquipamentosPage
          permissoes={permissoes}
          aoVerDetalhes={abrirDetalhesEquipamento}
        />
      );
    }

    if (paginaAtual === "equipamento_detalhe" && equipamentoDetalheId) {
      return (
        <EquipamentoDetalhePage
          equipamentoId={equipamentoDetalheId}
          aoVoltar={() => trocarPagina("equipamentos")}
          permissoes={permissoes}
        />
      );
    }

    if (paginaAtual === "manutencoes") {
      return <ManutencoesPage permissoes={permissoes} />;
    }

    if (paginaAtual === "relatorios" && permissoes.podeGerarRelatorios) {
      return <RelatoriosPage permissoes={permissoes} />;
    }

    if (paginaAtual === "usuarios" && permissoes.podeGerenciarUsuarios) {
      return <UsuariosPage usuarioLogado={usuario} permissoes={permissoes} />;
    }

    return <DashboardPage permissoes={permissoes} />;
  }

  if (carregandoSessao) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f7] p-4">
        <div className="border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Carregando sessão...
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <LoginPage aoEntrar={setUsuario} />;
  }

  return (
    <Layout
      paginaAtual={paginaAtual}
      aoTrocarPagina={trocarPagina}
      usuario={usuario}
      permissoes={permissoes}
      aoSair={sair}
    >
      {renderizarPagina()}
    </Layout>
  );
}