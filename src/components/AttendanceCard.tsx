
import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Subject {
  name: string;
  attendance: number;
  totalClasses: number;
  attendedClasses: number;
  nextClass: string;
  canBunk: boolean;
}

interface AttendanceCardProps {
  subject: Subject;
}

const AttendanceCard = ({ subject }: AttendanceCardProps) => {
  const getStatusColor = (attendance: number) => {
    if (attendance >= 80) return 'text-green-600 dark:text-green-400';
    if (attendance >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = (attendance: number) => {
    if (attendance >= 80) return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    if (attendance >= 75) return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">{subject.name}</h3>
        {getStatusIcon(subject.attendance)}
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Attendance</span>
          <span className={`font-semibold ${getStatusColor(subject.attendance)}`}>
            {subject.attendance}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              subject.attendance >= 80 ? 'bg-green-500' : 
              subject.attendance >= 75 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${subject.attendance}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{subject.attendedClasses}/{subject.totalClasses} classes</span>
          <span>Next: {subject.nextClass}</span>
        </div>
        
        {subject.canBunk && subject.attendance > 75 && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">✨ AI Says: Safe to bunk!</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">You can miss 1-2 classes and still maintain 75%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceCard;
