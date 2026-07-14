import React, { useEffect, useState } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import HomePage from './staticPages/HomePage/HomePage';
import LoginPageV2 from './pages/Auth/LoginV2/LoginPageV2';
import Setting from './pages/Project/Setting/Setting';
import LabelsSettings from './pages/Project/Setting/LabelsSettings/LabelsSettings';
import StatusesSettings from './pages/Project/Setting/StatusesSettings/StatusesSettings';
import PrivacyStatementPage from './staticPages/PrivacyStatementPage/PrivacyStatementPage';
import UserPage from './pages/Global/UserPage/UserPage';
import UserMePage from './pages/Global/UserMePage/UserMePage';
import ErrorPage from './pages/ErrorPage/ErrorPage';
import AccessPage from './pages/AccessPage/AccessPage';
import ProjectPage from './pages/ProjectPage/ProjectPage';
import AccountSettingsPage from './pages/AccountSettingPage/AccountSettingPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage/ResetPasswordPage';
import ChangePasswordPage from './staticPages/ChangePasswordPage/ChangePasswordPage';
import BoardPage from './pages/Project/BoardPage/BoardPage';
import AboutPage from './staticPages/AboutPage/AboutPage';
import KanbanBoardPage from './staticPages/KanbanBoardPage/KanbanBoardPage';
import './App.css';
import { UserProvider } from './context/UserInfoProvider';
import ProjectMembersPage from './pages/Project/ProjectMembersPage/ProjectMembersPage';
import RolePage from './pages/Project/RolePage/RolePage';
import UnauthorizePage from './pages/Auth/UnauthorizePage/UnauthorizePage';
import FAQPage from './staticPages/FAQPage/FAQPage';
import AuthenticationRoute from './customRoutes/AuthenticationRoute';
import SecurityPage from './staticPages/SecurityPage/SecurityPage';
import AboutPageT2 from './staticPages/AboutPageT2/AboutPageT2';
import AboutPageT3 from './staticPages/AboutPageT3/AboutPageT3';
import { getDomainExists, getDomains } from './api/domain/domain';
import BacklogPage from './pages/BacklogPage/BacklogPage';
import ShortcutPage from './pages/Project/ShortcutPage/ShortcutPage';
import DashboardLayout from './lib/Layout/DashboardLayout/DashboardLayout';
import PricePage from './staticPages/PricePage/PricePage';
import MyWorkPage from './staticPages/MyWorkPage/MyWorkPage';
import ReportPage from './staticPages/ReportPage/ReportPage';
import RegisterPageV2 from './pages/Auth/RegisterV2/RegisterPageV2';
import VerifyPageV2 from './pages/Auth/VerifyPageV2/VerifyPageV2';
import DashBoardPage from './pages/Project/DashboardPage/DashBoardPage';
import DomainFailPage from './pages/Global/DomainFailPage/DomainFailPage';
import config from './config/config';
import CareerPage from './staticPages/CareerPage/CareerPage';
import ContactPage from './staticPages/ContactPage/ContactPage';
import CookiePolicyPage from './staticPages/CookiePolicyPage/CookiePolicyPage';
import RefundPolicyPage from './staticPages/RefundPolicyPage/RefundPolicyPage';
import SupportCenterPage from './staticPages/SupportCenterPage/SupportCenterPage';
import TermsOfServicePage from './staticPages/TermsOfServicePage/TermsOfServicesPage';
import GdprPage from './staticPages/GDPRPage/GDPRPage';
import PrivacyPolicy from './staticPages/PrivacyPolicyPage/PrivacyPolicyPage';
import ModalProvider from './context/ModalProvider';
import RetroPage from './pages/Project/RetroPage/RetroPage';
import { ProjectDetailsProvider } from './context/ProjectDetailsProvider';
import CreateStripeCheckoutSession from './pages/Payment/CreateStripeCheckoutSession/CreateStripeCheckoutSession';
import SubscriptionSuccessPage from './pages/Payment/SubscriptionSuccessPage/SubscriptionSuccessPage';
import EpicPage from './pages/Project/EpicPage/EpicPage';
import { LoadingProvider } from './components/Loading/GlobalLoading';
import PlanningPage from './pages/Project/PlanningPage/PlanningPage';
import QuestionsPage from './pages/Project/QuestionsPage/QuestionsPage';
import POReplyPage from './pages/Project/POReplyPage/POReplyPage';
import TopNavBar from './components/Navigations/TopNavBar/TopNavBar';
import MainMenuV2 from './components/Navigations/MainMenuV2';
import PromptsPage from './staticPages/PromptsPage/PromptsPage';

function App() {
  const [isRootDomain, setIsRootDomain] = useState<any>(null);
  const [isValidDomain, setValidDomain] = useState(null);

  useEffect(() => {
    if (config.isCI) {
      setIsRootDomain(true);
      return;
    }
    const getD = async () => {
      const res = await getDomains();
      setIsRootDomain(res.data);
    };
    const getDomainValid = async () => {
      const res = await getDomainExists();
      setValidDomain(res.data);
    };
    getD();
    getDomainValid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRootPage = () => {
    if (!isRootDomain) {
      return <LoginPageV2 />;
    }
    return <HomePage />;
  };
  if (!config.isCI) {
    if (isValidDomain === null || isRootDomain === null) {
      return <>Loading..</>;
    }

    if (!isValidDomain) {
      return (
        <Routes>
          <Route path="*" element={<DomainFailPage />} />;
        </Routes>
      );
    }
  }
  return (
    <>
      <ToastContainer style={{ width: '400px' }} />
      <UserProvider>
        <TopNavBar />
        <MainMenuV2 />
        <LoadingProvider>
          <div style={{ marginTop: '57px' }}>
            <Routes>
              <Route
                path=""
                element={
                  <ProjectDetailsProvider>
                    <ModalProvider>
                      <Outlet />
                    </ModalProvider>
                  </ProjectDetailsProvider>
                }
              >
                {isRootDomain && <Route path="register" element={<RegisterPageV2 />} />}
                <Route path="/faq" element={<FAQPage />} />
                {/* active new user TODO: fix */}
                <Route path="/verify" element={<VerifyPageV2 />} />
                {/* confirm existing user */}
                {/*  <Route path="/user-confirm" element={<VerifyPageV2 />} />  */}
                <Route
                  path="login"
                  element={<LoginPageV2 isRootDomain={isRootDomain || false} />}
                />
                <Route path="/" element={getRootPage()} />
                <Route path="/login/reset-password" element={<ResetPasswordPage />} />
                <Route path="/features/report" element={<ReportPage />} />
                <Route path="/login/change-password" element={<ChangePasswordPage />} />
                <Route path="/cookie-policy" element={<CookiePolicyPage />} />
                <Route path="/gdpr" element={<GdprPage />} />
                <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                <Route path="/privacy-statement" element={<PrivacyStatementPage />} />
                <Route path="/refund-policy" element={<RefundPolicyPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/about-t2" element={<AboutPageT2 />} />
                <Route path="/about-t3" element={<AboutPageT3 />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/careers" element={<CareerPage />} />
                <Route path="/security-page" element={<SecurityPage />} />
                <Route path="/errorPage" element={<ErrorPage />} />
                <Route path="/features/my-work" element={<MyWorkPage />} />
                <Route path="/unauthorize" element={<UnauthorizePage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/price" element={<PricePage />} />
                <Route path="/checkout" element={<CreateStripeCheckoutSession />} />
                <Route path="/features/kanban-board" element={<KanbanBoardPage />} />
                <Route path="/support-center" element={<SupportCenterPage />} />
                <Route path="" element={<AuthenticationRoute />}>
                  <Route path="/projects/:projectId/questions/po-reply" element={<POReplyPage />} />
                  <Route path="/prompts" element={<PromptsPage />} />
                  <Route path="/projects/:projectId/" element={<DashboardLayout />}>
                    <Route path="board" element={<BoardPage />} />
                    <Route path="backlog" element={<BacklogPage />} />
                    <Route path="shortcuts" element={<ShortcutPage />} />
                    <Route path="dashboard" element={<DashBoardPage />} />
                    <Route path="members" element={<ProjectMembersPage />} />
                    <Route path="retro" element={<RetroPage />} />
                    <Route path="epic" element={<EpicPage />} />
                    <Route path="planning" element={<PlanningPage />} />
                    <Route path="questions" element={<QuestionsPage />} />
                    <Route path="settings/labels" element={<LabelsSettings />} />
                    <Route path="settings/statuses" element={<StatusesSettings />} />
                    <Route path="settings" element={<Setting />} />
                  </Route>
                  <Route path="/payment/success" element={<SubscriptionSuccessPage />} />
                  <Route path="/me" element={<UserMePage />} />
                  <Route path="/user/:id" element={<UserPage />} />
                  <Route path="/access" element={<AccessPage />} />
                  <Route path="/projects" element={<ProjectPage />} />
                  <Route path="/account-settings" element={<AccountSettingsPage />} />
                  <Route
                    path="/account-settings/change-password"
                    element={<AccountSettingsPage />}
                  />
                  <Route
                    path="/account-settings/delete-account"
                    element={<AccountSettingsPage />}
                  />
                  <Route path="/projects/:projectId/roles" element={<RolePage />} />
                </Route>
                <Route path="*" element={<ErrorPage />} />
              </Route>
            </Routes>
          </div>
        </LoadingProvider>
      </UserProvider>
    </>
  );
}
export default App;
