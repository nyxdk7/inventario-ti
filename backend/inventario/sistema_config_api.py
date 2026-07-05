import json
import platform
import socket
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .auth_api import perfil_usuario


CONFIG_DIR = settings.BASE_DIR / "data"
CONFIG_PATH = CONFIG_DIR / "configuracoes_sistema.json"

BACKUP_DIR_PADRAO = Path("/var/backups/inventario-ti")


CONFIGURACOES_PADRAO = {
    "geral": {
        "nome_sistema": "Inventário de T.I.",
        "nome_empresa": "MS Mind",
        "email_suporte": "",
        "fuso_horario": "America/Porto_Velho",
        "texto_login": "Use seu usuário e senha para acessar o painel.",
    },
    "seguranca": {
        "exigir_troca_primeiro_acesso": True,
        "tamanho_minimo_senha": 6,
        "tempo_sessao_horas": 8,
        "bloquear_apos_tentativas": 5,
    },
    "backups": {
        "backup_automatico": True,
        "horario_backup": "02:00",
        "dias_retencao": 14,
        "pasta_destino": str(BACKUP_DIR_PADRAO),
    },
    "relatorios": {
        "nome_empresa_relatorio": "MS Mind",
        "responsavel_padrao": "Setor de T.I.",
        "rodape_pdf": "Relatório emitido pelo sistema de Inventário de T.I.",
        "mostrar_data_emissao": True,
    },
}


def usuario_eh_admin(request):
    return request.user.is_authenticated and perfil_usuario(request.user) == "admin"


def erro_sem_permissao():
    return JsonResponse(
        {
            "ok": False,
            "erro": "Somente administradores podem acessar as configurações.",
        },
        status=403,
    )


def mesclar_configuracoes(padrao, salvo):
    resultado = {}

    for chave, valor_padrao in padrao.items():
        valor_salvo = salvo.get(chave) if isinstance(salvo, dict) else None

        if isinstance(valor_padrao, dict):
            resultado[chave] = mesclar_configuracoes(
                valor_padrao,
                valor_salvo if isinstance(valor_salvo, dict) else {},
            )
        else:
            resultado[chave] = valor_salvo if valor_salvo is not None else valor_padrao

    return resultado


def carregar_configuracoes():
    if not CONFIG_PATH.exists():
        return CONFIGURACOES_PADRAO.copy()

    try:
        dados = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        return mesclar_configuracoes(CONFIGURACOES_PADRAO, dados)
    except Exception:
        return CONFIGURACOES_PADRAO.copy()


def salvar_configuracoes(configuracoes):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    configuracoes_finais = mesclar_configuracoes(
        CONFIGURACOES_PADRAO,
        configuracoes if isinstance(configuracoes, dict) else {},
    )

    CONFIG_PATH.write_text(
        json.dumps(configuracoes_finais, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return configuracoes_finais


def formatar_tamanho(bytes_tamanho):
    unidades = ["B", "KB", "MB", "GB", "TB"]
    tamanho = float(bytes_tamanho)

    for unidade in unidades:
        if tamanho < 1024:
            return f"{tamanho:.1f} {unidade}"

        tamanho = tamanho / 1024

    return f"{tamanho:.1f} PB"


def obter_info_sistema():
    tamanho_backups = 0
    total_backups = 0
    ultimo_backup = None

    if BACKUP_DIR_PADRAO.exists():
        arquivos = sorted(
            BACKUP_DIR_PADRAO.glob("inventario-ti-*.tar.gz"),
            key=lambda arquivo: arquivo.stat().st_mtime,
            reverse=True,
        )

        total_backups = len(arquivos)

        for arquivo in arquivos:
            tamanho_backups += arquivo.stat().st_size

        if arquivos:
            stat = arquivos[0].stat()
            ultimo_backup = {
                "nome": arquivos[0].name,
                "tamanho": formatar_tamanho(stat.st_size),
                "data": datetime.fromtimestamp(stat.st_mtime).strftime("%d/%m/%Y %H:%M"),
            }

    return {
        "servidor": socket.gethostname(),
        "sistema_operacional": platform.platform(),
        "ambiente": "Produção" if not settings.DEBUG else "Desenvolvimento",
        "debug": settings.DEBUG,
        "backend": "Online",
        "banco": "SQLite",
        "arquivo_configuracao": str(CONFIG_PATH),
        "total_backups": total_backups,
        "tamanho_backups": formatar_tamanho(tamanho_backups),
        "ultimo_backup": ultimo_backup,
        "atualizado_em": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
    }


@csrf_exempt
@require_http_methods(["GET", "POST", "PUT"])
def configuracoes_view(request):
    if not usuario_eh_admin(request):
        return erro_sem_permissao()

    if request.method == "GET":
        return JsonResponse(
            {
                "ok": True,
                "configuracoes": carregar_configuracoes(),
                "info_sistema": obter_info_sistema(),
            }
        )

    try:
        dados = json.loads(request.body.decode("utf-8")) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "ok": False,
                "erro": "JSON inválido.",
            },
            status=400,
        )

    novas_configuracoes = dados.get("configuracoes", dados)

    configuracoes_salvas = salvar_configuracoes(novas_configuracoes)

    return JsonResponse(
        {
            "ok": True,
            "mensagem": "Configurações salvas com sucesso.",
            "configuracoes": configuracoes_salvas,
            "info_sistema": obter_info_sistema(),
        }
    )