import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Tetris from './pages/Tetris';
import Game2048 from './pages/Game2048';
import BrickBreaker from './pages/BrickBreaker';
import Snake from './pages/Snake';
import CarGame from './pages/CarGame';
import Galaxia from './pages/Galaxia';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tetris" element={<Tetris />} />
        <Route path="/2048" element={<Game2048 />} />
        <Route path="/brick-breaker" element={<BrickBreaker />} />
        <Route path="/snake" element={<Snake />} />
        <Route path="/car-dodge" element={<CarGame />} />
        <Route path="/galaxia" element={<Galaxia />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
