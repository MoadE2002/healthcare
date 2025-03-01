'use client';

import { useState } from 'react';
import html2pdf from 'html2pdf.js';
import { QRCode } from 'react-qr-code';
import ReactDOM from 'react-dom';

export default function PrescriptionView({ prescription }) {
  const generatePDF = () => {
    const element = document.getElementById('prescription-content');
    const qrCodeUrl = `http://localhost:3000/prescription/${prescription._id}`;

    const opt = {
      margin: 10,
      filename: `prescription_${prescription._id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    // Create a promise to generate the QR code as a data URL
    const generateQRCodeDataURL = () => {
      return new Promise((resolve) => {
        // Create a temporary container for QR code
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = `
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 12px; margin-bottom: 5px;">Scan to verify prescription</p>
            <div id="temp-qr-code-container"></div>
          </div>
        `;
        element.appendChild(tempContainer);

        // Render QR code in the temporary container
        const tempQRContainer = document.getElementById('temp-qr-code-container');
        
        // Use ReactDOM to render the QR code
        ReactDOM.render(
          <QRCode value={qrCodeUrl} size={150} />,
          tempQRContainer
        );

        // Wait a moment for rendering, then convert to image
        setTimeout(() => {
          const svg = tempQRContainer.querySelector('svg');
          const qrCodeSVG = new XMLSerializer().serializeToString(svg);

          // Convert SVG to image
          const canvas = document.createElement('canvas');
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Remove temporary QR code container
            element.removeChild(tempContainer);
            
            resolve(canvas.toDataURL('image/png'));
          };
          img.src = 'data:image/svg+xml;base64,' + btoa(qrCodeSVG);
        }, 100);
      });
    };

    // Generate PDF with QR code
    generateQRCodeDataURL().then((qrCodeDataUrl) => {
      // Temporarily add the QR code to the prescription content
      const qrContainer = document.createElement('div');
      qrContainer.style.textAlign = 'center';
      qrContainer.style.marginTop = '20px';
      qrContainer.innerHTML = `
        <div>
          <p style="font-size: 12px; margin-bottom: 5px;">Scan to verify prescription</p>
          <img src="${qrCodeDataUrl}" style="width: 150px; height: 150px; margin: 0 auto;" />
        </div>
      `;
      element.appendChild(qrContainer);

      // Generate PDF
      html2pdf().from(element).set(opt).save().then(() => {
        // Remove the temporary QR code container
        element.removeChild(qrContainer);
      });
    });
  };

  if (!prescription) return null;

  return (
    <div className="container mx-auto p-6">
      <div 
        id="prescription-content" 
        className="bg-white shadow-lg rounded-lg p-8 max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Medical Prescription</h1>
          <p className="text-sm text-gray-600">
            Issued on: {new Date(prescription.issued_at).toLocaleDateString()}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Patient Details</h2>
          <p><strong>Name:</strong> {prescription.appointement_id.patient_id.username}</p>
          <p><strong>Email:</strong> {prescription.appointement_id.patient_id.email}</p>
          <p><strong>Phone:</strong> {prescription.appointement_id.patient_id.phone}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Prescription Details</h2>
          <p><strong>Description:</strong> {prescription.description}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Medications</h2>
          {prescription.medication.map((med, index) => (
            <div key={index} className="mb-4">
              <p><strong>Name:</strong> {med.name}</p>
              <p><strong>Dosage:</strong> {med.dosage}</p>
              <p><strong>Duration:</strong> {med.duration}</p>
            </div>
          ))}
        </div>

        {prescription.additional_instructions && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Additional Instructions</h2>
            <p>{prescription.additional_instructions}</p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Doctor Details</h2>
          <p><strong>Name:</strong> {prescription.appointement_id.doctor_id.user.username}</p>
          <p><strong>Specialty:</strong> {prescription.appointement_id.doctor_id.speciality.join(', ')}</p>
          <p><strong>Address:</strong> {prescription.appointement_id.doctor_id.user.address}</p>
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={generatePDF}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}