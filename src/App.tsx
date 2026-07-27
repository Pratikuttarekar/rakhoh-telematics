import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { fsmStore } from './services/store';
import { User, Site, LiveTracking, ArrivalAlert, Report, ViewMode } from './types/fsm';
import { HeaderNav } from './components/layout/HeaderNav';
import { GlobalMapCanvas } from './components/admin/GlobalMapCanvas';
import { SidebarFilter } from './components/admin/SidebarFilter';
import { TelematicsOverlay } from './components/admin/TelematicsOverlay';
import { DispatchModal } from './components/admin/DispatchModal';
import { ArrivalAlertsModal } from './components/admin/ArrivalAlertsModal';
import { ReportModal } from './components/admin/ReportModal';
import { AddEngineerModal } from './components/admin/AddEngineerModal';
import { MobileContainer } from './components/engineer/MobileContainer';
import { LoginPage } from './components/auth/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/auth/ErrorBoundary';
import { HistoricalLogsModal } from './components/admin/HistoricalLogsModal';
import { ManageDispatchesModal } from './components/admin/ManageDispatchesModal';
import { UserManagementModal } from './components/admin/UserManagementModal';

function MainAppLayout({ initialViewMode }: { initialViewMode: ViewMode }) {
  const { authRole, authEmail, currentUserDoc, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>(fsmStore.getUsers());
  const [sites, setSites] = useState<Site[]>(fsmStore.getSites());
  const [liveTracking, setLiveTracking] = useState<Record<string, LiveTracking>>(fsmStore.getLiveTracking());
  const [arrivalAlerts, setArrivalAlerts] = useState<ArrivalAlert[]>(fsmStore.getArrivalAlerts());
  const [reports, setReports] = useState<Report[]>(fsmStore.getReports());

  const [viewMode, setViewModeState] = useState<ViewMode>(initialViewMode);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | null>(fsmStore.getSelectedEngineerId());
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(fsmStore.getSelectedSiteId());
  const [filterStatus, setFilterStatus] = useState(fsmStore.getFilterStatus());
  const [searchQuery, setSearchQuery] = useState(fsmStore.getSearchQuery());
  const [isSimulating, setIsSimulating] = useState(fsmStore.getIsSimulatingMotion());

  // Modals state
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAddEngineerOpen, setIsAddEngineerOpen] = useState(false);
  const [isHistoricalLogsOpen, setIsHistoricalLogsOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [managingEngineerUser, setManagingEngineerUser] = useState<User | null>(null);

  useEffect(() => {
    setViewModeState(initialViewMode);
  }, [initialViewMode]);

  // Subscribe to central store updates
  useEffect(() => {
    const unsubscribe = fsmStore.subscribe(() => {
      setUsers([...fsmStore.getUsers()]);
      setSites([...fsmStore.getSites()]);
      setLiveTracking({ ...fsmStore.getLiveTracking() });
      setArrivalAlerts([...fsmStore.getArrivalAlerts()]);
      setReports([...fsmStore.getReports()]);
      setSelectedEngineerId(fsmStore.getSelectedEngineerId());
      setSelectedSiteId(fsmStore.getSelectedSiteId());
      setFilterStatus(fsmStore.getFilterStatus());
      setSearchQuery(fsmStore.getSearchQuery());
      setIsSimulating(fsmStore.getIsSimulatingMotion());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleChangeViewMode = (mode: ViewMode) => {
    fsmStore.setViewMode(mode);
    setViewModeState(mode);
    if (mode === 'admin') navigate('/admin/dashboard');
    else if (mode === 'engineer') navigate('/engineer/dashboard');
    else if (mode === 'split') navigate('/split');
  };

  const handleLogoutAction = () => {
    logout();
    navigate('/login');
  };

  const fallbackUser: User = {
    uid: 'ENG_178',
    engineerId: '178',
    name: 'Prathamesh Patil',
    email: authEmail || 'prathamesh@rakhoh.com',
    phone: '+919876543210',
    role: 'engineer',
    status: 'online',
    currentSiteId: 'SITE_1001',
    deviceInfo: {
      batteryLevel: 85,
      isCharging: false,
      networkStatus: '4G',
      appVersion: '1.0.4',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Selected engineer for Admin map inspector
  const selectedUser = users.find((u) => u.uid === selectedEngineerId) || users[0] || fallbackUser;
  const selectedTrack = selectedUser ? liveTracking[selectedUser.uid] : null;
  const assignedSite = sites.find((s) => s.siteId === (selectedUser?.currentSiteId || 'SITE_1001'));
  const unreadAlertCount = arrivalAlerts.filter((a) => !a.isReadByAdmin).length;

  // Dynamically resolve currently authenticated engineer user for Mobile Duty View
  const currentAuthEngineer = currentUserDoc || users.find((u) => u.email.toLowerCase().trim() === (authEmail || '').toLowerCase().trim()) || selectedUser;

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden">
      {/* Top Header Navigation */}
      <HeaderNav
        viewMode={viewMode}
        onChangeViewMode={handleChangeViewMode}
        isSimulating={isSimulating}
        onToggleSimulation={() => fsmStore.toggleMotionSimulation()}
        onResetSimulation={() => fsmStore.resetSimulation()}
        currentRole={authRole}
        currentEmail={authEmail}
        onLogout={handleLogoutAction}
        onOpenAddEngineer={authRole === 'admin' ? () => setIsAddEngineerOpen(true) : undefined}
        onOpenHistoricalLogs={authRole === 'admin' ? () => setIsHistoricalLogsOpen(true) : undefined}
        onOpenUserManagement={authRole === 'admin' ? () => setIsUserManagementOpen(true) : undefined}
      />

      {/* Main View Area */}
      <main className="flex-1 flex p-2 sm:p-4 gap-4 overflow-y-auto lg:overflow-hidden relative">
        {/* Admin Dashboard View */}
        {viewMode === 'admin' && (
          <div className="w-full h-full flex flex-col lg:flex-row gap-4 min-h-screen lg:min-h-0">
            <SidebarFilter
              users={users}
              sites={sites}
              liveTracking={liveTracking}
              selectedEngineerId={selectedEngineerId}
              filterStatus={filterStatus}
              searchQuery={searchQuery}
              onSelectEngineer={(id) => fsmStore.setSelectedEngineerId(id)}
              onFilterChange={(status) => fsmStore.setFilterStatus(status)}
              onSearchChange={(q) => fsmStore.setSearchQuery(q)}
              onOpenDispatch={() => setIsDispatchOpen(true)}
              onOpenReport={() => setIsReportOpen(true)}
              onOpenAddEngineer={() => setIsAddEngineerOpen(true)}
              onOpenHistoricalLogs={() => setIsHistoricalLogsOpen(true)}
              onOpenUserManagement={() => setIsUserManagementOpen(true)}
              unreadAlertCount={unreadAlertCount}
              onOpenAlerts={() => setIsAlertsOpen(true)}
            />

            <div className="flex-1 h-[450px] lg:h-full relative min-h-[400px]">
              <GlobalMapCanvas
                users={users}
                sites={sites}
                liveTracking={liveTracking}
                selectedEngineerId={selectedEngineerId}
                onSelectEngineer={(id) => fsmStore.setSelectedEngineerId(id)}
                onSelectSite={(id) => fsmStore.setSelectedSiteId(id)}
              />

              {selectedUser && (
                <TelematicsOverlay
                  user={selectedUser}
                  track={selectedTrack}
                  assignedSite={assignedSite || null}
                  isSimulating={isSimulating}
                  onToggleSimulation={() => fsmStore.toggleMotionSimulation()}
                  onResetSimulation={() => fsmStore.resetSimulation()}
                  onOpenManageDispatches={(engUser) => setManagingEngineerUser(engUser)}
                  onClose={() => fsmStore.setSelectedEngineerId(null)}
                />
              )}
            </div>
          </div>
        )}

        {/* Engineer Mobile View Only */}
        {viewMode === 'engineer' && (
          <div className="w-full h-full flex items-center justify-center py-4 overflow-y-auto">
            <MobileContainer
              currentUser={currentAuthEngineer}
              sites={sites}
              liveTracking={liveTracking}
              isSimulating={isSimulating}
              onToggleSimulation={() => fsmStore.toggleMotionSimulation()}
              onArrivedAtSite={(siteId) => fsmStore.updateSiteStatus(siteId, 'working')}
              onCompleteJob={(siteId, notes, sig) => fsmStore.updateSiteStatus(siteId, 'completed', notes, sig)}
            />
          </div>
        )}

        {/* Dual Split View */}
        {viewMode === 'split' && (
          <div className="w-full h-full flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-2/3 h-full flex flex-col lg:flex-row gap-3">
              <SidebarFilter
                users={users}
                sites={sites}
                liveTracking={liveTracking}
                selectedEngineerId={selectedEngineerId}
                filterStatus={filterStatus}
                searchQuery={searchQuery}
                onSelectEngineer={(id) => fsmStore.setSelectedEngineerId(id)}
                onFilterChange={(status) => fsmStore.setFilterStatus(status)}
                onSearchChange={(q) => fsmStore.setSearchQuery(q)}
                onOpenDispatch={() => setIsDispatchOpen(true)}
                onOpenReport={() => setIsReportOpen(true)}
                onOpenAddEngineer={() => setIsAddEngineerOpen(true)}
                onOpenHistoricalLogs={() => setIsHistoricalLogsOpen(true)}
                onOpenUserManagement={() => setIsUserManagementOpen(true)}
                unreadAlertCount={unreadAlertCount}
                onOpenAlerts={() => setIsAlertsOpen(true)}
              />

              <div className="flex-1 h-[400px] lg:h-full relative">
                <GlobalMapCanvas
                  users={users}
                  sites={sites}
                  liveTracking={liveTracking}
                  selectedEngineerId={selectedEngineerId}
                  onSelectEngineer={(id) => fsmStore.setSelectedEngineerId(id)}
                  onSelectSite={(id) => fsmStore.setSelectedSiteId(id)}
                />

                {selectedUser && (
                  <TelematicsOverlay
                    user={selectedUser}
                    track={selectedTrack}
                    assignedSite={assignedSite || null}
                    isSimulating={isSimulating}
                    onToggleSimulation={() => fsmStore.toggleMotionSimulation()}
                    onResetSimulation={() => fsmStore.resetSimulation()}
                    onOpenManageDispatches={(engUser) => setManagingEngineerUser(engUser)}
                    onClose={() => fsmStore.setSelectedEngineerId(null)}
                  />
                )}
              </div>
            </div>

            <div className="w-full lg:w-1/3 h-[600px] lg:h-full glass-panel rounded-2xl p-4 border border-slate-800 flex items-center justify-center overflow-hidden">
              <MobileContainer
                currentUser={selectedUser}
                sites={sites}
                liveTracking={liveTracking}
                isSimulating={isSimulating}
                onToggleSimulation={() => fsmStore.toggleMotionSimulation()}
                onArrivedAtSite={(siteId) => fsmStore.updateSiteStatus(siteId, 'working')}
                onCompleteJob={(siteId, notes, sig) => fsmStore.updateSiteStatus(siteId, 'completed', notes, sig)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <DispatchModal
        users={users.length > 0 ? users : [fallbackUser]}
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        onSubmit={(newSite) => fsmStore.createSite(newSite)}
      />

      <ArrivalAlertsModal
        alerts={arrivalAlerts}
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        onMarkRead={(alertId) => fsmStore.markAlertAsRead(alertId)}
      />

      <ReportModal
        sites={sites}
        users={users}
        liveTracking={liveTracking}
        alerts={arrivalAlerts}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onAddReport={(type, title) => fsmStore.addReport({ generatedBy: 'ADM_001', type, title, fileUrl: '#', totalRecords: sites.length })}
      />

      <AddEngineerModal
        isOpen={isAddEngineerOpen}
        onClose={() => setIsAddEngineerOpen(false)}
        existingUsersCount={users.length}
        onEngineerAdded={(newEng) => {
          setUsers((prev) => [newEng, ...prev]);
        }}
      />

      <HistoricalLogsModal
        sites={sites}
        users={users}
        isOpen={isHistoricalLogsOpen}
        onClose={() => setIsHistoricalLogsOpen(false)}
      />

      <UserManagementModal
        users={users}
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        onOpenAddUser={() => setIsAddEngineerOpen(true)}
      />

      <ManageDispatchesModal
        engineerUser={managingEngineerUser}
        sites={sites}
        users={users}
        isOpen={Boolean(managingEngineerUser)}
        onClose={() => setManagingEngineerUser(null)}
        onOpenNewDispatch={(engUid) => {
          if (engUid) fsmStore.setSelectedEngineerId(engUid);
          setIsDispatchOpen(true);
        }}
      />
    </div>
  );
}

function RootRedirect() {
  const { authRole } = useAuth();
  if (!authRole) return <Navigate to="/login" replace />;
  if (authRole === 'engineer') return <Navigate to="/engineer/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Admin Dashboard Protected Route */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainAppLayout initialViewMode="admin" />
                </ProtectedRoute>
              }
            />

            {/* Engineer Dashboard Protected Route */}
            <Route
              path="/engineer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['engineer', 'admin']}>
                  <MainAppLayout initialViewMode="engineer" />
                </ProtectedRoute>
              }
            />

            {/* Dual Split View Protected Route */}
            <Route
              path="/split"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MainAppLayout initialViewMode="split" />
                </ProtectedRoute>
              }
            />

            {/* Default Root Redirect */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
