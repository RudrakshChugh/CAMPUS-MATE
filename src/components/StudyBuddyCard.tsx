
import React from 'react';
import { MapPin, Clock, Users, MessageCircle } from 'lucide-react';

interface StudyBuddy {
  id: string;
  name: string;
  status: 'Solo Focus' | 'Open to Study' | 'Need Help';
  subject: string;
  location: string;
  timeRemaining: string;
  avatar: string;
}

interface StudyBuddyCardProps {
  buddy: StudyBuddy;
  onConnect: (id: string) => void;
}

const StudyBuddyCard = ({ buddy, onConnect }: StudyBuddyCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Solo Focus': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'Open to Study': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'Need Help': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">{buddy.name.split(' ').map(n => n[0]).join('')}</span>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-white">{buddy.name}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{buddy.subject}</p>
        </div>
      </div>
      
      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(buddy.status)} mb-3`}>
        {buddy.status}
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4 mr-2" />
          {buddy.location}
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-2" />
          {buddy.timeRemaining}
        </div>
      </div>
      
      {buddy.status !== 'Solo Focus' && (
        <button 
          onClick={() => onConnect(buddy.id)}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Connect</span>
        </button>
      )}
    </div>
  );
};

export default StudyBuddyCard;
