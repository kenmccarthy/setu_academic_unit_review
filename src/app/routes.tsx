import { Navigate, Route, Routes } from 'react-router-dom';
import { Overview } from '../features/dashboard/Overview';
import { GettingStarted } from '../features/setup/GettingStarted';
import { AreasIndex } from '../features/reflections/AreasIndex';
import { AreaPage } from '../features/reflections/AreaPage';
import { QuestionPage } from '../features/reflections/QuestionPage';
import { EvidenceRegister } from '../features/evidence/EvidenceRegister';
import { EngagementPage } from '../features/engagement/EngagementPage';
import { FindingsPage } from '../features/findings/FindingsPage';
import { SerBuilder } from '../features/ser/SerBuilder';
import { PeerReviewPrep } from '../features/peer/PeerReviewPrep';
import { QepPage } from '../features/enhancement/QepPage';
import { MonitoringPage } from '../features/monitoring/MonitoringPage';
import { ExportsPage } from '../features/exports/ExportsPage';
import { ReadinessReport } from '../features/exports/ReadinessReport';
import { HelpPage } from '../features/help/HelpPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Overview />} />
      <Route path="/getting-started" element={<GettingStarted />} />
      <Route path="/areas" element={<AreasIndex />} />
      <Route path="/areas/:areaId" element={<AreaPage />} />
      <Route path="/areas/:areaId/:questionId" element={<QuestionPage />} />
      <Route path="/evidence" element={<EvidenceRegister />} />
      <Route path="/engagement" element={<EngagementPage />} />
      <Route path="/findings" element={<FindingsPage />} />
      <Route path="/ser" element={<SerBuilder />} />
      <Route path="/peer-review" element={<PeerReviewPrep />} />
      <Route path="/qep" element={<QepPage />} />
      <Route path="/monitoring" element={<MonitoringPage />} />
      <Route path="/exports" element={<ExportsPage />} />
      <Route path="/readiness-report" element={<ReadinessReport />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
