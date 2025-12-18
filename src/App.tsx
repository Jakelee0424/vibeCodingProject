import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Tetris from './pages/Tetris';
import Game2048 from './pages/Game2048';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tetris" element={<Tetris />} />
        <Route path="/2048" element={<Game2048 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
