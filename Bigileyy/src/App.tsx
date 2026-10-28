import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { BinProvider } from './contexts/BinContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { ToastContainer } from './components/common/ToastContainer';
import { IoTSimulatorModal } from './components/iot/IoTSimulatorModal';
import { HardwareGuideModal } from './components/iot/HardwareGuideModal';
import { Dashboard } from './pages/Dashboard';
import { BinManagement } from './pages/BinManagement';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { UserManagement } from './pages/UserManagement';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  if (!user) {
    return <LoginPage />;
  }

  const getPageInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Municipal Operations Overview',
          subtitle: 'Live commercial solid waste segregation & facility health'
        };
      case 'bins':
        return {
          title: 'Dynamic Dustbin Fleet Management',
          subtitle: 'Calibrate bin dimensions, waste streams, and associated ESP32 nodes'
        };
      case 'live':
        return {
          title: 'Live Ultrasonic IoT Telemetry',
          subtitle: 'Real-time distance and fill pulse stream'
        };
      case 'alerts':
        return {
          title: 'Incidents & Overflow Alerts',
          subtitle: 'Threshold warnings, silent node watchdogs, and staff resolution'
        };
      case 'analytics':
        return {
          title: 'Segregation Analytics & Audit Reports',
          subtitle: 'Data-driven recovery metrics and material diversion'
        };
      case 'collections':
        return {
          title: 'Municipal Collection Routing',
          subtitle: 'Compactor fleet dispatch and waste clearance manifests'
        };
      case 'users':
        return {
          title: 'Municipal Personnel & Roles',
          subtitle: 'Manage administrative and operational access'
        };
      case 'settings':
        return {
          title: 'Calibration & Alert Thresholds',
          subtitle: 'Tune municipal operational parameters and watchdogs'
        };
      default:
        return { title: 'Municipal Waste Portal', subtitle: '' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSimulator={() => setIsSimulatorOpen(true)}
        openHardwareGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-64 overflow-hidden">
        <TopNav
          title={title}
          subtitle={subtitle}
          onNavigateToAlerts={() => setActiveTab('alerts')}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigateTab={(tab) => setActiveTab(tab)}
              openSimulator={() => setIsSimulatorOpen(true)}
            />
          )}
          {activeTab === 'bins' && <BinManagement />}
          {activeTab === 'live' && (
            <LiveMonitoring openSimulator={() => setIsSimulatorOpen(true)} />
          )}
          {activeTab === 'alerts' && (
            <AlertsPage onNavigateToSettings={() => setActiveTab('settings')} />
          )}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'collections' && <CollectionsPage />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Modals & Live Toasts */}
      <ToastContainer />
      <IoTSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
      <HardwareGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BinProvider>
          <MainLayout />
        </BinProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
