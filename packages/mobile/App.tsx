// ─── ICKAR Mobile — App Root ──────────────────────────────────────────────────
import { AuthProvider } from './src/context/AuthContext';
import { PlayerProvider } from './src/context/PlayerContext';
import { Navigation } from './src/Navigation';

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Navigation />
      </PlayerProvider>
    </AuthProvider>
  );
}
