import type { ReactNode } from "preact/compat"

export const TabHeader = ({ tab, setTab, tabs }: { tab: number, setTab: (tab: number) => void, tabs: string[] }) => {
    return (
        <div className="tab-header">
            {tabs.map((t, i) => (
                <div key={t} className={`tab-button ${tab === i ? 'selected' : ''}`} onClick={() => setTab(i)}>{t}</div>
            ))}
            <div className="background-piece" />
        </div>
    )
}

export const TabBody = ({ tab, tabs, children, }: { tab: number, tabs: string[], children: ReactNode }) => {
    return (
        <div className={`tab-body ${tab === 0 ? 'round-right' : tab === tabs.length - 1 ? 'round-left' : ''}`}>
            {children}
        </div>
    )
}


export const TabContent = ({ active, children }: { active: boolean; children: any }) => (
    <div style={{ display: active ? 'block' : 'none', height: '100%' }}>
        {children}
    </div>
);