import './app.css'
import { TleProvider } from "./queries/TleQuery";
import CesiumView from "./components/CesiumView";

export function App() {
  return (
    <TleProvider debug={false}>
      <CesiumView />
    </TleProvider>
  )
}
