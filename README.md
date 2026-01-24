# 📖 Liturgia | Ágape de Jovens

## 👨‍💻 Desenvolvedor
**Gabriel Wolney Drumond**  
Estudante de Engenharia de Software – Universidade Católica de Brasília (UCB)

🔗 **Acesse no celular:** https://liturgia-agape.vercel.app

---

## ✨ Visão Geral

O **Liturgia | Ágape de Jovens** é um ecossistema digital litúrgico desenvolvido para a comunidade **Ágape de Jovens**, com o objetivo de facilitar o acesso diário à liturgia da Igreja, centralizar avisos pastorais e promover a vida espiritual da comunidade.

O projeto é **realmente utilizado** pelo grupo de jovens e foi pensado desde o início para uso prático, simplicidade pastoral e boa experiência em dispositivos móveis.

A aplicação funciona como uma **Progressive Web App (PWA)**, podendo ser instalada no celular e utilizada como um aplicativo nativo tanto em **Android** quanto em **iOS**.

Além disso, consome APIs externas, utiliza persistência local e em nuvem, trabalha com estado, regras de negócio e atualizações em tempo real.

---

## 🚀 Funcionalidades

### 📖 Liturgia Diária
- Consumo de API externa de liturgia diária
- Sistema de fallback automático (modo offline) em caso de falha da API
- Identificação automática do tempo litúrgico
- Ajuste dinâmico das cores litúrgicas (Verde, Branco, Roxo e Vermelho)
- Ícones e elementos visuais conforme o dia
- Skeleton loading durante o carregamento
- Modal com a Liturgia da Palavra completa
- Botão de compartilhamento do Evangelho (Web Share API)

---

### 📜 Salmo Responsorial
- Separação automática do refrão
- Numeração dos versículos com destaque visual
- Layout otimizado para leitura contínua
- Renderização dinâmica dentro do modal da liturgia

---

### 📘 Bíblia Católica (Local)
- Bíblia completa (Antigo e Novo Testamento)
- Base de dados local em JSON (tradução Ave Maria)
- Seleção de livro e capítulo
- Normalização de nomes (acentos, variações e slug)
- Renderização versículo por versículo
- Destaque visual dos números dos versículos
- Interface focada em leitura
- Cache em memória para melhor desempenho

---

### 🙏 Mural de Pedidos de Oração
- Envio público de pedidos de oração (com nome ou anônimo)
- Persistência em Firestore
- Atualização em tempo real
- Pedidos visíveis por 24 horas
- Controle de exclusão apenas pelo autor do pedido
- Identificação do autor via LocalStorage
- Estados vazios e mensagens pastorais

---

### 📝 Notas Espirituais Pessoais
- Bloco de anotações individuais
- Salvamento automático no navegador
- Persistência local (LocalStorage)
- Sugestões dinâmicas de reflexão

---

### 📣 Avisos da Comunidade
- Avisos com data de expiração automática
- Atualização em tempo real
- Ordenação inteligente por data
- Exibição em lista e calendário
- Painel administrativo restrito
- Criação e exclusão de avisos

---

### 📅 Calendário Pastoral
- Calendário mensal interativo
- Dias com avisos destacados visualmente
- Visualização de avisos por dia
- Interface totalmente responsiva

---

### ⏱️ Contador de Leituras
- Botão “Eu li as leituras”
- Contador global diário
- Persistência no Firestore
- Prevenção de múltiplos registros pelo mesmo usuário
- Atualização em tempo real

---

### 🕯️ Liturgia das Horas
- Laudes, Vésperas e Completas
- Conteúdo explicativo pastoral
- Ícone dinâmico conforme o horário do dia
- Integração com conteúdo externo (YouTube)

---

### 📿 Orações Tradicionais
- Banco interno de orações católicas
- Modal unificado para leitura
- Layout focado em oração
- Estrutura reutilizável por chave

---

### 🔔 Notificações
- Integração com Firebase Cloud Messaging
- Notificações para novos avisos
- Tratamento de navegadores incompatíveis

---

### 🌗 Interface e Experiência do Usuário
- Tema claro e escuro
- Persistência de preferências do usuário
- Navegação por abas
- Modais reutilizáveis
- Design totalmente responsivo
- UX pensada para uso pastoral real

---

### 📱 Aplicação Instalável (PWA)
- Instalável no celular (Android e iOS)
- Funciona como aplicativo nativo
- Ícone próprio na tela inicial
- Otimizado para uso mobile

---

### 🔐 Administração
- Autenticação via Firebase Authentication
- Painel administrativo protegido
- Controle de acesso para coordenadores

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- HTML5
- CSS3 (Flexbox e Grid)
- JavaScript (ES6 Modules)

### Backend as a Service (BaaS)
- Firebase
  - Firestore
  - Authentication
  - Cloud Messaging

### Hospedagem
- Vercel

### APIs Externas
- Catholic Readings API
- Liturgia Diária API (Railway)

---

## 📱 Instalação no Celular (PWA)

1. Acesse o site pelo navegador do celular  
   👉 https://liturgia-agape.vercel.app  
2. **Android:** toque em “Instalar aplicativo”  
3. **iOS:** toque em “Compartilhar” → “Adicionar à Tela de Início”
