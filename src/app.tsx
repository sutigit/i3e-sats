import './styles/app.scss'
import { TleProvider } from "./queries/TleQuery";
import SatTimetable from './components/SatTimetable';
import SatLiveDetail from './components/SatLiveDetail';
import { SatelliteProvider } from './context/SatelliteContext';
import SatMainView from './components/SatMainView';

export function App() {
  return (
    <main id="app">
      <TleProvider>
        <SatelliteProvider>
          <SatMainView />
          {/* <SatTimetable />
          <SatLiveDetail /> */}
        </SatelliteProvider>
      </TleProvider>
    </main>
  )
}
