
import AnalyticsService from '../services/analyticsService';
import AnalyticsModel from '../models/analyticsModel';
import { Logger } from '../../../packages/shared-logger/src/logger';

// Get dashboard overview
export const getDashboard = async (req: any, res: any): Promise<void> => {
  const { startDate, endDate } = req.query;
  const tenantId = (req as any).tenant?.id || 'default';

  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const dashboardData = await AnalyticsService.getDashboardData(tenantId, start, end);

  res.status(200).json({
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: dashboardData,
    period: { startDate: start, endDate: end }
  });
};

// Get monthly analytics
export const getMonthlyAnalytics = async (req: any, res: any): Promise<void> => {
  const { month, year } = req.query;
  const tenantId = (req as any).tenant?.id || 'default';

  const currentDate = new Date();
  const currentMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
  const currentYear = year ? parseInt(year) : currentDate.getFullYear();

  const monthlyData = await AnalyticsService.calculateMonthlyStats(tenantId, currentMonth, currentYear);
  const monthlyTrends = await AnalyticsService.getMonthlyTrends(tenantId, currentYear);

  // Ensure trends is always an array to prevent frontend chart crashes
  const safeTrends = Array.isArray(monthlyTrends) ? monthlyTrends : [];

  res.status(200).json({
    success: true,
    message: 'Monthly analytics retrieved successfully',
    data: {
      summary: monthlyData || {},
      trends: safeTrends,
      month: currentMonth,
      year: currentYear
    }
  });
};

// Get yearly analytics
export const getYearlyAnalytics = async (req: any, res: any): Promise<void> => {
  const { year } = req.query;
  const tenantId = (req as any).tenant?.id || 'default';

  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const yearlyData = await AnalyticsService.calculateYearlyStats(tenantId, currentYear);

  // Ensure monthlyBreakdown is always an array to prevent frontend chart crashes
  const safeMonthlyBreakdown = Array.isArray(yearlyData) ? yearlyData : [];

  res.status(200).json({
    success: true,
    message: 'Yearly analytics retrieved successfully',
    data: {
      monthlyBreakdown: safeMonthlyBreakdown,
      year: currentYear
    }
  });
};

// Get comprehensive report
export const getComprehensiveReport = async (req: any, res: any): Promise<void> => {
  const { startDate, endDate, format = 'json' } = req.query;
  const tenantId = (req as any).tenant?.id || 'default';

  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const dashboardData = await AnalyticsService.getDashboardData(tenantId, start, end);

  if (format === 'pdf') {
    const pdfBuffer = await AnalyticsService.generatePDFReport(dashboardData, 'Comprehensive Analytics Report');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.pdf"');
    res.send(pdfBuffer);
  } else if (format === 'excel') {
    const excelBuffer = await AnalyticsService.generateExcelReport(dashboardData, 'Comprehensive Analytics Report');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.xlsx"');
    res.send(excelBuffer);
  } else if (format === 'csv') {
    const csv = await AnalyticsService.exportToCSV(dashboardData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.csv"');
    res.send(csv);
  } else {
    res.status(200).json({
      success: true,
      message: 'Comprehensive report retrieved successfully',
      data: dashboardData,
      period: { startDate: start, endDate: end }
    });
  }
};

// Export to PDF
export const exportPDF = async (req: any, res: any): Promise<void> => {
  const { startDate, endDate, title } = (req as any).body;
  const tenantId = (req as any).tenant?.id || 'default';

  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const dashboardData = await AnalyticsService.getDashboardData(tenantId, start, end);
  const pdfBuffer = await AnalyticsService.generatePDFReport(dashboardData, title || 'Analytics Report');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title || 'report'}.pdf"`);
  res.send(pdfBuffer);
});

// Export to Excel
export const exportExcel = async (req: any, res: any): Promise<void> => {
  const { startDate, endDate, title } = (req as any).body;
  const tenantId = (req as any).tenant?.id || 'default';

  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const dashboardData = await AnalyticsService.getDashboardData(tenantId, start, end);
  const excelBuffer = await AnalyticsService.generateExcelReport(dashboardData, title || 'Analytics Report');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${title || 'report'}.xlsx"`);
  res.send(excelBuffer);
});

// Export to CSV
export const exportCSV = async (req: any, res: any): Promise<void> => {
  const { startDate, endDate, title } = (req as any).body;
  const tenantId = (req as any).tenant?.id || 'default';

  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const dashboardData = await AnalyticsService.getDashboardData(tenantId, start, end);
  const csv = await AnalyticsService.exportToCSV(dashboardData);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${title || 'report'}.csv"`);
  res.send(csv);
});

// Save report
export const saveReport = async (req: any, res: any): Promise<void> => {
  const { title, type, startDate, endDate } = (req as any).body;
  const tenantId = (req as any).tenant?.id || 'default';
  const userId = req.user?.id || 'system';

  const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const dashboardData = await AnalyticsService.getDashboardData(tenantId, start, end);

  await AnalyticsModel.saveReport({
    tenantId,
    title,
    type,
    data: dashboardData,
    createdBy: userId
  });

  res.status(201).json({
    success: true,
    message: 'Report saved successfully'
  });
});

// Get saved reports
export const getSavedReports = async (req: any, res: any): Promise<void> => {
  const { limit = 10, offset = 0 } = req.query;
  const tenantId = (req as any).tenant?.id || 'default';

  const reports = await AnalyticsModel.getSavedReports(tenantId, parseInt(limit), parseInt(offset));

  res.status(200).json({
    success: true,
    message: 'Saved reports retrieved successfully',
    data: reports,
    pagination: { limit: parseInt(limit), offset: parseInt(offset) }
  });
};

module.exports = exports;
