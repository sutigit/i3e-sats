import "cesium/Build/Cesium/Widgets/widgets.css";
import './app.css'
import { useEffect, useRef } from 'preact/hooks';
import { cesiumView } from './lib/cesiumView';
import { TLEProvider } from "./queries/TLEQuery";

export function App() {
  const cesiumRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cesiumRef.current) return
    const viewer = cesiumView(cesiumRef)

    return () => {
      viewer.destroy()
    }
  }, [])

  return (
    <TLEProvider>
      <div ref={cesiumRef} id='cesium-view' />
    </TLEProvider>
  )
}
