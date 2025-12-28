import './styles/app.scss'
import { TleProvider } from "./queries/TleQuery";
import SatList from './components/SatList';
import SatDetail from './components/SatDetail';
import { SatelliteProvider } from './context/SatelliteContext';
import { lazy, Suspense } from 'preact/compat';
import { LoadingAbsolute } from './components/common/Loading';

const CesiumGlobeView = lazy(() => import("./components/CesiumGlobeView"))

export function App() {
  return (
    <main id="app">
      <TleProvider devTools={false}>
        <SatelliteProvider>
          <SatList />
          <SatDetail />
          <Suspense fallback={<LoadingAbsolute />}>
            <CesiumGlobeView showFPS />
          </Suspense>
        </SatelliteProvider>
      </TleProvider>
    </main>
  )
}
