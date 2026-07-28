from django.contrib import admin

from .models import (
    ComputadorUsuario,
    Equipamento,
    EquipamentoFoto,
    ManutencaoEquipamento,
    Setor,
)


class EquipamentoFotoInline(admin.TabularInline):
    model = EquipamentoFoto
    extra = 0
    readonly_fields = ["criado_em"]


@admin.register(Setor)
class SetorAdmin(admin.ModelAdmin):
    list_display = [
        "nome",
        "responsavel",
        "criado_em",
        "atualizado_em",
    ]

    search_fields = [
        "nome",
        "responsavel",
        "observacoes",
    ]

    readonly_fields = [
        "criado_em",
        "atualizado_em",
    ]


@admin.register(ComputadorUsuario)
class ComputadorUsuarioAdmin(admin.ModelAdmin):
    list_display = [
        "nome_usuario",
        "setor",
        "ip_computador",
        "mac_address",
        "mostrar_especificacoes",
        "processador",
        "memoria_ram",
        "armazenamento_tipo",
        "armazenamento_capacidade",
        "fonte_watts",
        "criado_em",
        "atualizado_em",
    ]

    search_fields = [
        "nome_usuario",
        "setor__nome",
        "ip_computador",
        "mac_address",
        "processador",
        "memoria_ram",
        "armazenamento_capacidade",
        "observacoes",
    ]

    list_filter = [
        "setor",
        "mostrar_especificacoes",
        "armazenamento_tipo",
        "criado_em",
        "atualizado_em",
    ]

    readonly_fields = [
        "criado_em",
        "atualizado_em",
    ]


@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = [
        "tipo",
        "patrimonio",
        "marca",
        "modelo",
        "numero_serie",
        "setor",
        "usuario_responsavel",
        "status",
        "produto_novo",
        "data_compra",
        "valor_compra",
        "garantia_ate",
        "atualizado_em",
    ]

    search_fields = [
        "patrimonio",
        "marca",
        "modelo",
        "numero_serie",
        "setor__nome",
        "usuario_responsavel",
        "fornecedor",
        "numero_nota_fiscal",
        "observacoes",
    ]

    list_filter = [
        "tipo",
        "status",
        "setor",
        "produto_novo",
        "origem",
        "criado_em",
        "atualizado_em",
    ]

    readonly_fields = [
        "criado_em",
        "atualizado_em",
    ]

    inlines = [
        EquipamentoFotoInline,
    ]


@admin.register(EquipamentoFoto)
class EquipamentoFotoAdmin(admin.ModelAdmin):
    list_display = [
        "equipamento",
        "descricao",
        "criado_em",
    ]

    search_fields = [
        "equipamento__patrimonio",
        "equipamento__marca",
        "equipamento__modelo",
        "descricao",
    ]

    readonly_fields = [
        "criado_em",
    ]


@admin.register(ManutencaoEquipamento)
class ManutencaoEquipamentoAdmin(admin.ModelAdmin):
    list_display = [
        "equipamento",
        "tipo_ocorrencia",
        "data_ocorrencia",
        "responsavel_atendimento",
        "status",
        "custo",
        "atualizado_em",
    ]

    search_fields = [
        "equipamento__patrimonio",
        "equipamento__marca",
        "equipamento__modelo",
        "equipamento__numero_serie",
        "equipamento__usuario_responsavel",
        "responsavel_atendimento",
        "descricao",
    ]

    list_filter = [
        "tipo_ocorrencia",
        "status",
        "data_ocorrencia",
        "criado_em",
        "atualizado_em",
    ]

    readonly_fields = [
        "criado_em",
        "atualizado_em",
    ]

# === ADMIN SITES / RACKS ===
from .models import PatchPanel, PatchPanelPorta, RackAtivo, SiteRack


@admin.register(SiteRack)
class SiteRackAdmin(admin.ModelAdmin):
    list_display = ["nome", "codigo", "setor", "localizacao", "altura_u", "status", "atualizado_em"]
    search_fields = ["nome", "codigo", "localizacao", "responsavel", "observacoes"]
    list_filter = ["status", "setor", "altura_u"]


@admin.register(RackAtivo)
class RackAtivoAdmin(admin.ModelAdmin):
    list_display = ["nome", "site", "tipo", "lado", "posicao_u", "altura_u", "ip_gerenciamento", "status"]
    search_fields = ["nome", "site__nome", "marca", "modelo", "patrimonio", "numero_serie", "ip_gerenciamento"]
    list_filter = ["tipo", "status", "lado", "site"]


@admin.register(PatchPanel)
class PatchPanelAdmin(admin.ModelAdmin):
    list_display = ["ativo", "quantidade_portas", "categoria", "tipo_conector", "atualizado_em"]
    list_filter = ["categoria", "tipo_conector"]


@admin.register(PatchPanelPorta)
class PatchPanelPortaAdmin(admin.ModelAdmin):
    list_display = ["patch_panel", "numero", "status", "identificacao", "ponto_logico", "local_destino", "setor"]
    search_fields = ["patch_panel__ativo__nome", "identificacao", "ponto_logico", "local_destino"]
    list_filter = ["status", "setor"]
# === FIM ADMIN SITES / RACKS ===

