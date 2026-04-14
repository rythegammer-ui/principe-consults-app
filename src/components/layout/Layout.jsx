import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import TopBar from './TopBar';
import { useIsMobile } from '../../utils/hooks';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/lead-gen': 'Lead Generator',
  '/outreach': 'AI Outreach',
  '/pipeline': 'Pipeline',
  '/calls': 'Call Tracker',
  '/revenue': 'Revenue & Payments',
  '/payouts': 'Payouts',
  '/scripts': 'My Scripts',
  '/playbook': 'Playbook',
  '/team': 'Team Management',
  '/activity': 'Activity Log',
  '/settings': 'Settings',
};

export default function Layout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Dashboard';
  const isMobile = useIsMobile();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {!isMobile && <Sidebar />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title={title} />
        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px', background: 'var(--bg)' }}>
          <Outlet />
          {isMobile && <div className="mobile-bottom-spacer" />}
        </main>
      </div>
      {isMobile && <MobileNav />}
    </div>
  );
}
