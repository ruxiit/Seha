import React from 'react';
import { Pill, Calendar, User, FileText } from 'lucide-react';

export interface Prescription {
  id: string;
  patientName: string;
  date: string;
  medications: string[];
  notes?: string;
}

interface PrescriptionCardProps {
  prescription: Prescription;
}

export function PrescriptionCard({ prescription }: PrescriptionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Prescription</h3>
            <p className="text-sm text-gray-500 font-medium">#{prescription.id}</p>
          </div>
        </div>
        <div className="flex items-center text-gray-500 text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          <Calendar size={16} className="mr-2" />
          {prescription.date}
        </div>
      </div>
      
      <div className="space-y-5">
        <div className="flex items-center text-gray-700 bg-gray-50/50 p-3 rounded-lg">
          <User size={18} className="mr-3 text-gray-400" />
          <span className="font-medium">{prescription.patientName}</span>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-gray-900 flex items-center mb-3">
            <Pill size={18} className="mr-2 text-blue-500" />
            Medications
          </h4>
          <ul className="space-y-2">
            {prescription.medications.map((med, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                {med}
              </li>
            ))}
          </ul>
        </div>

        {prescription.notes && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600 italic bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
              "{prescription.notes}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
