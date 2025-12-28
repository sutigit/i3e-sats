import type { ReactNode } from "preact/compat"
import type { SatLiveDetailTabs } from "../../types"

const TAB_ORDER: SatLiveDetailTabs[] = ["LIVE", "LP1", "LP2", "LP3", "LP4", "LP5"];

export const TabHeader = ({
    tab,
    setTab,
    tabs
}: {
    tab: SatLiveDetailTabs,
    setTab: (tab: SatLiveDetailTabs) => void,
    tabs: Record<SatLiveDetailTabs, boolean>
}) => {
    return (
        <div className="tab-header">
            {TAB_ORDER.map((t) => {
                const isEnabled = tabs[t];
                return (
                    <div
                        key={t}
                        className={`tab-button ${tab === t ? 'selected' : ''} ${!isEnabled ? 'disabled' : ''}`}
                        onClick={() => isEnabled && setTab(t)}
                    >
                        {t}
                    </div>
                );
            })}
            <div className="background-piece" />
        </div>
    )
}

export const TabBody = ({ tab, children, }: { tab: SatLiveDetailTabs, children: ReactNode }) => {
    return (
        <div className={`tab-body ${tab === "LIVE" ? 'round-right' : tab === "LP5" ? 'round-left' : ''}`}>
            {children}
        </div>
    )
}


export const TabContent = ({ active, children }: { active: boolean; children: any }) => (
    <div style={{ display: active ? 'block' : 'none', height: '100%' }}>
        {children}
    </div>
);