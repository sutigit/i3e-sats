import './styles/app.scss'
import { TleProvider } from "./queries/TleQuery";
import SatTimetable from './components/SatTimetable';
import SatLiveDetail from './components/SatLiveDetail';
import { SatelliteProvider } from './context/SatelliteContext';
import { lazy, Suspense } from 'preact/compat';
import { LoadingAbsolute } from './components/common/Loading';

const CesiumGlobeView = lazy(() => import("./components/CesiumGlobeView"))

export function App() {
  return (
    <main id="app">
      <TleProvider devTools={false}>
        <SatelliteProvider>
          <SatTimetable />
          <SatLiveDetail />
          <Suspense fallback={<LoadingAbsolute />}>
            <CesiumGlobeView showFPS />
          </Suspense>
        </SatelliteProvider>
      </TleProvider>
    </main>
  )
}
