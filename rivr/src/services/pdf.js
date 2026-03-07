import jsPDF from 'jspdf';

export function generateTriageReportPDF({ vitals, transcript, assessment, timestamp }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFillColor(26, 35, 50);
  doc.rect(0, 0, pageWidth, 45, 'F');
  doc.setTextColor(10, 186, 181);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('RIVR', margin, y + 8);
  doc.setFontSize(10);
  doc.setTextColor(160, 174, 192);
  doc.text('AI-Powered Triage Pre-Assessment Report', margin, y + 16);
  doc.setFontSize(9);
  doc.text(`Generated: ${timestamp || new Date().toLocaleString()}`, margin, y + 24);

  // CTAS badge
  const ctasColors = {
    1: [229, 62, 62],
    2: [245, 101, 101],
    3: [236, 201, 75],
    4: [46, 155, 218],
    5: [72, 187, 120],
  };
  const ctasColor = ctasColors[assessment?.ctasLevel] || [160, 174, 192];
  doc.setFillColor(...ctasColor);
  doc.roundedRect(pageWidth - 65, 8, 50, 28, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('CTAS Level', pageWidth - 55, 19);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(String(assessment?.ctasLevel || 'N/A'), pageWidth - 43, 32);

  y = 55;

  // Horizontal line
  doc.setDrawColor(10, 186, 181);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Vital Signs Section
  doc.setTextColor(10, 186, 181);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('VITAL SIGNS', margin, y);
  y += 10;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const vitalsData = [
    ['Measurement', 'Value', 'Normal Range', 'Status'],
    ['Heart Rate', `${vitals?.heartRate || '--'} BPM`, '60-100 BPM', getVitalStatus(vitals?.heartRate, 60, 100)],
    ['Breathing Rate', `${vitals?.breathingRate || '--'} br/min`, '12-20 br/min', getVitalStatus(vitals?.breathingRate, 12, 20)],
    ['Temperature', `${vitals?.temperature || '--'} °C`, '36.1-37.2 °C', getVitalStatus(vitals?.temperature, 36.1, 37.2)],
    ['SpO2', `${vitals?.oxygenLevel || '--'}%`, '95-100%', getVitalStatus(vitals?.oxygenLevel, 95, 100)],
    ['Stress Level', `${vitals?.stressLevel || '--'}%`, '< 40%', vitals?.stressLevel > 60 ? 'ELEVATED' : vitals?.stressLevel > 40 ? 'BORDERLINE' : 'NORMAL'],
  ];

  // Table header
  doc.setFillColor(240, 244, 248);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  const colWidths = [45, 35, 40, 35];
  let xPos = margin + 3;
  vitalsData[0].forEach((header, i) => {
    doc.text(header, xPos, y + 6);
    xPos += colWidths[i];
  });
  y += 10;

  // Table rows
  doc.setFont('helvetica', 'normal');
  for (let i = 1; i < vitalsData.length; i++) {
    xPos = margin + 3;
    vitalsData[i].forEach((cell, j) => {
      if (j === 3) {
        const statusColors = {
          NORMAL: [72, 187, 120],
          BORDERLINE: [236, 201, 75],
          ELEVATED: [245, 101, 101],
          LOW: [46, 155, 218],
          HIGH: [245, 101, 101],
        };
        doc.setTextColor(...(statusColors[cell] || [60, 60, 60]));
        doc.setFont('helvetica', 'bold');
      }
      doc.text(cell, xPos, y + 5);
      if (j === 3) {
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
      }
      xPos += colWidths[j];
    });
    y += 8;
  }

  y += 10;

  // Symptom Summary
  doc.setTextColor(10, 186, 181);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SYMPTOM SUMMARY', margin, y);
  y += 8;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const symptomText = assessment?.symptomSummary || transcript || 'No symptom data available.';
  const splitText = doc.splitTextToSize(symptomText, pageWidth - 2 * margin);
  doc.text(splitText, margin, y);
  y += splitText.length * 5 + 10;

  // Assessment
  doc.setTextColor(10, 186, 181);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('AI ASSESSMENT', margin, y);
  y += 8;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const ctasNames = { 1: 'Resuscitation', 2: 'Emergent', 3: 'Urgent', 4: 'Less Urgent', 5: 'Non-Urgent' };
  doc.setFont('helvetica', 'bold');
  doc.text(`Suggested CTAS Level: ${assessment?.ctasLevel || 'N/A'} - ${ctasNames[assessment?.ctasLevel] || ''}`, margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.text(`Care Recommendation: ${assessment?.careRecommendation || 'N/A'}`, margin, y);
  y += 10;

  if (assessment?.reasoning) {
    doc.setFont('helvetica', 'bold');
    doc.text('Reasoning:', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const reasoningText = doc.splitTextToSize(assessment.reasoning, pageWidth - 2 * margin);
    doc.text(reasoningText, margin, y);
    y += reasoningText.length * 5 + 5;
  }

  // Footer disclaimer
  y = doc.internal.pageSize.getHeight() - 25;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  const disclaimer = 'DISCLAIMER: This report was generated by Rivr, an AI-powered pre-assessment tool. It is not a medical diagnosis and should be used as supplementary information only. Always seek professional medical advice. In an emergency, call 911.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin);
  doc.text(disclaimerLines, margin, y);

  return doc;
}

export function generateVisitSummaryPDF({ vitals, transcript, assessment, timestamp, language }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Header
  doc.setFillColor(10, 186, 181);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Rivr - Visit Summary', margin, y + 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${timestamp || new Date().toLocaleString()}`, margin, y + 20);

  y = 45;

  // Patient Note
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 20, 3, 3, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('This document summarizes an AI-powered pre-assessment. It is not a diagnosis.', margin + 5, y + 8);
  doc.text('Please use this as reference information for your healthcare provider.', margin + 5, y + 14);
  y += 28;

  // Vitals
  doc.setTextColor(10, 186, 181);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Vitals Snapshot', margin, y);
  y += 8;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Heart Rate: ${vitals?.heartRate || '--'} BPM`, margin + 5, y); y += 6;
  doc.text(`Breathing Rate: ${vitals?.breathingRate || '--'} breaths/min`, margin + 5, y); y += 6;
  doc.text(`Temperature: ${vitals?.temperature || '--'} °C`, margin + 5, y); y += 6;
  doc.text(`SpO2: ${vitals?.oxygenLevel || '--'}%`, margin + 5, y); y += 6;
  doc.text(`Stress Level: ${vitals?.stressLevel || '--'}%`, margin + 5, y); y += 12;

  // Symptoms
  doc.setTextColor(10, 186, 181);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('What I Was Experiencing', margin, y);
  y += 8;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const symptomText = assessment?.symptomSummary || transcript || 'No symptom data recorded.';
  const splitSymptoms = doc.splitTextToSize(symptomText, pageWidth - 2 * margin - 5);
  doc.text(splitSymptoms, margin + 5, y);
  y += splitSymptoms.length * 5 + 10;

  // AI Assessment
  doc.setTextColor(10, 186, 181);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('AI Assessment Finding', margin, y);
  y += 8;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Recommendation: ${assessment?.careRecommendation || 'Consult a healthcare provider'}`, margin + 5, y);
  y += 8;

  if (assessment?.reasoning) {
    const reasoningText = doc.splitTextToSize(assessment.reasoning, pageWidth - 2 * margin - 5);
    doc.text(reasoningText, margin + 5, y);
    y += reasoningText.length * 5;
  }

  // Footer
  y = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text('Generated by Rivr (rivr.ca) — AI-powered pre-assessment. Not a medical diagnosis.', margin, y);

  return doc;
}

function getVitalStatus(value, low, high) {
  if (!value) return 'N/A';
  if (value < low) return 'LOW';
  if (value > high) return 'HIGH';
  return 'NORMAL';
}

export function downloadPDF(doc, filename) {
  doc.save(filename);
}
