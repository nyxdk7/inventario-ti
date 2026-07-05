import { useEffect, useState } from "react";
import {
  FiArchive,
  FiClock,
  FiDownload,
  FiFileText,
  FiHardDrive,
  FiPlay,
  FiRefreshCw,
  FiServer,
} from "react-icons/fi";

import { API_BASE_URL, apiRequest } from "../services/api";

function CardResumo({ icone: Icone, titulo, valor, descricao }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {titulo}
          </p>
          <p className="mt-2 text-xl font-black text-slate-950">
            {valor}
          </p>
          {descricao && (
            <p className="mt-1 text-sm text-slate-500">
              {descricao}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center bg-slate-950 text-white">
          <Icone size={20} />
        </div>
      </div>
    </div>
  );
}

function Aviso({ aviso, aoFechar }) {
  if (!aviso) {
    return null;
  }

  const classes = {
    sucesso: "border-emerald-200 bg-emerald-50 text-emerald-900",
    erro: "border-red-200 bg-red-50 text-red-900",
    info: "border-sky-200 bg-sky-50 text-sky-900",
  };

  return (
    <div className={`mb-5 border p-4 ${classes[aviso.tipo] || classes.info}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold">
            {aviso.titulo}
          </p>

          {aviso.texto && (
            <p className="mt-1 text-sm leading-5">
              {aviso.texto}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={aoFechar}
          className="text-sm font-bold opacity-70 hover:opacity-100"
        >
          X
        </button>
      </div>
    </div>
  );
}

function BackupMobileCard({ backup, aoBaixar }) {
  return (
    <div className="border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-black text-slate-950">
            {backup.nome}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {backup.modificado_em}
          </p>
        </div>

        <span className="shrink-0 border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">
          {backup.tamanho}
        </span>
      </div>

      <button
        type="button"
        onClick={() => aoBaixar(backup)}
        className="mt-4 flex w-full items-center justify-center gap-2 border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
      >
        <FiDownload size={16} />
        Baixar backup
      </button>
    </div>
  );
}

export default function BackupsPage() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [executando, setExecutando] = useState(false);
  const [baixando, setBaixando] = useState("");
  const [aviso, setAviso] = useState(null);

  async function carregarBackups() {
    setCarregando(true);

    try {
      const resposta = await apiRequest("/backups/");
      setDados(resposta);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao carregar backups",
        texto: erro.message,
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarBackups();
  }, []);

  async function executarBackupAgora() {
    const confirmar = window.confirm(
      "Deseja executar um backup agora? Isso pode levar alguns segundos."
    );

    if (!confirmar) {
      return;
    }

    setExecutando(true);
    setAviso({
      tipo: "info",
      titulo: "Backup em execução",
      texto: "Aguarde enquanto o sistema gera uma cópia do banco e dos anexos.",
    });

    try {
      const resposta = await apiRequest("/backups/executar/", {
        method: "POST",
      });

      setAviso({
        tipo: "sucesso",
        titulo: "Backup criado com sucesso",
        texto: resposta.ultimo_backup
          ? `Arquivo gerado: ${resposta.ultimo_backup.nome}`
          : resposta.mensagem,
      });

      await carregarBackups();
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao executar backup",
        texto: erro.message,
      });
    } finally {
      setExecutando(false);
    }
  }

  async function baixarBackup(backup) {
    setBaixando(backup.nome);

    try {
      const url = `${API_BASE_URL}/backups/baixar/?arquivo=${encodeURIComponent(
        backup.nome
      )}`;

      const resposta = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!resposta.ok) {
        let mensagem = "Não foi possível baixar o backup.";

        try {
          const erroJson = await resposta.json();
          mensagem = erroJson.erro || mensagem;
        } catch {
          //
        }

        throw new Error(mensagem);
      }

      const blob = await resposta.blob();
      const urlBlob = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = urlBlob;
      link.download = backup.nome;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(urlBlob);
    } catch (erro) {
      setAviso({
        tipo: "erro",
        titulo: "Erro ao baixar backup",
        texto: erro.message,
      });
    } finally {
      setBaixando("");
    }
  }

  const backups = dados?.backups || [];
  const ultimoBackup = dados?.ultimo_backup;

  return (
    <div className="mx-auto max-w-7xl">
      <Aviso aviso={aviso} aoFechar={() => setAviso(null)} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            Backups do sistema
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe os backups locais do banco de dados e arquivos anexados.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={carregarBackups}
            disabled={carregando}
            className="flex items-center justify-center gap-2 border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            <FiRefreshCw size={16} />
            Atualizar
          </button>

          <button
            type="button"
            onClick={executarBackupAgora}
            disabled={executando}
            className="flex items-center justify-center gap-2 bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {executando ? (
              <>
                <span className="h-4 w-4 animate-spin border-2 border-white/40 border-t-white" />
                Executando...
              </>
            ) : (
              <>
                <FiPlay size={16} />
                Executar backup agora
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          icone={FiArchive}
          titulo="Total de backups"
          valor={carregando ? "..." : dados?.total_backups || 0}
          descricao="Arquivos disponíveis"
        />

        <CardResumo
          icone={FiClock}
          titulo="Último backup"
          valor={ultimoBackup?.modificado_em || "-"}
          descricao={ultimoBackup?.nome || "Nenhum backup encontrado"}
        />

        <CardResumo
          icone={FiHardDrive}
          titulo="Espaço utilizado"
          valor={dados?.tamanho_total || "-"}
          descricao="Soma dos backups locais"
        />

        <CardResumo
          icone={FiServer}
          titulo="Script"
          valor={dados?.script_existe ? "Ativo" : "Não encontrado"}
          descricao="/usr/local/bin/backup-inventario-ti.sh"
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h3 className="text-base font-bold text-slate-950">
              Arquivos de backup
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Backups salvos em {dados?.backup_dir || "/var/backups/inventario-ti"}
            </p>
          </div>

          <div className="p-4 lg:hidden">
            {carregando && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Carregando backups...
              </div>
            )}

            {!carregando && backups.length === 0 && (
              <div className="border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                Nenhum backup encontrado.
              </div>
            )}

            {!carregando && backups.length > 0 && (
              <div className="space-y-4">
                {backups.map((backup) => (
                  <BackupMobileCard
                    key={backup.nome}
                    backup={backup}
                    aoBaixar={baixarBackup}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Arquivo</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Tamanho</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody>
                {carregando && (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-slate-500">
                      Carregando backups...
                    </td>
                  </tr>
                )}

                {!carregando && backups.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-slate-500">
                      Nenhum backup encontrado.
                    </td>
                  </tr>
                )}

                {!carregando && backups.map((backup) => (
                  <tr key={backup.nome} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">
                        {backup.nome}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {backup.modificado_em}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {backup.tamanho}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => baixarBackup(backup)}
                          disabled={baixando === backup.nome}
                          className="flex items-center gap-2 border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        >
                          <FiDownload size={14} />
                          {baixando === backup.nome ? "Baixando..." : "Baixar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <FiFileText size={18} />
              <h3 className="text-base font-bold text-slate-950">
                Log recente
              </h3>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Últimas linhas do processo de backup.
            </p>
          </div>

          <div className="max-h-[520px] overflow-auto bg-slate-950 p-4">
            {carregando && (
              <p className="text-sm text-slate-400">
                Carregando log...
              </p>
            )}

            {!carregando && (!dados?.log || dados.log.length === 0) && (
              <p className="text-sm text-slate-400">
                Nenhum log encontrado ainda.
              </p>
            )}

            {!carregando && dados?.log?.length > 0 && (
              <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-200">
                {dados.log.join("\n")}
              </pre>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}