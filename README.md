# Zavala Serra Apps 🚀

Fun, factual, and skill-based learning adventures for kids. A suite of interactive educational apps designed to inspire curiosity and mastery in music, math, history, and strategy.

## 🌟 Overview

**Zavala Serra Apps** is a collection of educational tools built for the Zavala Serra kids. Every app focuses on real-world skills and knowledge, following a "learning through play" philosophy with a commitment to neutral, factual content.

## 🎮 The App Suite

### LIVE Apps

| App | Description | Link |
| --- | --- | --- |
| **🎹 Little Maestro** | Learn to play piano with interactive lessons, real songs, and fun challenges for little musicians. | [little-maestro.html](little-maestro.html) |
| **🧮 Math Galaxy** | Blast through math challenges—addition, multiplication, fractions, and more in a space adventure. | [math-galaxy.html](math-galaxy.html) |
| **🇨🇱 Descubre Chile** | Explore Chile's amazing history—from the Mapuche people to the Andes, through stories and quizzes. | [descubre-chile.html](descubre-chile.html) |
| **♟️ Chess Quest** | Master chess from the basics—learn how each piece moves, tactics, and play against a friendly AI. | [chess-quest.html](chess-quest.html) |
| **⛪ Fe Explorador** | Descubre oraciones, vidas de santos y patrimonio religioso chileno. (Discover Catholic prayers, lives of saints, and Chilean religious heritage through factual stories and quizzes.) | [fe-explorador.html](fe-explorador.html) |
| **🎸 Guitar Jam** | Learn guitar chords, strum along with songs, and train your ear. | [guitar-jam.html](guitar-jam.html) |
| **🎨 Art Studio** | Draw, paint, and learn famous art styles with guided activities. | [art-studio.html](art-studio.html) |
| **🏓 Sports Arena** | Track matches, run tournaments, and log outdoor activities to balance screen time. | [sports-arena.html](sports-arena.html) |
| **🔬 Lab Explorer** | Mix colors, grow plants, and discover how the world works through interactive experiments. | [lab-explorer.html](lab-explorer.html) |
| **🌍 World Explorer** | Travel the globe—learn flags, capitals, and landmarks across all continents. | [world-explorer.html](world-explorer.html) |
| **📚 Story Explorer** | Read adventure tales and build vocabulary in English and Spanish. | [story-explorer.html](story-explorer.html) |
| **🧗 Quest Adventure** | An RPG-style quest where your progress in every app unlocks new regions on a world map. | [quest-adventure.html](quest-adventure.html) |
| **🎯 Guess Quest** | Build deduction skills and vocabulary by guessing hidden words in English and Spanish. | [guess-quest.html](guess-quest.html) |

## 🛡️ Seguridad Familiar y Balance (Family Safety & Balance)

A core feature of the Zavala Serra Apps suite is helping kids develop healthy digital habits while balancing screen time with real-world activities. (Una característica principal de la suite es ayudar a los niños a desarrollar hábitos digitales saludables equilibrando el tiempo de pantalla con actividades del mundo real).

- **Daily Play Timer (Temporizador Diario)**: Cada perfil tiene un límite diario (por defecto 20 minutos) para fomentar descansos. Al terminar el tiempo, la pantalla se bloquea de forma amigable.
- **Daily Limits (Límites Diarios)**: Los padres pueden configurar límites específicos por aplicación o niño desde el Panel de Padres.
- **Chores System (Sistema de Tareas)**: Cuando se acaba el tiempo, los niños pueden ganar tiempo extra (tokens) completando tareas del mundo real (ej. "Hacer la cama", "Leer 20 minutos"). Un PIN de padres es requerido para aprobar el tiempo extra.
- **Smart Schedule (Horario Inteligente)**: Rotación automática diaria de aplicaciones sugeridas para fomentar una dieta equilibrada de aprendizaje y evitar la fatiga de decisiones. (Automatic daily rotation of suggested apps to encourage a balanced learning diet).
- **Privacidad Local (Local Privacy)**: Todos los datos, progresos y tiempos de uso se almacenan localmente en el dispositivo (`localStorage`). (All data and progress are stored locally on the device, ensuring maximum family privacy).

## 🛠️ Key Features

- **Personalized Profiles**: Kids can create their own explorers with custom avatars and colors.
- **Unified Explorer Rank**: Earn ranks across the entire app suite (Cadet → Legend) by mastering different subjects.
- **Age-Adaptive Difficulty**: Content automatically adjusts to each child's age for an appropriate challenge level.
- **Progress Tracking**: All stars, levels, and scores are saved locally using `localStorage`.
- **Parent Dashboard**: A secure area to monitor progress across all apps in the suite.
- **Safe by Design**: No external API calls, no dynamic third-party content, and no user-generated features.

## 📜 Content Philosophy

All content in this repository adheres to the [Content Guidelines](content-guidelines.md). We prioritize:
- **Verifiable Facts**: Geography, history, science, and math.
- **Classical Skills**: Music theory, chess strategy, and artistic techniques.
- **Neutral Language**: Factual storytelling without modern social or political agendas.

## 🆕 Novedades de la Semana (What's New This Week)

- **¡Nueva App "Guess Quest"!**: Desarrolla habilidades de deducción adivinando palabras ocultas en inglés y español. (Build deduction skills by guessing hidden words in English and Spanish).
- **¡Nueva App "Fe Explorador"!**: Descubre oraciones, santos y herencia católica de Chile de manera interactiva. (Discover prayers, saints and Chilean Catholic heritage interactively).
- **"Sports Arena" Ya Disponible**: Registra actividades deportivas al aire libre sin usar el tiempo de pantalla. (Log outdoor sports activities without consuming screen time).

## 🚀 Instalación y Uso (Getting Started)

Zavala Serra Apps no requiere servidores ni instalaciones complejas. (No build steps or server setup required).

### Opción 1: Jugar Localmente (Play Locally)

Para ejecutar localmente, simplemente abre el archivo `index.html` en cualquier navegador web. (To run the apps locally, simply open the root `index.html` file in any modern web browser).

```bash
# Clone the repository
git clone <repository-url>

# Open the hub
open index.html
```

### Opción 2: Teléfonos y Tablets (Phones & Tablets)

Para la mejor experiencia en dispositivos móviles:
1. Sube los archivos a **GitHub Pages** u otro servidor web estático. (Upload the files to GitHub Pages or another static web server). **Tip: In GitHub, go to Settings > Pages > Source: Deploy from a branch > select `main`.**
2. Abre la URL en el navegador de tu dispositivo móvil. (Open the URL in your mobile browser).
3. Selecciona **"Agregar a la pantalla de inicio"** (Add to Home Screen). Esto instalará la suite como una aplicación de pantalla completa sin conexión. (This will install the suite as a full-screen offline app).
   - **iOS (Safari):** Toca el ícono de compartir (Share) y elige "Agregar a inicio" (Add to Home Screen).
   - **Android (Chrome):** Toca el menú de tres puntos y elige "Agregar a la pantalla principal" (Add to Home Screen).

## 📂 Project Structure

- `index.html`: The main app hub and profile selector.
- `css/`: Stylesheets for the hub and individual apps.
- `js/`: Core logic, authentication, and app-specific scripts.
- `little-maestro.html`, `math-galaxy.html`, etc.: Individual application entry points.

---
*Made with ♥ for the Zavala Serra kids.*
