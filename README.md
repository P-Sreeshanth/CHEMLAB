# Chemistry Lab Simulator

An interactive web-based chemistry laboratory simulation platform with AR/VR capabilities, designed for educational purposes.

## Features

- Interactive 3D experiment simulations
- Real-time data visualization
- Faculty dashboard for experiment management
- Student dashboard for experiment access
- Temperature-controlled reaction simulations
- Real-time data plotting
- AR/VR support for immersive learning

## Technology Stack

- Frontend:
  - React.js
  - Material-UI
  - Three.js for 3D visualization
  - Chart.js for data visualization
  - React Three Fiber for 3D rendering

- Backend:
  - Node.js
  - Express.js
  - SQLite for data storage
  - Socket.IO for real-time communication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chemistry-lab-simulator.git
cd chemistry-lab-simulator
```

2. Install server dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
```

4. Create a .env file in the root directory:
```
PORT=5000
JWT_SECRET=your_jwt_secret
```

5. Start the development servers:

In the root directory:
```bash
npm run dev:full
```

This will start both the backend server and the React development server.

## Usage

1. Access the application at `http://localhost:3000`
2. Register as a faculty member or student
3. Faculty can create and manage experiments
4. Students can access and perform experiments
5. Use the 3D interface to interact with the virtual lab equipment
6. Record and analyze experimental data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js community for 3D visualization support
- Material-UI for the component library
- React community for the amazing framework 