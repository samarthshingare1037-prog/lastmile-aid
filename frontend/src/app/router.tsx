import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout, PublicLayout } from '@/app/layout';
import { RouteGuard, NotFoundPage } from '@/app/guards';

// Lazy-loaded pages
const LandingPage     = lazy(() => import('@/pages/landing'));
const LoginPage       = lazy(() => import('@/pages/login'));
const DonorDashboard  = lazy(() => import('@/pages/donor/dashboard'));
const DonationNew     = lazy(() => import('@/pages/donor/new'));
const DonationDetail  = lazy(() => import('@/pages/donor/detail'));
const RiderDashboard  = lazy(() => import('@/pages/rider/dashboard'));
const TaskBoard       = lazy(() => import('@/pages/tasks/board'));
const TaskDetail      = lazy(() => import('@/pages/tasks/detail'));
const MapPage         = lazy(() => import('@/pages/map'));
const NgoDirectory    = lazy(() => import('@/pages/ngos/directory'));
const SiteDashboard   = lazy(() => import('@/pages/site/dashboard'));
const OpenGatePage    = lazy(() => import('@/pages/open-gate'));
const HelperPage      = lazy(() => import('@/pages/helper'));
const CreditsPage     = lazy(() => import('@/pages/credits'));
const NotificationsPage = lazy(() => import('@/pages/notifications'));
const AdminConsole    = lazy(() => import('@/pages/admin/console'));
const AdminAudit      = lazy(() => import('@/pages/admin/audit'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
        <span className="text-sm text-[var(--color-muted)]">Loading…</span>
      </div>
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />
        </Route>

        {/* Authenticated routes */}
        <Route element={<AppLayout />}>
          {/* Donor */}
          <Route path="/donor" element={
            <RouteGuard allowedRoles={['DONOR', 'ADMIN']}><DonorDashboard /></RouteGuard>
          } />
          <Route path="/donations/new" element={
            <RouteGuard allowedRoles={['DONOR']}><DonationNew /></RouteGuard>
          } />
          <Route path="/donations/:id" element={
            <RouteGuard><DonationDetail /></RouteGuard>
          } />

          {/* Rider */}
          <Route path="/rider" element={
            <RouteGuard allowedRoles={['RIDER']}><RiderDashboard /></RouteGuard>
          } />
          <Route path="/tasks" element={
            <RouteGuard allowedRoles={['RIDER', 'HELPER', 'ADMIN']}><TaskBoard /></RouteGuard>
          } />
          <Route path="/tasks/:id" element={
            <RouteGuard><TaskDetail /></RouteGuard>
          } />

          {/* Map */}
          <Route path="/map" element={
            <RouteGuard><MapPage /></RouteGuard>
          } />

          {/* NGOs */}
          <Route path="/ngos" element={
            <RouteGuard><NgoDirectory /></RouteGuard>
          } />

          {/* Site */}
          <Route path="/site/:id" element={
            <RouteGuard allowedRoles={['NGO_OPERATOR', 'ADMIN']}><SiteDashboard /></RouteGuard>
          } />

          {/* Open Gate */}
          <Route path="/open-gate" element={
            <RouteGuard><OpenGatePage /></RouteGuard>
          } />

          {/* Helper */}
          <Route path="/helper" element={
            <RouteGuard allowedRoles={['HELPER']}><HelperPage /></RouteGuard>
          } />

          {/* Credits */}
          <Route path="/credits" element={
            <RouteGuard><CreditsPage /></RouteGuard>
          } />

          {/* Notifications */}
          <Route path="/notifications" element={
            <RouteGuard><NotificationsPage /></RouteGuard>
          } />

          {/* Admin */}
          <Route path="/admin/console" element={
            <RouteGuard allowedRoles={['ADMIN']}><AdminConsole /></RouteGuard>
          } />
          <Route path="/admin/audit" element={
            <RouteGuard allowedRoles={['ADMIN']}><AdminAudit /></RouteGuard>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
