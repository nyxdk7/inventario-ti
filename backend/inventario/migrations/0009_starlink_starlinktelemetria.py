import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inventario", "0008_switchrede_switchporta_switchportahistorico"),
    ]

    operations = [
        migrations.CreateModel(
            name="Starlink",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=150, unique=True, verbose_name="Nome identificador")),
                ("email_conta", models.EmailField(max_length=180, verbose_name="E-mail da conta")),
                ("telefone", models.CharField(blank=True, max_length=30, verbose_name="Telefone")),
                ("localizacao", models.CharField(blank=True, max_length=180, verbose_name="Localização")),
                ("plano", models.CharField(blank=True, max_length=120, verbose_name="Plano")),
                ("placa", models.CharField(blank=True, max_length=20, verbose_name="Placa")),
                ("numero_serie", models.CharField(max_length=140, unique=True, verbose_name="Número de série")),
                ("modelo", models.CharField(max_length=100, verbose_name="Modelo")),
                ("status", models.CharField(choices=[("ativa", "Ativa"), ("cancelada", "Cancelada"), ("espera", "Em espera"), ("manutencao", "Em manutenção"), ("reserva", "Reserva")], default="ativa", max_length=30, verbose_name="Status")),
                ("tipo_utilizacao", models.CharField(choices=[("fixa", "Instalação fixa"), ("veiculo", "Veículo"), ("maquina", "Máquina / equipamento"), ("obra", "Obra / frente de serviço"), ("reserva", "Reserva")], default="fixa", max_length=30, verbose_name="Tipo de utilização")),
                ("responsavel", models.CharField(blank=True, max_length=150, verbose_name="Responsável")),
                ("data_instalacao", models.DateField(blank=True, null=True, verbose_name="Data de instalação")),
                ("data_ativacao", models.DateField(blank=True, null=True, verbose_name="Data de ativação")),
                ("data_cancelamento", models.DateField(blank=True, null=True, verbose_name="Data de cancelamento")),
                ("valor_mensalidade", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True, verbose_name="Valor da mensalidade")),
                ("centro_custo", models.CharField(blank=True, max_length=120, verbose_name="Centro de custo")),
                ("observacoes", models.TextField(blank=True, verbose_name="Observações")),
                ("integracao_habilitada", models.BooleanField(default=False, verbose_name="Integração com API habilitada")),
                ("account_id", models.CharField(blank=True, max_length=160, null=True, unique=True, verbose_name="Account ID")),
                ("starlink_id", models.CharField(blank=True, max_length=160, null=True, unique=True, verbose_name="Starlink ID")),
                ("user_terminal_id", models.CharField(blank=True, max_length=160, null=True, unique=True, verbose_name="User Terminal ID")),
                ("service_line_id", models.CharField(blank=True, max_length=160, null=True, unique=True, verbose_name="Service Line ID")),
                ("kit_number", models.CharField(blank=True, max_length=160, null=True, unique=True, verbose_name="Kit Number")),
                ("ultima_sincronizacao", models.DateTimeField(blank=True, null=True, verbose_name="Última sincronização")),
                ("status_sincronizacao", models.CharField(choices=[("nao_configurada", "Não configurada"), ("pendente", "Pendente"), ("sincronizada", "Sincronizada"), ("erro", "Erro"), ("sem_dados", "Sem dados")], default="nao_configurada", max_length=30, verbose_name="Status da sincronização")),
                ("mensagem_erro_sincronizacao", models.TextField(blank=True, verbose_name="Erro da sincronização")),
                ("criado_em", models.DateTimeField(auto_now_add=True, verbose_name="Criado em")),
                ("atualizado_em", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("equipamento", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="starlink", to="inventario.equipamento", verbose_name="Equipamento relacionado")),
                ("setor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="starlinks", to="inventario.setor", verbose_name="Setor")),
            ],
            options={
                "verbose_name": "Starlink",
                "verbose_name_plural": "Starlinks",
                "ordering": ["nome"],
            },
        ),
        migrations.CreateModel(
            name="StarlinkTelemetria",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status_conexao", models.CharField(choices=[("desconhecido", "Desconhecido"), ("online", "Online"), ("offline", "Offline"), ("sem_dados", "Sem dados")], default="desconhecido", max_length=30, verbose_name="Status da conexão")),
                ("download_mbps", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name="Download Mbps")),
                ("upload_mbps", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name="Upload Mbps")),
                ("latencia_ms", models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name="Latência ms")),
                ("perda_pacotes_percentual", models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True, verbose_name="Perda de pacotes %")),
                ("obstrucao_percentual", models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True, verbose_name="Obstrução %")),
                ("uptime_segundos", models.PositiveBigIntegerField(blank=True, null=True, verbose_name="Uptime em segundos")),
                ("ultima_comunicacao", models.DateTimeField(blank=True, null=True, verbose_name="Última comunicação")),
                ("payload_bruto", models.JSONField(blank=True, default=dict, verbose_name="Dados brutos da API")),
                ("atualizado_em", models.DateTimeField(auto_now=True, verbose_name="Atualizado em")),
                ("starlink", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="telemetria", to="inventario.starlink", verbose_name="Starlink")),
            ],
            options={
                "verbose_name": "Telemetria da Starlink",
                "verbose_name_plural": "Telemetrias das Starlinks",
                "ordering": ["starlink__nome"],
            },
        ),
    ]
