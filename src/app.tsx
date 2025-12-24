import './styles/app.scss'
import { TleProvider } from "./queries/TleQuery";
import CesiumView from "./components/CesiumView";
import SatList from './components/SatList';
import SatDetail from './components/SatDetail';
import { SatelliteProvider } from './context/ContextAPI';

export function App() {
  return (
    <main id="app">
      <TleProvider devTools={false}>
        <SatelliteProvider>
          <SatList />
          <SatDetail />
          <CesiumView />
        </SatelliteProvider>
      </TleProvider>
    </main>
  )
}
