import { lazy, Suspense } from "preact/compat";
import { LoadingAbsolute } from "./common/Loading";
const CesiumGlobeView = lazy(() => import("./CesiumGlobeView"))

export default function SatMainView() {
    return (
        <div id="sat-main-view">
            <Suspense fallback={<LoadingAbsolute />}>
                <CesiumGlobeView />
            </Suspense>
        </div>
    )
}
