import type { ReactNode } from "preact/compat"
import type { SatLiveDetailTabs } from "../../types"

export const TabHeader = ({ tab, setTab, tabs }: { tab: SatLiveDetailTabs, setTab: (tab: SatLiveDetailTabs) => void, tabs: SatLiveDetailTabs[] }) => {
    return (
        <div className="tab-header">
            {tabs.map((t) => (
                <div key={t} className={`tab-button ${tab === t ? 'selected' : ''}`} onClick={() => setTab(t)}>{t}</div>
            ))}
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