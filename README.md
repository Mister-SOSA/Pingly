# Pingly - Network Stability Monitor

A luxurious, real-time network stability monitoring application built with React and TypeScript. Pingly provides beautiful visualizations of your internet connection's latency, helping you identify network instabilities at a glance.

![Pingly Screenshot](https://img.shields.io/badge/Status-Ready%20for%20Deployment-success)

## Features

- **Real-time Monitoring**: Checks network latency every 500ms
- **Beautiful Visualizations**: Clean, modern UI with smooth animations
- **Comprehensive Stats**: Track min/max/average latency, jitter, and packet loss
- **Connection Status**: Visual indicators for connection quality (Excellent, Good, Fair, Poor, Disconnected)
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Dark Theme**: Easy on the eyes with a luxurious dark interface

## Technology Stack

- **React** with TypeScript for type-safe development
- **Recharts** for beautiful, responsive charts
- **Framer Motion** for smooth animations
- **Lucide React** for crisp, scalable icons
- **CSS3** with modern features like backdrop-filter and gradients

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pingly.git
cd pingly
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Building for Production

To create a production build:

```bash
npm run build
```

The build folder will contain optimized static files ready for deployment.

## Deployment to Netlify

This project is configured for easy deployment to Netlify:

1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect the build settings from `netlify.toml`
3. Deploy! The app will be live at your Netlify URL

Alternatively, you can deploy manually:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=build
```

## How It Works

Pingly simulates network latency measurements by timing requests to Cloudflare's DNS service. This provides a reliable indication of your internet connection's responsiveness without requiring a backend server.

The app tracks:
- **Latency**: Round-trip time for network requests
- **Jitter**: Variation in latency over time
- **Packet Loss**: Percentage of failed requests
- **Connection Status**: Overall quality assessment based on latency and jitter

## Performance

- Optimized React rendering with proper memoization
- Efficient chart updates without full re-renders
- Smooth 60fps animations
- Minimal CPU usage during monitoring

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
