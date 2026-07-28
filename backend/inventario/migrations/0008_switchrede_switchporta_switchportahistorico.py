import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inventario", "0007_equipamento_tipo_outro_descricao"),
    ]

    operations = [
        migrations.CreateModel(
            name="SwitchRede",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=120, unique=True, verbose_name="Nome do switch")),
                ("marca", models.CharField(blank=True, max_length=100, verbose_name="Marca")),
                ("modelo", models.CharField(blank=True, max_length=120, verbose_name="Modelo")),
                ("patrimonio", models.CharField(blank=True, max_length=80, null=True, unique=True, verbose_name="Patrimônio")),
                ("numero_serie", models.CharField(blank=True, max_length=120, null=True, unique=True, verbose_name="Número de série")),
                ("localizacao", models.CharField(blank=True, max_length=150, verbose_name="Localização")),
                ("rack", models.CharField(blank=True, max_length=100, verbose_name="Rack / armário")),
                ("ip_gerenciamento", models.GenericIPAddressField(blank=True, null=True, protocol="IPv4", unique=True, verbose_name="IP de gerenciamento")),
                ("quantidade_portas", models.PositiveSmallIntegerField(default=24, verbose_name="Quantidade total de portas")),
                ("quantidade_portas_sfp", models.PositiveSmallIntegerField(default=0, verbose_name="Quantidade de portas SFP")),
                ("status", models.CharField(choices=[("em_uso", "Em uso"), ("reserva", "Reserva"), ("manutencao", "Em manutenção"), ("inativo", "Desativado")], default="em_uso", max_length=30, verbose_name="Status")),
                ("observacoes", models.TextField(blank=True, verbose_name="Observações")),
                ("criado_em", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("atualizado_em", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("equipamento", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="switch_rede", to="inventario.equipamento", verbose_name="Equipamento relacionado")),
                ("setor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="switches", to="inventario.setor", verbose_name="Setor")),
            ],
            options={
                "verbose_name": "Switch de rede",
                "verbose_name_plural": "Switches de rede",
                "ordering": ["nome"],
            },
        ),
        migrations.CreateModel(
            name="SwitchPorta",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("numero", models.PositiveSmallIntegerField(verbose_name="Número da porta")),
                ("tipo_porta", models.CharField(choices=[("rj45", "RJ45"), ("sfp", "SFP/SFP+")], default="rj45", max_length=20, verbose_name="Tipo da porta")),
                ("nome", models.CharField(blank=True, max_length=120, verbose_name="Nome da porta")),
                ("tipo_dispositivo", models.CharField(blank=True, choices=[("computador", "Computador"), ("impressora", "Impressora"), ("access_point", "Access Point"), ("camera", "Câmera"), ("telefone_ip", "Telefone IP"), ("switch", "Outro switch"), ("roteador", "Roteador"), ("servidor", "Servidor"), ("nvr_dvr", "NVR/DVR"), ("outro", "Outro")], max_length=30, verbose_name="Tipo de dispositivo")),
                ("status", models.CharField(choices=[("livre", "Livre"), ("ativa", "Ativa"), ("desconectada", "Desconectada"), ("uplink", "Uplink"), ("bloqueada", "Bloqueada"), ("defeituosa", "Defeituosa")], default="livre", max_length=30, verbose_name="Status")),
                ("descricao_dispositivo", models.CharField(blank=True, max_length=180, verbose_name="Descrição manual do dispositivo")),
                ("usuario_responsavel", models.CharField(blank=True, max_length=150, verbose_name="Usuário responsável")),
                ("ip_conectado", models.GenericIPAddressField(blank=True, null=True, protocol="IPv4", verbose_name="IP conectado")),
                ("mac_conectado", models.CharField(blank=True, max_length=17, verbose_name="MAC conectado")),
                ("vlan", models.CharField(blank=True, max_length=80, verbose_name="VLAN")),
                ("perfil", models.CharField(blank=True, max_length=100, verbose_name="Perfil da porta")),
                ("velocidade", models.CharField(choices=[("auto", "Automático"), ("100m", "100 Mb/s"), ("1g", "1 Gb/s"), ("2_5g", "2,5 Gb/s"), ("10g", "10 Gb/s")], default="auto", max_length=20, verbose_name="Velocidade")),
                ("poe", models.BooleanField(default=False, verbose_name="PoE")),
                ("observacoes", models.TextField(blank=True, verbose_name="Observações")),
                ("criado_em", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("atualizado_em", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("computador", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="portas_switch", to="inventario.computadorusuario", verbose_name="Computador conectado")),
                ("equipamento", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="portas_switch", to="inventario.equipamento", verbose_name="Equipamento conectado")),
                ("setor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="portas_switch", to="inventario.setor", verbose_name="Setor atendido")),
                ("switch", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="portas", to="inventario.switchrede", verbose_name="Switch")),
                ("switch_destino", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="uplinks_entrada", to="inventario.switchrede", verbose_name="Switch conectado")),
            ],
            options={
                "verbose_name": "Porta de switch",
                "verbose_name_plural": "Portas de switch",
                "ordering": ["switch", "numero"],
            },
        ),
        migrations.AddConstraint(
            model_name="switchporta",
            constraint=models.UniqueConstraint(fields=("switch", "numero"), name="switch_porta_numero_unico"),
        ),
        migrations.CreateModel(
            name="SwitchPortaHistorico",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("acao", models.CharField(default="Atualização", max_length=80, verbose_name="Ação")),
                ("resumo", models.CharField(blank=True, max_length=220, verbose_name="Resumo")),
                ("dados_anteriores", models.JSONField(blank=True, default=dict, verbose_name="Dados anteriores")),
                ("dados_novos", models.JSONField(blank=True, default=dict, verbose_name="Dados novos")),
                ("alterado_por", models.CharField(blank=True, max_length=150, verbose_name="Alterado por")),
                ("criado_em", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("porta", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="historico", to="inventario.switchporta", verbose_name="Porta")),
            ],
            options={
                "verbose_name": "Histórico de porta",
                "verbose_name_plural": "Históricos de portas",
                "ordering": ["-criado_em"],
            },
        ),
    ]
