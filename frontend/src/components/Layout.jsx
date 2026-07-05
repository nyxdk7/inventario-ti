import { useEffect, useState } from "react";
import {
  FiArchive,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCpu,
  FiFileText,
  FiGrid,
  FiHardDrive,
  FiKey,
  FiLogOut,
  FiMenu,
  FiMonitor,
  FiPackage,
  FiSettings,
  FiTool,
  FiUsers,
  FiX,
} from "react-icons/fi";

function itemClasse(ativo) {
  if (ativo) {
    return "flex w-full items-center gap-3 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-950";
  }

  return "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white";
}

function subItemClasse(ativo) {
  if (ativo) {
    return "flex w-full items-center gap-3 bg-white/95 px-4 py-2.5 pl-12 text-left text-sm font-semibold text-slate-950";
  }

  return "flex w-full items-center gap-3 px-4 py-2.5 pl-12 text-left text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white";
}

function iconeClasse(ativo) {
  if (ativo) {
    return "flex h-7 w-7 items-center justify-center text-slate-950";
  }

  return "flex h-7 w-7 items-center justify-center text-slate-400";
}

function tituloPagina(paginaAtual) {
  if (paginaAtual === "dashboard") {
    return "Dashboard do inventário";
  }

  if (paginaAtual === "setores") {
    return "Setores e locais";
  }

  if (paginaAtual === "setor_detalhe") {
    return "Detalhes do setor";
  }

  if (paginaAtual === "equipamentos") {
    return "Equipamentos";
  }

  if (paginaAtual === "equipamento_detalhe") {
    return "Detalhes do equipamento";
  }

  if (paginaAtual === "manutencoes") {
    return "Histórico e manutenções";
  }

  if (paginaAtual === "relatorios") {
    return "Relatórios";
  }

  if (paginaAtual === "usuarios") {
    return "Usuários e permissões";
  }

  if (paginaAtual === "backups") {
    return "Backups";
  }

  if (paginaAtual === "configuracoes") {
    return "Configurações do sistema";
  }

  return "Usuários dos computadores";
}

function subtituloPagina(paginaAtual) {
  if (paginaAtual === "dashboard") {
    return "Resumo geral dos cadastros e movimentações do sistema";
  }

  if (paginaAtual === "setores") {
    return "Cadastro dos setores utilizados no inventário";
  }

  if (paginaAtual === "setor_detalhe") {
    return "Computadores, usuários e equipamentos vinculados ao setor";
  }

  if (paginaAtual === "equipamentos") {
    return "Cadastro de patrimônio, marca, modelo, série, setor e status";
  }

  if (paginaAtual === "equipamento_detalhe") {
    return "Visão completa do patrimônio, fotos, compra e histórico";
  }

  if (paginaAtual === "manutencoes") {
    return "Registros de manutenção, movimentação, limpeza, baixa e observações";
  }

  if (paginaAtual === "relatorios") {
    return "Exportação de dados em Excel e PDF";
  }

  if (paginaAtual === "usuarios") {
    return "Gerenciamento de acesso por perfil de usuário";
  }

  if (paginaAtual === "backups") {
    return "Acompanhamento dos backups locais do banco e anexos";
  }

  if (paginaAtual === "configuracoes") {
    return "Parâmetros gerais, segurança, backups, relatórios e ambiente";
  }

  return "Cadastro de IP, MAC e responsável pelo equipamento";
}

function nomeModulo(paginaAtual) {
  if (paginaAtual === "dashboard") {
    return "Dashboard";
  }

  if (paginaAtual === "setores") {
    return "Setores";
  }

  if (paginaAtual === "setor_detalhe") {
    return "Detalhes";
  }

  if (paginaAtual === "equipamentos") {
    return "Equipamentos";
  }

  if (paginaAtual === "equipamento_detalhe") {
    return "Detalhes";
  }

  if (paginaAtual === "manutencoes") {
    return "Histórico";
  }

  if (paginaAtual === "relatorios") {
    return "Relatórios";
  }

  if (paginaAtual === "usuarios") {
    return "Usuários";
  }

  if (paginaAtual === "backups") {
    return "Backups";
  }

  if (paginaAtual === "configuracoes") {
    return "Configurações";
  }

  return "Computadores";
}

export default function Layout({
  children,
  paginaAtual,
  aoTrocarPagina,
  usuario,
  permissoes,
  aoSair,
}) {
  const [menuAberto, setMenuAberto] = useState(true);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [adminAberto, setAdminAberto] = useState(
    paginaAtual === "usuarios" ||
      paginaAtual === "backups" ||
      paginaAtual === "configuracoes"
  );

  const equipamentosAtivo =
    paginaAtual === "equipamentos" || paginaAtual === "equipamento_detalhe";

  const setoresAtivo =
    paginaAtual === "setores" || paginaAtual === "setor_detalhe";

  const administradorAtivo =
    paginaAtual === "usuarios" ||
    paginaAtual === "backups" ||
    paginaAtual === "configuracoes";

  useEffect(() => {
    if (administradorAtivo) {
      setAdminAberto(true);
    }
  }, [administradorAtivo]);

  function navegar(pagina) {
    aoTrocarPagina(pagina);
    setMenuMobileAberto(false);
  }

  function alternarAdministrador(mobile = false) {
    if (!mobile && !menuAberto) {
      setMenuAberto(true);
      setAdminAberto(true);
      return;
    }

    setAdminAberto((estadoAtual) => !estadoAtual);
  }

  function MenuConteudo({ mobile = false }) {
    const podeVerAdministrador =
      permissoes?.podeGerenciarUsuarios ||
      permissoes?.podeGerenciarBackups ||
      permissoes?.podeGerenciarConfiguracoes;

    return (
      <>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center text-white">
              <FiCpu size={25} />
            </div>

            {(menuAberto || mobile) && (
              <div>
                <p className="text-sm font-semibold leading-tight">
                  Inventário
                </p>
                <p className="text-xs text-slate-400">
                  Controle interno
                </p>
              </div>
            )}
          </div>

          {mobile ? (
            <button
              type="button"
              onClick={() => setMenuMobileAberto(false)}
              className="flex h-9 w-9 items-center justify-center text-slate-400 hover:text-white"
              title="Fechar menu"
            >
              <FiX size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMenuAberto((estadoAtual) => !estadoAtual)}
              className="flex h-9 w-9 items-center justify-center text-slate-400 hover:text-white"
              title={menuAberto ? "Recolher menu" : "Expandir menu"}
            >
              {menuAberto ? (
                <FiChevronLeft size={18} />
              ) : (
                <FiChevronRight size={18} />
              )}
            </button>
          )}
        </div>

        <nav className="mt-4 px-3">
          <button
            type="button"
            onClick={() => navegar("dashboard")}
            className={itemClasse(paginaAtual === "dashboard")}
          >
            <span className={iconeClasse(paginaAtual === "dashboard")}>
              <FiGrid size={18} />
            </span>

            {(menuAberto || mobile) && <span>Dashboard</span>}
          </button>

          <button
            type="button"
            onClick={() => navegar("computadores")}
            className={`${itemClasse(paginaAtual === "computadores")} mt-2`}
          >
            <span className={iconeClasse(paginaAtual === "computadores")}>
              <FiMonitor size={18} />
            </span>

            {(menuAberto || mobile) && <span>Computadores</span>}
          </button>

          <button
            type="button"
            onClick={() => navegar("setores")}
            className={`${itemClasse(setoresAtivo)} mt-2`}
          >
            <span className={iconeClasse(setoresAtivo)}>
              <FiPackage size={18} />
            </span>

            {(menuAberto || mobile) && <span>Setores</span>}
          </button>

          <button
            type="button"
            onClick={() => navegar("equipamentos")}
            className={`${itemClasse(equipamentosAtivo)} mt-2`}
          >
            <span className={iconeClasse(equipamentosAtivo)}>
              <FiHardDrive size={18} />
            </span>

            {(menuAberto || mobile) && <span>Equipamentos</span>}
          </button>

          <button
            type="button"
            onClick={() => navegar("manutencoes")}
            className={`${itemClasse(paginaAtual === "manutencoes")} mt-2`}
          >
            <span className={iconeClasse(paginaAtual === "manutencoes")}>
              <FiTool size={18} />
            </span>

            {(menuAberto || mobile) && <span>Histórico</span>}
          </button>

          {permissoes?.podeGerarRelatorios && (
            <button
              type="button"
              onClick={() => navegar("relatorios")}
              className={`${itemClasse(paginaAtual === "relatorios")} mt-2`}
            >
              <span className={iconeClasse(paginaAtual === "relatorios")}>
                <FiFileText size={18} />
              </span>

              {(menuAberto || mobile) && <span>Relatórios</span>}
            </button>
          )}

          {podeVerAdministrador && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => alternarAdministrador(mobile)}
                className={itemClasse(administradorAtivo)}
              >
                <span className={iconeClasse(administradorAtivo)}>
                  <FiSettings size={18} />
                </span>

                {(menuAberto || mobile) && (
                  <>
                    <span className="flex-1">Administrador</span>

                    <FiChevronDown
                      size={16}
                      className={[
                        "transition-transform",
                        adminAberto ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </>
                )}
              </button>

              {adminAberto && (menuAberto || mobile) && (
                <div className="mt-1 space-y-1">
                  {permissoes?.podeGerenciarUsuarios && (
                    <button
                      type="button"
                      onClick={() => navegar("usuarios")}
                      className={subItemClasse(paginaAtual === "usuarios")}
                    >
                      <FiUsers size={16} />
                      <span>Usuários</span>
                    </button>
                  )}

                  {permissoes?.podeGerenciarBackups && (
                    <button
                      type="button"
                      onClick={() => navegar("backups")}
                      className={subItemClasse(paginaAtual === "backups")}
                    >
                      <FiArchive size={16} />
                      <span>Backups</span>
                    </button>
                  )}

                  {permissoes?.podeGerenciarConfiguracoes && (
                    <button
                      type="button"
                      onClick={() => navegar("configuracoes")}
                      className={subItemClasse(paginaAtual === "configuracoes")}
                    >
                      <FiSettings size={16} />
                      <span>Configurações</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            disabled
            className="mt-2 flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-500"
          >
            <span className="flex h-7 w-7 items-center justify-center text-slate-500">
              <FiKey size={18} />
            </span>

            {(menuAberto || mobile) && <span>Licenças</span>}
          </button>
        </nav>

        {(menuAberto || mobile) && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-3">
              <p className="truncate text-sm font-bold text-white">
                {usuario?.nome || usuario?.username}
              </p>
              <p className="truncate text-xs text-slate-400">
                {usuario?.perfil_display}
              </p>
            </div>

            <button
              type="button"
              onClick={aoSair}
              className="flex w-full items-center justify-center gap-2 border border-white/10 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <FiLogOut size={16} />
              Sair
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900">
      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 hidden border-r border-slate-800 bg-[#111827] text-white transition-all duration-200 lg:block",
          menuAberto ? "lg:w-72" : "lg:w-20",
        ].join(" ")}
      >
        <MenuConteudo />
      </aside>

      {menuMobileAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuMobileAberto(false)}
          />

          <aside className="absolute inset-y-0 left-0 w-80 max-w-[86vw] bg-[#111827] text-white shadow-xl">
            <MenuConteudo mobile />
          </aside>
        </div>
      )}

      <main
        className={[
          "min-h-screen transition-all duration-200",
          menuAberto ? "lg:pl-72" : "lg:pl-20",
        ].join(" ")}
      >
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:h-16 lg:py-0">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuMobileAberto(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden"
                title="Abrir menu"
              >
                <FiMenu size={20} />
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-base font-bold leading-tight text-slate-950 sm:text-lg">
                  {tituloPagina(paginaAtual)}
                </h1>
                <p className="mt-0.5 line-clamp-2 text-xs leading-tight text-slate-500 sm:line-clamp-1">
                  {subtituloPagina(paginaAtual)}
                </p>
              </div>
            </div>

            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {usuario?.perfil_display}
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {nomeModulo(paginaAtual)}
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}