import { memo } from "react";

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export function SidebarContent({ isCollapsed }: SidebarProps) {
    return (
        <div style={{ padding: '20px', color: 'white', background: '#1e1e2e', height: '100vh' }}>
            <h1>SIDEBAR</h1>
            <p>Status: {isCollapsed ? 'Collapsed' : 'Expanded'}</p>
        </div>
    );
}

function SidebarComponent({ isCollapsed, setIsCollapsed }: SidebarProps) {
    return <SidebarContent isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />;
}

export const Sidebar = memo(SidebarComponent);
