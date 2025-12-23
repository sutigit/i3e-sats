import './styles/app.scss'
import { TleProvider } from "./queries/TleQuery";
import CesiumView from "./components/CesiumView";
import SatList from './components/SatList';
import SatDetail from './components/SatDetail';

export function App() {
  return (
    <main id="app">
      <TleProvider devTools={false}>
        <SatList />
        <SatDetail />
        <CesiumView />
      </TleProvider>
    </main>
  )
}
