📖 Liturgia | Ágape de Jovens
Um ecossistema digital desenvolvido para a comunidade Ágape de Jovens, focado em facilitar o acesso à vida litúrgica diária e centralizar a comunicação de avisos paroquiais. O projeto funciona como uma PWA (Progressive Web App), permitindo instalação nativa em dispositivos iOS e Android.

🚀 Funcionalidades
Liturgia Diária Dinâmica: Consumo de APIs (Catholic Readings e Railway) para exibição de 1ª Leitura, Salmo, 2ª Leitura (se houver) e Evangelho.

Gestão de Avisos: Painel administrativo restrito para coordenadores postarem avisos com expiração automática por data.

PWA Ready: Instalável em smartphones com suporte a notificações push via Firebase Cloud Messaging (FCM).

Calendário Litúrgico: Ajuste automático de cores (Verde, Branco, Roxo, Vermelho) e ícones de acordo com o tempo litúrgico.

Liturgia das Horas: Atalhos integrados para orações de Laudes, Vésperas e Completas.

Mistérios do Terço: Exibição automática do mistério correspondente ao dia da semana.

🛠️ Tecnologias Utilizadas
Frontend: HTML5, CSS3 (Flexbox/Grid), JavaScript (ES6 Modules).

Backend as a Service (BaaS): Firebase:

Firestore: Banco de dados NoSQL em tempo real para avisos e tokens.

Authentication: Controle de acesso para coordenadores.

Cloud Messaging: Notificações push para engajamento da comunidade.

Hospedagem: Vercel.

APIs Externas:

Catholic Readings API

Liturgia Diária API (Railway)

📱 Instalação
Como o projeto é uma PWA, não é necessário baixar em lojas de aplicativos:

Acesse liturgia-agape.vercel.app pelo navegador do celular.

No Android , clique em "Instalar Aplicativo".

No iOS , clique no ícone de "Compartilhar" e selecione "Adicionar à Tela de Início".

🔧 Configuração de Desenvolvimento
Se desejar rodar o projeto localmente:

Clone o repositório:

git clone https://github.com/seu-usuario/liturgia-agape.git
Abra o index.html com a extensão Live Server no VS Code.

Certifique-se de configurar suas próprias chaves do Firebase no arquivo js/main.js.

👨‍💻 Desenvolvedor
Gabriel Wolney Drumond - Estudante de Engenharia de Software na Universidade Católica de Brasília (UCB).
