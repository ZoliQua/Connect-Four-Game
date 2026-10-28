import { ArcadeShell } from './arcade';
import { ConnectFourGame } from './ConnectFourGame';

export default function App() {
  return (
    <ArcadeShell gameId="connect4">
      <ConnectFourGame />
    </ArcadeShell>
  );
}
