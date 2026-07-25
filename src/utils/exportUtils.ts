import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Site, User, LiveTracking, ArrivalAlert } from '../types/fsm';

export function exportFSMToExcel(
  sites: Site[],
  users: User[],
  liveTracking: Record<string, LiveTracking>,
  alerts: ArrivalAlert[]
) {
  // 1. Engineers Summary Sheet
  const engineerRows = users.map((u) => {
    const track = liveTracking[u.uid];
    return {
      'Engineer ID': u.engineerId,
      'Name': u.name,
      'Email': u.email,
      'Phone': u.phone,
      'Status': u.status.toUpperCase(),
      'Battery %': u.deviceInfo.batteryLevel,
      'Network': u.deviceInfo.networkStatus,
      'Live Speed (km/h)': track?.speedKmh || 0,
      'Travelled Dist (km)': track?.travelledDistanceKm || 0,
      'Current Latitude': track?.latitude || 'N/A',
      'Current Longitude': track?.longitude || 'N/A',
    };
  });

  // 2. Sites & Assignments Sheet
  const siteRows = sites.map((s) => ({
    'Site ID': s.siteId,
    'Client Name': s.clientName,
    'Address': s.location.address,
    'Assigned Engineer': s.assignedEngineerName,
    'Scheduled Date': s.scheduledDate,
    'Category': s.category.toUpperCase(),
    'Status': s.status.toUpperCase(),
    'Arrived At': s.arrivedAt ? new Date(s.arrivedAt).toLocaleString() : 'N/A',
    'Completed At': s.completedAt ? new Date(s.completedAt).toLocaleString() : 'N/A',
    'Work Summary': s.workSummary || s.notes || 'N/A',
  }));

  // 3. Geofence Alerts Audit Sheet
  const alertRows = alerts.map((a) => ({
    'Alert ID': a.alertId,
    'Engineer': a.engineerName,
    'Site Name': a.siteName,
    'Arrival Time': a.arrivalTime,
    'Geofence Status': a.locationStatus,
    'Timestamp': new Date(a.timestamp).toLocaleString(),
    'Read By Admin': a.isReadByAdmin ? 'YES' : 'NO',
  }));

  const wb = XLSX.utils.book_new();
  const engineerWS = XLSX.utils.json_to_sheet(engineerRows);
  const sitesWS = XLSX.utils.json_to_sheet(siteRows);
  const alertsWS = XLSX.utils.json_to_sheet(alertRows);

  XLSX.utils.book_append_sheet(wb, engineerWS, 'Live Engineers');
  XLSX.utils.book_append_sheet(wb, sitesWS, 'Field Sites');
  XLSX.utils.book_append_sheet(wb, alertsWS, 'Geofence Alerts');

  const fileName = `FSM_Telematics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// Specialized Individual Engineer Completed Sites Exporter
export function exportEngineerCompletedSitesToExcel(
  engineer: User,
  allSites: Site[]
): { success: boolean; count: number; fileName?: string } {
  // Filter ONLY completed sites assigned to this specific engineer
  const completedSites = allSites.filter((s) => {
    const isAssigned =
      s.assignedEngineerId === engineer.uid ||
      s.assignedEngineerId === engineer.engineerId ||
      s.assignedEngineerName.toLowerCase() === engineer.name.toLowerCase();

    return isAssigned && s.status === 'completed';
  });

  if (completedSites.length === 0) {
    return { success: false, count: 0 };
  }

  // Format rows with exact requested columns
  const rows = completedSites.map((site) => ({
    'Site ID': site.siteId,
    'Client Name': site.clientName,
    'Site Address': site.location.address,
    'Scheduled Date': site.scheduledDate,
    'Completion Date': site.completedAt ? new Date(site.completedAt).toLocaleString() : 'Completed',
    'Status': site.status.toUpperCase(),
    'Work Order Notes': site.workSummary || site.notes || 'N/A',
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Completed Sites');

  // Format file name: [Engineer_Name]_Completed_Sites_[YYYY-MM-DD].xlsx
  const formattedEngineerName = engineer.name.trim().replace(/\s+/g, '_');
  const currentDateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${formattedEngineerName}_Completed_Sites_${currentDateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
  return { success: true, count: completedSites.length, fileName };
}

export function exportFSMToPDF(
  sites: Site[],
  users: User[],
  title: string = 'Field Service & Telematics Summary Report'
) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42); // Dark Navy #0F172A
  doc.rect(0, 0, 210, 32, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 189, 248); // Cyan
  doc.setFontSize(18);
  doc.text('RAKHOH FIELD SERVICE MANAGEMENT', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.setFontSize(10);
  doc.text(`Report Generated: ${new Date().toLocaleString()} | User: Admin Dispatcher`, 14, 26);

  // Section Title
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text(title, 14, 42);

  // Engineers Summary Table
  doc.setFontSize(11);
  doc.text('1. Engineer Operational Status', 14, 50);

  const engineerHeaders = [['Engineer ID', 'Name', 'Phone', 'Status', 'Battery', 'Network']];
  const engineerBody = users.map((u) => [
    u.engineerId,
    u.name,
    u.phone,
    u.status.toUpperCase(),
    `${u.deviceInfo.batteryLevel}%`,
    u.deviceInfo.networkStatus,
  ]);

  autoTable(doc, {
    startY: 54,
    head: engineerHeaders,
    body: engineerBody,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [248, 250, 252], fontStyle: 'bold' },
    styles: { fontSize: 9 },
  });

  // Sites Table
  const finalY = ((doc as any).lastAutoTable?.finalY || 120) + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Field Assignments & Lifecycle Status', 14, finalY);

  const siteHeaders = [['Site ID', 'Client Name', 'Assigned Engineer', 'Scheduled', 'Category', 'Status']];
  const siteBody = sites.map((s) => [
    s.siteId,
    s.clientName,
    s.assignedEngineerName,
    s.scheduledDate,
    s.category.toUpperCase(),
    s.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: finalY + 4,
    head: siteHeaders,
    body: siteBody,
    theme: 'striped',
    headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5 },
  });

  doc.save(`FSM_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
