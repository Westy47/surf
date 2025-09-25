# <Ä surf~

*A keyboard-driven browser startpage*

[![Made with love](https://img.shields.io/badge/Made%20with-d-red?style=flat-square)](https://github.com/results-may-vary-org/surf)

## Description

surf~ is a minimal, keyboard-driven browser startpage designed for efficient web navigation. With vim-inspired keybindings and a terminal aesthetic, it provides quick access to your favorite websites and search functionality without leaving the keyboard.

## Main Features

- **<¯ Keyboard Navigation**: Full hjkl + Tab navigation support
- **¡ Quick Shortcuts**: Single-key access to favorite websites
- **= Instant Search**: Type to search with DuckDuckGo
- **<¨ Multiple Themes**: 14+ themes including Catppuccin, Rosé Pine, and custom variants
- ** Accessibility**: Full keyboard accessibility with screen reader support
- **=ñ Responsive**: Works on desktop and mobile devices
- **=€ Fast**: Pure HTML/CSS/JavaScript - no frameworks, no build process

## Installation

### Using with any HTTP server

1. Clone the repository:
   ```bash
   git clone https://github.com/results-may-vary-org/surf.git
   cd surf
   ```

2. Serve the files using any HTTP server:
   ```bash
   # Python
   python -m http.server 8000

   # Node.js
   npx serve

   # PHP
   php -S localhost:8000
   ```

3. Open `http://localhost:8000` in your browser

### Set as Browser Homepage

Point your browser's homepage setting to your hosted instance or local server.

## Usage

### Navigation

- **hjkl/Tab**: Navigate between commands and choices
- **Enter**: Execute selected command or search
- **Esc**: Clear input/exit modes
- **st**: Open settings

### Shortcuts

- **m**: Mail services (Proton Mail, Gmail)
- **c**: Calendar services (Proton Calendar, Google Calendar)
- **g**: GitHub
- **r**: Reddit communities
- **s**: Spotify
- **y**: YouTube
- **0**: Localhost development servers
- **?**: Help/Documentation

### Input Mode

- Type any text to search
- Multiple options show choices (use hjkl/Tab to navigate)
- Arrow keys work normally for text editing
- Press Enter to execute search or selected choice

## Customization

Edit `script/script.js` to modify shortcuts:

```javascript
shortcuts: {
    'g': [
        { name: 'GitHub', url: 'https://github.com' }
    ],
    // Add your own shortcuts...
}
```

Themes can be selected in the settings panel (press `st`).

## Contributing

We welcome contributions! Please feel free to:

- = Report bugs
- =¡ Suggest new features
- =' Submit pull requests
- =Ö Improve documentation

## Community

- **Repository**: [github.com/results-may-vary-org/surf](https://github.com/results-may-vary-org/surf)
- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Share ideas and ask questions in GitHub Discussions

## Support

If you find surf~ useful, consider:

- P Starring the repository
- = Reporting issues
- = Sharing with others
- > Contributing code or documentation

## License

This project is open source. Check the [LICENSE](LICENSE) file for details.

---

*Made with d for keyboard enthusiasts and vim lovers* <Ä