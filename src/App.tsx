import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Tetris from './pages/Tetris';
import Game2048 from './pages/Game2048';
import BrickBreaker from './pages/BrickBreaker';
import Snake from './pages/Snake';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tetris" element={<Tetris />} />
        <Route path="/2048" element={<Game2048 />} />
        <Route path="/brick-breaker" element={<BrickBreaker />} />
        <Route path="/snake" element={<Snake />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
