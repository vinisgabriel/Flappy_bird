# 🐦 Flappy Bird - Modo Moeda Secreto

[![Flappy Bird](https://img.shields.io/badge/Flappy-Bird-orange?style=for-the-badge&logo=flappybird)](https://github.com/vinisgabriel/Flappy_bird)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?style=for-the-badge&logo=javascript)](https://github.com/vinisgabriel/Flappy_bird)
[![HTML5](https://img.shields.io/badge/HTML5-Canvas-blue?style=for-the-badge&logo=html5)](https://github.com/vinisgabriel/Flappy_bird)
[![CSS3](https://img.shields.io/badge/CSS3-Styles-purple?style=for-the-badge&logo=css3)](https://github.com/vinisgabriel/Flappy_bird)

🎮 **Um clone do clássico Flappy Bird com um modo secreto especial!**

---

## 📖 Sobre o Jogo

Este é um clone do famoso jogo **Flappy Bird** desenvolvido em **JavaScript puro** com **HTML5 Canvas**. O jogo mantém a jogabilidade clássica, mas adiciona um **modo moeda secreto** onde o jogador pode coletar **Bitcoins** e acumular pontos extras!

---

## ✨ Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| 🎯 **Jogabilidade Clássica** | Pule sobre os canos para marcar pontos |
| 🪙 **Modo Moeda Secreto** | Ao passar pelo 10º cano, você entra em uma fase especial |
| 💰 **Bitcoins** | Colete 10 Bitcoins na fase secreta, cada um vale 10 pontos |
| 🏆 **Sistema de Medalhas** | Ganhe medalhas de acordo com sua pontuação final |
| 📊 **Top 10 Scores** | Histórico com as 10 melhores pontuações |
| 💾 **Salvamento Local** | Seus recordes são salvos no navegador |
| 🎵 **Efeitos Sonoros** | Sons para cada ação do jogo |
| 🌀 **Transição de Íris** | Animação suave entre os modos do jogo |
| 📱 **Responsivo** | Funciona em desktop e dispositivos móveis |

---

## 🎯 Como Jogar

### 🕹️ Controles
- **Desktop:** Clique com o mouse para fazer o pássaro pular
- **Mobile:** Toque na tela para fazer o pássaro pular

### 📋 Regras
1. Desvie dos canos para marcar pontos
2. Cada par de canos ultrapassado = **1 ponto**
3. Ao passar pelo **10º cano**, você entra no **modo moeda**
4. Colete os **10 Bitcoins** que aparecem (cada um vale **10 pontos**)
5. Após coletar todos, um **cano de retorno** aparece
6. Entre no cano para voltar ao modo normal

---

## 🏆 Medalhas

| Pontuação | Medalha | Emoji |
|-----------|---------|-------|
| 10 - 19 pontos | 🥉 Bronze | ![Bronze](https://img.shields.io/badge/Bronze-10%2B-b87333) |
| 20 - 29 pontos | 🥈 Prata | ![Prata](https://img.shields.io/badge/Prata-20%2B-c0c0c0) |
| 30 - 39 pontos | 🥇 Ouro | ![Ouro](https://img.shields.io/badge/Ouro-30%2B-ffd700) |
| 40+ pontos | 💎 Platina | ![Platina](https://img.shields.io/badge/Platina-40%2B-e5e4e2) |

---

## 🎮 Demonstração

### Tela Inicial
![Tela Inicial](https://via.placeholder.com/360x640/4CAF50/FFFFFF?text=Flappy+Bird)

### Modo Moeda
![Modo Moeda](https://via.placeholder.com/360x640/FFD700/000000?text=Modo+Moeda)

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Descrição |
|------------|-----------|
| ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) | Estrutura do jogo |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) | Estilização e layout |
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) | Lógica do jogo |
| ![Canvas](https://img.shields.io/badge/Canvas-FF6B6B?style=flat&logo=html5&logoColor=white) | Renderização gráfica |

---

## 📁 Estrutura do Projeto

```text
Flappy_bird/
├── 📄 index.html # Página principal
├── 📄 style.css # Estilos do jogo
├── 📁 js/
│   ├── 📄 main.js # Lógica principal do jogo
│   ├── 📄 bird.js # Classe do pássaro
│   ├── 📄 pipe.js # Gerenciador de canos
│   ├── 📄 coins.js # Gerenciador de moedas
│   └── 📄 IrisTransition.js # Transição de íris
├── 📁 Assets/ # Imagens do jogo
│   ├── 📄 background-day.png
│   ├── 📄 background-night.png
│   ├── 📄 base.png
│   ├── 📄 message.png
│   ├── 📄 Bitcoin giratorio.gif
│   ├── 📄 pipe-green.png
│   ├── 📄 pipe-green -reverse.png
│   ├── 📄 yellowbird-upflap.png
│   ├── 📄 yellowbird-midflap.png
│   ├── 📄 yellowbird-downflap.png
│   ├── 📄 bluebird-upflap.png
│   ├── 📄 bluebird-midflap.png
│   ├── 📄 bluebird-downflap.png
│   ├── 📄 redbird-upflap.png
│   ├── 📄 redbird-midflap.png
│   ├── 📄 redbird-downflap.png
│   ├── 📄 gameover.png
│   ├── 📄 placar.jpg
│   ├── 📄 play.jpg
│   ├── 📄 scorecard.jpg
│   ├── 📄 Bronze.png
│   ├── 📄 Prata.png
│   ├── 📄 ouro.png
│   ├── 📄 Platina.png
│   └── 📄 number_0.png ~ number_9.png
├── 📁 sons/ # Efeitos sonoros
│   ├── 📄 wing.ogg
│   ├── 📄 point.ogg
│   ├── 📄 hit.ogg
│   ├── 📄 die.ogg
│   ├── 📄 swooshing.ogg
│   └── 📄 entrando no cano.m4a
└── 📄 README.md # Este arquivo