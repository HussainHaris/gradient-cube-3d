# Gradient Cube 3D

A stunning interactive 3D cube visualization built with React, Three.js, and React Three Fiber. Features a 2x2x2 arrangement of 8 subcubes with different materials and effects.

![Gradient Cube 3D](https://via.placeholder.com/800x400/ff6ec7/ffffff?text=Gradient+Cube+3D)

## ✨ Features

### 🎲 **Multi-Cube Architecture**
- **8 Subcubes** arranged in a 2x2x2 formation
- **4 Different Cube Types**:
  - 25% **Gradient Cubes** - Custom gradient materials with your chosen colors
  - 25% **Opposite Cubes** - Inverted colors for striking contrast
  - 25% **Silver Mirror Cubes** - Highly reflective metallic surfaces
  - 25% **Glass Cubes** - Transparent with environmental reflections

### 🎨 **Advanced Visual Effects**
- **Per-Face Unique Gradients** - Each face has its own gradient pattern
- **3 Gradient Diffusion Types**:
  - Smooth Linear
  - Radial Burst
  - Sharp Non-linear
- **Real-time Gradient Controls**:
  - Sharpness (0.1-5.0)
  - Offset (-1 to 1)
  - Rotation (0-360°)

### 🌟 **Interactive Controls**
- **Mouse Drag Rotation** - Intuitive cube manipulation
- **Draggable Light Source** - Click to toggle follow mode
- **Dual Lighting Modes**:
  - Single draggable light
  - Quad fixed lights
- **Environment Presets** - 11 different HDR environments
- **Adjustable Grid Background** - Customizable square grid

### 🎛️ **Customization Options**
- **Cube Size Control** - Scale from 2x to 10x
- **Corner Radius** - Adjust cube roundness
- **Light Brightness** - Control lighting intensity
- **Separate Color Palettes**:
  - 3 cube gradient colors
  - 3 background gradient colors

## 🚀 Live Demo

[View Live Demo](https://gradient-cube-3d.vercel.app)

## 🛠️ Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Three.js** - 3D graphics
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Useful helpers for R3F
- **Vite** - Build tool
- **Vercel** - Deployment platform

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gradient-cube-3d.git
cd gradient-cube-3d

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Usage

1. **Rotate the Cube**: Click and drag on the canvas to rotate the entire cube cluster
2. **Control Lighting**: 
   - Toggle between single and quad light modes
   - Click the yellow light to toggle follow mode (turns red when following mouse)
3. **Adjust Gradients**: Use the gradient controls to modify appearance in real-time
4. **Customize Colors**: Use the color pickers to change cube and background colors
5. **Environment**: Select from various HDR environments for realistic reflections

## 🏗️ Architecture

### Component Structure
```
App
├── Scene
│   ├── GridBackground
│   ├── CubeCluster
│   │   └── SubCube (×8)
│   ├── DraggableLight / QuadLights
│   └── DragAreaIndicator
└── Controls UI
```

### Cube Types
- **Gradient**: Custom shader with per-face gradients
- **Opposite**: Inverted colors using RGB inversion
- **Silver**: Metallic gradient with high reflectivity
- **Glass**: Transparent with environmental reflections

## 🎨 Shader System

The project uses custom GLSL shaders for advanced gradient effects:
- Per-face gradient calculation
- Unique face seeds for variation
- UV-based rotation and transformation
- Multiple diffusion algorithms

## 🚀 Deployment

The project is configured for easy deployment on Vercel:

```bash
# Deploy to Vercel
vercel --prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Three.js community for excellent documentation
- React Three Fiber team for the amazing React integration
- Vercel for seamless deployment platform

## 📊 Performance

- Optimized shader compilation
- Efficient geometry instancing
- Responsive design for all screen sizes
- Smooth 60fps animations

---

**Built with ❤️ using React, Three.js, and modern web technologies**
