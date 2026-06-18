import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const reportService = {
  exportToPDF: (complaints, summaryStats) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Header Styling (Government Theme)
    doc.setFillColor(10, 37, 64); // Navy Blue
    doc.rect(0, 0, 210, 40, 'F');

    // Saffron and Green Trim Accent Lines
    doc.setFillColor(255, 153, 51); // Saffron
    doc.rect(0, 40, 210, 2, 'F');
    doc.setFillColor(19, 136, 8); // Green
    doc.rect(0, 42, 210, 2, 'F');

    // Header Typography
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('GOVERNMENT OF NCT OF DELHI', 105, 18, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'normal');
    doc.text('Chief Minister\'s Grievance Redressal Dashboard Report', 105, 26, { align: 'center' });
    doc.text(`Generated on: ${currentDate}`, 105, 33, { align: 'center' });

    // Summary Statistics Cards
    doc.setTextColor(10, 37, 64);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('EXECUTIVE METRICS SUMMARY', 14, 55);

    // Draw lines under section title
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 57, 196, 57);

    // Summary Values
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total Grievances: ${summaryStats.total || complaints.length}`, 15, 65);
    doc.text(`Resolved: ${summaryStats.resolved || 0}`, 70, 65);
    doc.text(`Escalated to CM: ${summaryStats.escalated || 0}`, 125, 65);
    doc.text(`Resolution Rate: ${summaryStats.resolutionRate || 0}%`, 15, 71);
    doc.text(`Active Unresolved: ${summaryStats.activeUnresolved || 0}`, 70, 71);
    doc.text(`Avg. Redressal Time: ${summaryStats.avgResolutionTime || '2.4 Days'}`, 125, 71);

    // Main Table
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('GRIEVANCE ROSTER DETAILS', 14, 85);
    doc.line(14, 87, 196, 87);

    const tableRows = complaints.map(c => [
      c.tracking_no,
      c.title.length > 30 ? c.title.substring(0, 27) + '...' : c.title,
      c.category,
      c.district,
      c.severity.toUpperCase(),
      c.status.toUpperCase(),
      new Date(c.created_at).toLocaleDateString('en-IN')
    ]);

    doc.autoTable({
      startY: 90,
      head: [['Tracking ID', 'Grievance Title', 'Department / Category', 'District', 'Severity', 'Status', 'Logged Date']],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [10, 37, 64],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50]
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { left: 14, right: 14 }
    });

    // Save PDF
    doc.save(`Delhi_Grievance_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  },

  exportToExcel: (complaints) => {
    // Map to user-friendly excel headers
    const data = complaints.map(c => ({
      'Tracking ID': c.tracking_no,
      'Title': c.title,
      'Description': c.description,
      'Category': c.category,
      'Department': c.department_name || c.department_code || 'Unassigned',
      'Status': c.status.toUpperCase(),
      'Severity': c.severity.toUpperCase(),
      'District': c.district,
      'Latitude': c.latitude,
      'Longitude': c.longitude,
      'Logged Date': new Date(c.created_at).toLocaleString('en-IN'),
      'Last Updated': new Date(c.updated_at).toLocaleString('en-IN'),
      'Assigned Officer': c.assigned_officer_name || 'Not Assigned',
      'Resolution Notes': c.resolution_notes || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Grievances');

    // Auto-fit Column Widths
    const maxLens = {};
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        const value = String(row[key] || '');
        maxLens[key] = Math.max(maxLens[key] || 10, value.length);
      });
    });
    const colWidths = Object.keys(maxLens).map(key => ({
      wch: Math.min(maxLens[key] + 2, 40) // cap width at 40
    }));
    worksheet['!cols'] = colWidths;

    // Write file
    XLSX.writeFile(workbook, `Delhi_Grievance_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
};
