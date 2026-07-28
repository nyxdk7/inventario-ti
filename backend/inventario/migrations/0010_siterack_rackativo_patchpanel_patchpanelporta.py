# Generated manually for the Sites / Racks module.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inventario", "0009_starlink_starlinktelemetria"),
    ]

    operations = [
        migrations.CreateModel(
            name="SiteRack",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=150, unique=True, verbose_name="Nome do site / rack")),
                ("codigo", models.CharField(blank=True, max_length=80, null=True, unique=True, verbose_name="Código")),
                ("localizacao", models.CharField(blank=True, max_length=180, verbose_name="Localização")),
                ("responsavel", models.CharField(blank=True, max_length=150, verbose_name="Responsável")),
                ("altura_u", models.PositiveSmallIntegerField(default=42, verbose_name="Altura do rack em U")),
                ("largura_polegadas", models.PositiveSmallIntegerField(default=19, verbose_name="Largura em polegadas")),
                ("status", models.CharField(choices=[("ativo", "Ativo"), ("planejamento", "Em planejamento"), ("manutencao", "Em manutenção"), ("inativo", "Inativo")], default="ativo", max_length=30, verbose_name="Status")),
                ("observacoes", models.TextField(blank=True, verbose_name="Observações")),
                ("criado_em", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("atualizado_em", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("setor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="sites_racks", to="inventario.setor", verbose_name="Setor")),
            ],
            options={
                "verbose_name": "Site / Rack",
                "verbose_name_plural": "Sites / Racks",
                "ordering": ["nome"],
            },
        ),
        migrations.CreateModel(
            name="RackAtivo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=150, verbose_name="Nome do ativo")),
                ("tipo", models.CharField(choices=[("switch", "Switch"), ("patch_panel", "Patch panel"), ("roteador", "Roteador"), ("firewall", "Firewall"), ("servidor", "Servidor"), ("nobreak", "Nobreak"), ("modem", "Modem / ONU"), ("dvr_nvr", "DVR / NVR"), ("organizador", "Organizador de cabos"), ("bandeja", "Bandeja"), ("conversor", "Conversor / mídia"), ("outro", "Outro")], max_length=30, verbose_name="Tipo")),
                ("tipo_outro_descricao", models.CharField(blank=True, max_length=120, verbose_name="Descrição do tipo")),
                ("lado", models.CharField(choices=[("frente", "Frente"), ("traseira", "Traseira")], default="frente", max_length=20, verbose_name="Lado do rack")),
                ("posicao_u", models.PositiveSmallIntegerField(default=1, verbose_name="Posição inicial em U")),
                ("altura_u", models.PositiveSmallIntegerField(default=1, verbose_name="Altura ocupada em U")),
                ("marca", models.CharField(blank=True, max_length=100, verbose_name="Marca")),
                ("modelo", models.CharField(blank=True, max_length=120, verbose_name="Modelo")),
                ("patrimonio", models.CharField(blank=True, max_length=80, null=True, unique=True, verbose_name="Patrimônio")),
                ("numero_serie", models.CharField(blank=True, max_length=140, null=True, unique=True, verbose_name="Número de série")),
                ("ip_gerenciamento", models.GenericIPAddressField(blank=True, null=True, protocol="IPv4", verbose_name="IP de gerenciamento")),
                ("mac_address", models.CharField(blank=True, max_length=17, verbose_name="MAC")),
                ("status", models.CharField(choices=[("ativo", "Ativo"), ("reserva", "Reserva"), ("manutencao", "Em manutenção"), ("inativo", "Inativo")], default="ativo", max_length=30, verbose_name="Status")),
                ("observacoes", models.TextField(blank=True, verbose_name="Observações")),
                ("criado_em", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("atualizado_em", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("equipamento", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="ativo_rack", to="inventario.equipamento", verbose_name="Equipamento relacionado")),
                ("site", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ativos", to="inventario.siterack", verbose_name="Site / Rack")),
                ("switch_rede", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="ativo_rack", to="inventario.switchrede", verbose_name="Switch relacionado")),
            ],
            options={
                "verbose_name": "Ativo do rack",
                "verbose_name_plural": "Ativos do rack",
                "ordering": ["site", "lado", "-posicao_u", "nome"],
            },
        ),
        migrations.CreateModel(
            name="PatchPanel",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantidade_portas", models.PositiveSmallIntegerField(default=24, verbose_name="Quantidade de portas")),
                ("categoria", models.CharField(choices=[("cat5e", "CAT5e"), ("cat6", "CAT6"), ("cat6a", "CAT6A"), ("fibra", "Fibra óptica"), ("outro", "Outro")], default="cat6", max_length=30, verbose_name="Categoria")),
                ("tipo_conector", models.CharField(choices=[("rj45", "RJ45"), ("lc", "LC"), ("sc", "SC"), ("fc", "FC"), ("outro", "Outro")], default="rj45", max_length=30, verbose_name="Conector")),
                ("identificacao", models.CharField(blank=True, max_length=120, verbose_name="Identificação")),
                ("observacoes", models.TextField(blank=True, verbose_name="Observações")),
                ("criado_em", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("atualizado_em", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("ativo", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="patch_panel", to="inventario.rackativo", verbose_name="Ativo do rack")),
            ],
            options={
                "verbose_name": "Patch panel",
                "verbose_name_plural": "Patch panels",
                "ordering": ["ativo__site", "ativo__posicao_u"],
            },
        ),
        migrations.CreateModel(
            name="PatchPanelPorta",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("numero", models.PositiveSmallIntegerField(verbose_name="Número da porta")),
                ("status", models.CharField(choices=[("livre", "Livre"), ("em_uso", "Em uso"), ("reserva", "Reserva"), ("defeituosa", "Defeituosa")], default="livre", max_length=30, verbose_name="Status")),
                ("identificacao", models.CharField(blank=True, max_length=120, verbose_name="Identificação")),
                ("ponto_logico", models.CharField(blank=True, max_length=100, verbose_name="Ponto lógico / tomada")),
                ("local_destino", models.CharField(blank=True, max_length=180, verbose_name="Local de destino")),
                ("observacoes", models.TextField(blank=True, verbose_name="Observações")),
                ("criado_em", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("atualizado_em", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("computador", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="portas_patch_panel", to="inventario.computadorusuario", verbose_name="Computador relacionado")),
                ("equipamento", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="portas_patch_panel", to="inventario.equipamento", verbose_name="Equipamento relacionado")),
                ("patch_panel", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="portas", to="inventario.patchpanel", verbose_name="Patch panel")),
                ("setor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="portas_patch_panel", to="inventario.setor", verbose_name="Setor atendido")),
                ("switch_porta", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="portas_patch_panel", to="inventario.switchporta", verbose_name="Porta do switch relacionada")),
            ],
            options={
                "verbose_name": "Porta do patch panel",
                "verbose_name_plural": "Portas do patch panel",
                "ordering": ["patch_panel", "numero"],
            },
        ),
        migrations.AddConstraint(
            model_name="patchpanelporta",
            constraint=models.UniqueConstraint(fields=("patch_panel", "numero"), name="patch_panel_porta_numero_unico"),
        ),
    ]
