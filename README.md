# MarketStore - Electron POS System

A modern Point of Sale (POS) system built with Electron, React, and TypeScript. This application integrates with hardware devices like barcode scanners, scales, and printers through serial port communication.

## Features

- **Hardware Integration**: Serial port communication for barcode scanners, scales, and printers
- **Modern UI**: Built with React and TypeScript
- **Cross-platform**: Electron-based for Windows, macOS, and Linux
- **Database Integration**: Supabase backend integration
- **Real-time Data**: React Query for efficient data management

## Prerequisites

This project uses native modules (serialport) that require compilation. You need to set up your development environment properly before installation.

### Required Tools

1. **Node.js** (v18 or higher)
2. **Python** (v3.8 or higher) - Required for native module compilation
3. **Build Tools** - Required for compiling native modules

### Environment Setup

#### Windows

1. **Install Visual Studio with Required Components**:
   
   **Option A: Visual Studio Installer (Recommended)**
   - Download [Visual Studio Installer](https://visualstudio.microsoft.com/downloads/)
   - Install **Visual Studio Community/Professional/Enterprise**
   - During installation, select these workloads:
     - ✅ **Desktop development with C++**
   - In the individual components tab, ensure these are selected:
     - ✅ **Windows 10/11 SDK** (latest version)
     - ✅ **MSVC v143 - VS 2022 C++ x64/x86 build tools**
     - ✅ **MSBuild** (latest version)
     - ✅ **CMake tools for Visual Studio**
     - ✅ **Git for Windows**

   **Option B: Visual Studio Build Tools Only**
   - Download [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - During installation, select:
     - ✅ **C++ build tools**
     - ✅ **Windows 10/11 SDK** (latest version)
     - ✅ **MSVC v143 - VS 2022 C++ x64/x86 build tools**

2. **Install Python**:
   - Download [Python 3.8+](https://www.python.org/downloads/)
   - **Important**: Check "Add Python to PATH" during installation
   - Verify installation: `python --version`

3. **Set Environment Variables**:
   ```bash
   # Set Python path (adjust version as needed)
   set PYTHON=C:\Python39\python.exe
   set npm_config_python=C:\Python39\python.exe
   
   # Set MSBuild path (adjust version as needed)
   set npm_config_msvs_version=2022
   ```

4. **Verify Build Tools**:
   ```bash
   # Check if MSBuild is available
   where msbuild
   
   # Check if Windows SDK is available
   where cl
   ```

#### macOS

1. **Install Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```

2. **Install Python** (if not already installed):
   ```bash
   # Using Homebrew
   brew install python
   ```

#### Linux (Ubuntu/Debian)

1. **Install build essentials**:
   ```bash
   sudo apt-get update
   sudo apt-get install build-essential python3-dev
   ```

2. **Install additional dependencies**:
   ```bash
   sudo apt-get install libudev-dev
   ```

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd electron
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Rebuild native modules for Electron**:
   ```bash
   npm run rebuild
   ```

## Development

### Start Development Server

```bash
npm run dev
```

This will start:
- Vite development server for the React frontend
- Electron main process with hot reload

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the application
- `npm run build:electron` - Build Electron app
- `npm run build:linux` - Build Linux AppImage
- `npm run rebuild` - Rebuild native modules for Electron
- `npm run start:electron` - Start Electron app directly

## Hardware Integration

This application communicates with hardware devices through serial ports:

- **Barcode Scanners**: Read product barcodes
- **Scales**: Get weight measurements
- **Printers**: Print receipts and labels

### Serial Port Configuration

The application automatically detects available serial ports and provides a configuration interface for:
- Port selection
- Baud rate settings
- Data parsing options

## Building for Production

### Windows
```bash
npm run build:electron
```

### Linux
```bash
npm run build:linux
```

### macOS
```bash
npm run build:electron
```

## Troubleshooting

### Common Issues

1. **Serial Port Module Installation Fails**:
   - Ensure Python and build tools are properly installed
   - Run `npm run rebuild` after installing dependencies
   - Check that your Node.js version is compatible

2. **Windows Build Errors**:
   - **"MSBuild not found"**: Ensure Visual Studio with MSBuild is installed
   - **"Windows SDK not found"**: Install Windows 10/11 SDK through Visual Studio Installer
   - **"Python not found"**: Add Python to PATH or set `npm_config_python`
   - **"MSVC compiler not found"**: Install MSVC v143 build tools
   - **"node-gyp rebuild failed"**: Run as Administrator in Developer Command Prompt

3. **Permission Denied on Serial Ports**:
   - **Linux**: Add your user to the dialout group:
     ```bash
     sudo usermod -a -G dialout $USER
     ```
   - **Windows**: Run as Administrator or check device permissions
   - **macOS**: Grant necessary permissions in System Preferences

4. **Build Errors**:
   - Ensure all build tools are installed
   - Clear node_modules and reinstall:
     ```bash
     rm -rf node_modules package-lock.json
     npm install
     npm run rebuild
     ```

5. **Windows-Specific Solutions**:
   ```bash
   # Run in Developer Command Prompt for Visual Studio
   # Set environment variables
   set npm_config_python=C:\Python39\python.exe
   set npm_config_msvs_version=2022
   
   # Clear npm cache and rebuild
   npm cache clean --force
   npm install
   npm run rebuild
   ```

### Debug Mode

To run in debug mode:
```bash
DEBUG=* npm run dev
```

## Project Structure

```
electron/
├── electron/           # Electron main process
│   ├── main.ts        # Main process entry point
│   └── preload.ts     # Preload script
├── src/               # React frontend
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── service/       # API services
│   └── types/         # TypeScript type definitions
├── dist/              # Built frontend
├── dist-electron/     # Built Electron main process
└── release/           # Built applications
```

## Dependencies

### Main Dependencies
- **serialport**: Serial port communication
- **@supabase/supabase-js**: Database integration
- **@tanstack/react-query**: Data fetching and caching
- **react**: Frontend framework

### Development Dependencies
- **electron**: Desktop app framework
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **electron-builder**: Application packaging

## License

[Add your license information here]

## Support

For issues related to:
- **Hardware integration**: Check serial port permissions and device compatibility
- **Build issues**: Verify build tools and Python installation
- **General issues**: Check the troubleshooting section above