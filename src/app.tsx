import './app.css'
import { TleProvider } from "./queries/TleQuery";
import CesiumView from "./components/CesiumView";

export function App() {
  return (
    <TleProvider devTools={false}>
      <CesiumView />
    </TleProvider>
  )
}
