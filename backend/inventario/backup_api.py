import subprocess
from pathlib import Path

from django.http import FileResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .auth_api import perfil_usuario


BACKUP_DIR = Path("/var/backups/inventario-ti")
BACKUP_SCRIPT = Path("/usr/local/bin/backup-inventario-ti.sh")
LOG_FILE = Path("/var/log/inventario-ti-backup.log")


def usuario_eh_admin(request):
    return request.user.is_authenticated and perfil_usuario(request.user) == "admin"


def erro_sem_permissao():
    return JsonResponse(
        {
            "ok": False,
            "erro": "Somente administradores podem acessar os backups.",
        },
        status=403,
    )


def formatar_tamanho(bytes_tamanho):
    if bytes_tamanho is None:
        return "-"

    unidades = ["B", "KB", "MB", "GB", "TB"]
    tamanho = float(bytes_tamanho)

    for unidade in unidades:
        if tamanho < 1024:
            return f"{tamanho:.1f} {unidade}"

        tamanho = tamanho / 1024

    return f"{tamanho:.1f} PB"


def listar_arquivos_backup():
    if not BACKUP_DIR.exists():
        return []

    arquivos = []

    for arquivo in BACKUP_DIR.glob("inventario-ti-*.tar.gz"):
        if not arquivo.is_file():
            continue

        stat = arquivo.stat()

        arquivos.append(
            {
                "nome": arquivo.name,
                "caminho": str(arquivo),
                "tamanho_bytes": stat.st_size,
                "tamanho": formatar_tamanho(stat.st_size),
                "modificado_em_timestamp": stat.st_mtime,
                "modificado_em": arquivo.stat().st_mtime,
            }
        )

    arquivos.sort(key=lambda item: item["modificado_em_timestamp"], reverse=True)

    for arquivo in arquivos:
        data = Path(arquivo["caminho"]).stat()
        from datetime import datetime

        arquivo["modificado_em"] = datetime.fromtimestamp(data.st_mtime).strftime(
            "%d/%m/%Y %H:%M"
        )

    return arquivos


def ler_log(linhas=80):
    if not LOG_FILE.exists():
        return []

    try:
        conteudo = LOG_FILE.read_text(encoding="utf-8", errors="ignore").splitlines()
        return conteudo[-linhas:]
    except Exception:
        return []


@require_http_methods(["GET"])
def backups_view(request):
    if not usuario_eh_admin(request):
        return erro_sem_permissao()

    arquivos = listar_arquivos_backup()
    tamanho_total = sum(item["tamanho_bytes"] for item in arquivos)

    ultimo_backup = arquivos[0] if arquivos else None

    return JsonResponse(
        {
            "ok": True,
            "backup_dir": str(BACKUP_DIR),
            "script_existe": BACKUP_SCRIPT.exists(),
            "log_existe": LOG_FILE.exists(),
            "total_backups": len(arquivos),
            "tamanho_total": formatar_tamanho(tamanho_total),
            "ultimo_backup": ultimo_backup,
            "backups": arquivos,
            "log": ler_log(),
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def executar_backup_view(request):
    if not usuario_eh_admin(request):
        return erro_sem_permissao()

    if not BACKUP_SCRIPT.exists():
        return JsonResponse(
            {
                "ok": False,
                "erro": f"Script de backup não encontrado em {BACKUP_SCRIPT}.",
            },
            status=404,
        )

    try:
        resultado = subprocess.run(
            [str(BACKUP_SCRIPT)],
            capture_output=True,
            text=True,
            timeout=300,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return JsonResponse(
            {
                "ok": False,
                "erro": "O backup demorou demais e foi interrompido.",
            },
            status=500,
        )
    except Exception as erro:
        return JsonResponse(
            {
                "ok": False,
                "erro": f"Erro ao executar backup: {erro}",
            },
            status=500,
        )

    if resultado.returncode != 0:
        return JsonResponse(
            {
                "ok": False,
                "erro": "O script de backup retornou erro.",
                "stdout": resultado.stdout,
                "stderr": resultado.stderr,
                "log": ler_log(),
            },
            status=500,
        )

    arquivos = listar_arquivos_backup()

    return JsonResponse(
        {
            "ok": True,
            "mensagem": "Backup executado com sucesso.",
            "stdout": resultado.stdout,
            "stderr": resultado.stderr,
            "ultimo_backup": arquivos[0] if arquivos else None,
            "backups": arquivos,
            "log": ler_log(),
        }
    )


@require_http_methods(["GET"])
def baixar_backup_view(request):
    if not usuario_eh_admin(request):
        return erro_sem_permissao()

    nome_arquivo = request.GET.get("arquivo", "").strip()

    if not nome_arquivo:
        return JsonResponse(
            {
                "ok": False,
                "erro": "Informe o arquivo de backup.",
            },
            status=400,
        )

    if "/" in nome_arquivo or "\\" in nome_arquivo or ".." in nome_arquivo:
        return JsonResponse(
            {
                "ok": False,
                "erro": "Nome de arquivo inválido.",
            },
            status=400,
        )

    caminho = BACKUP_DIR / nome_arquivo

    if not caminho.exists() or not caminho.is_file():
        return JsonResponse(
            {
                "ok": False,
                "erro": "Arquivo de backup não encontrado.",
            },
            status=404,
        )

    return FileResponse(
        open(caminho, "rb"),
        as_attachment=True,
        filename=nome_arquivo,
        content_type="application/gzip",
    )