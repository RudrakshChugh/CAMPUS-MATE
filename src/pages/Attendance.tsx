import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Calendar, Plus, Clock, CheckCircle, X, Users } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LectureBlock {
  id: string;
  subject: string;
  day: string; // e.g. "Monday, Wednesday"
  status: 'attending' | 'missed' | 'cancelled' | 'proxy' | null;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to get day name from date string
const getDayName = (dateString: string) => {
  const date = new Date(dateString);
  // getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
  const dayIndex = date.getDay();
  // Adjust for your days array (Monday=0)
  // If Sunday (0), set to Saturday (5), else dayIndex-1
  if (dayIndex === 0) return 'Saturday';
  return days[dayIndex - 1];
};

function getDateOfWeek(selectedDate: string, targetDay: string) {
  const date = new Date(selectedDate);
  const currentDayIndex = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const daysMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const targetDayIndex = daysMap[targetDay];
  // Calculate difference to get to target day in the same week
  const diff = targetDayIndex - currentDayIndex;
  const targetDate = new Date(date);
  targetDate.setDate(date.getDate() + diff);
  // Format as yyyy-mm-dd
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper to format date as DD/MM/YYYY
const formatIndianDate = (dateString: string) => {
  const [yyyy, mm, dd] = dateString.split('-');
  return `${dd}/${mm}/${yyyy}`;
};

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [showAddClass, setShowAddClass] = useState(false);
  const [newClass, setNewClass] = useState({ subject: '', days: [] as string[] });
  const [confirmedAttendance, setConfirmedAttendance] = useState<{ [key: string]: boolean }>({});
  const [attendanceStatus, setAttendanceStatus] = useState<{ [key: string]: 'attending' | 'missed' | 'cancelled' | 'proxy' | null }>({});
  const [confirmedStatus, setConfirmedStatus] = useState<{ [key: string]: 'attending' | 'missed' | 'cancelled' | 'proxy' | null }>({});
  const [successMessage, setSuccessMessage] = useState('');

  const [timetable, setTimetable] = useState<LectureBlock[]>([]);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/'); // Redirect to Dashboard or Home
    }
  }, [user, navigate]);

  // Fetch classes from Firestore on mount or when user changes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return;
      const attendanceCol = collection(db, 'users', user.uid, 'attendance');
      const snapshot = await getDocs(attendanceCol);
      const classes: LectureBlock[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        classes.push({
          id: docSnap.id, // subject name as id
          subject: docSnap.id, // subject name from doc id
          day: (data.days || []).join(', '), // join days array for display
          status: null
        });
      });
      setTimetable(classes);
    };
    fetchClasses();
  }, [user]);

  useEffect(() => {
    // Set default date to today on mount
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    setSelectedDate(todayStr);
    setSelectedDay(getDayName(todayStr));
  }, []);

  // Fetch confirmed attendance for the week of selectedDate
  useEffect(() => {
    const fetchConfirmedAttendance = async () => {
      if (!user || !selectedDate) return;
      const newConfirmed: { [key: string]: boolean } = {};
      const newConfirmedStatus: { [key: string]: 'attending' | 'missed' | 'cancelled' | 'proxy' | null } = {};
      const newAttendanceStatus: { [key: string]: 'attending' | 'missed' | 'cancelled' | 'proxy' | null } = {};
      for (const lecture of timetable) {
        for (const day of lecture.day.split(', ')) {
          const dateForDay = getDateOfWeek(selectedDate, day);
          const key = `${lecture.subject}_${day}_${dateForDay}`;
          const statusKey = `${lecture.subject}_${day}`;
          const recordRef = doc(db, 'users', user.uid, 'attendance', lecture.subject, 'records', key);
          const recordSnap = await getDoc(recordRef);
          if (recordSnap.exists()) {
            const status = recordSnap.data().status || null;
            newConfirmed[key] = true;
            newConfirmedStatus[key] = status;
            newAttendanceStatus[statusKey] = status; // <-- This line ensures button highlight
          }
        }
      }
      setConfirmedAttendance(newConfirmed);
      setConfirmedStatus(newConfirmedStatus);
      setAttendanceStatus(newAttendanceStatus); // <-- Add this line
    };
    fetchConfirmedAttendance();
    // eslint-disable-next-line
  }, [user, selectedDate, timetable.length]);

  const handleStatusChange = (subject: string, day: string, status: 'attending' | 'missed' | 'cancelled' | 'proxy') => {
    setAttendanceStatus(prev => ({
      ...prev,
      [`${subject}_${day}`]: status
    }));
  };

  const addNewClass = async () => {
    if (!user || !newClass.subject.trim() || newClass.days.length === 0) return;
    try {
      const subjectRef = doc(db, 'users', user.uid, 'attendance', newClass.subject);
      await setDoc(subjectRef, { days: newClass.days }, { merge: true });

      const newLecture: LectureBlock = {
        id: newClass.subject,
        subject: newClass.subject,
        day: newClass.days.join(', '),
        status: null
      };
      setTimetable(prev => [...prev, newLecture]);
      setNewClass({ subject: '', days: [] });
      setShowAddClass(false);

      setSuccessMessage('Class added successfully!');
      setTimeout(() => setSuccessMessage(''), 2000); // Hide after 2 seconds
    } catch (error) {
      console.error("Error adding class:", error);
    }
  };

  const handleConfirmAttendance = async (subject: string, day: string) => {
    if (!user) return;
    // Get the date for the selected day in the week of selectedDate
    const dateForDay = getDateOfWeek(selectedDate, day);
    const key = `${subject}_${day}_${dateForDay}`;
    const status = attendanceStatus[`${subject}_${day}`];
    if (!status) return;

    const recordRef = doc(db, 'users', user.uid, 'attendance', subject, 'records', key);
    await setDoc(recordRef, {
      date: dateForDay,
      day,
      status
    });

    setConfirmedAttendance(prev => ({ ...prev, [key]: true }));
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'attending': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'missed': return <X className="w-4 h-4 text-red-600" />;
      case 'cancelled': return <Clock className="w-4 h-4 text-gray-600" />;
      case 'proxy': return <Users className="w-4 h-4 text-blue-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Filter timetable based on selected day if one is selected
  const filteredTimetable = selectedDay
    ? timetable.filter(lecture => lecture.day === selectedDay)
    : timetable;

  // Group by day, but for each day, filter subjects that include that day
  const groupedTimetable = days.reduce((acc, day) => {
    acc[day] = timetable.filter(lecture => lecture.day.split(', ').includes(day));
    return acc;
  }, {} as Record<string, LectureBlock[]>);

  // Helper to get today's date in yyyy-mm-dd format
  const getTodayStr = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation currentPath="/attendance" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Attendance <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Tracker</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Mark your attendance by date or day</p>
          </div>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <button
              onClick={() => setShowAddClass(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span>Add Class</span>
            </button>
          </div>
        </div>

        {/* Date Selection Only (removed Select Day) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Date for Attendance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) {
                    setSelectedDay(getDayName(e.target.value));
                  } else {
                    setSelectedDay('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  const todayStr = getTodayStr();
                  setSelectedDate(todayStr);
                  setSelectedDay(getDayName(todayStr));
                }}
                className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Reset Date
              </button>
            </div>
          </div>

          {selectedDate && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-purple-700 dark:text-purple-300 font-medium">
                Date: {new Date(selectedDate).toLocaleDateString()}
                {" | "}
                Day: {getDayName(selectedDate)}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.keys(groupedTimetable).map(day => {
            // Highlight if this day matches the selected date's day
            const isHighlighted = day === getDayName(selectedDate);
            return (
              <div
                key={day}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700
                  ${isHighlighted ? 'ring-2 ring-purple-400 border-purple-400 dark:ring-purple-500' : ''}`}
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className={`font-semibold ${isHighlighted ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>{day}</h3>
                </div>
                <div className="p-4 space-y-3">
                  {groupedTimetable[day]?.length > 0 ? (
                    groupedTimetable[day].map(lecture => {
                      const key = `${lecture.subject}_${day}`;
                      const dateForDay = getDateOfWeek(selectedDate, day);
                      const lockKey = `${lecture.subject}_${day}_${dateForDay}`;
                      const status = attendanceStatus[key];
                      return (
                        <div key={key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">{lecture.subject}</h4>
                            {getStatusIcon(status)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Date: {formatIndianDate(dateForDay)}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleStatusChange(lecture.subject, day, 'attending')}
                              disabled={confirmedAttendance[lockKey]}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                status === 'attending'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/20'
                              } ${confirmedAttendance[lockKey] ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Attending
                            </button>
                            <button
                              onClick={() => handleStatusChange(lecture.subject, day, 'missed')}
                              disabled={confirmedAttendance[lockKey]}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                status === 'missed'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20'
                              } ${confirmedAttendance[lockKey] ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Missed
                            </button>
                            <button
                              onClick={() => handleStatusChange(lecture.subject, day, 'cancelled')}
                              disabled={confirmedAttendance[lockKey]}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                status === 'cancelled'
                                  ? 'bg-gray-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              } ${confirmedAttendance[lockKey] ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Cancelled
                            </button>
                            <button
                              onClick={() => handleStatusChange(lecture.subject, day, 'proxy')}
                              disabled={confirmedAttendance[lockKey]}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                status === 'proxy'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                              } ${confirmedAttendance[lockKey] ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Proxy
                            </button>
                          </div>

                          {/* Confirm Button */}
                          {!confirmedAttendance[lockKey] && status && (
                            <button
                              onClick={() => handleConfirmAttendance(lecture.subject, day)}
                              className="mt-3 w-full px-3 py-1 rounded text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Confirm
                            </button>
                          )}
                          {confirmedAttendance[lockKey] && (
                            <div className="mt-3 text-green-600 font-semibold text-xs text-center">
                              Confirmed: {confirmedStatus[lockKey] && (
                                <span className="capitalize">{confirmedStatus[lockKey]}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No classes scheduled</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {showAddClass && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Class</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    value={newClass.subject}
                    onChange={(e) => setNewClass(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter subject name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Days</label>
                  <div className="flex flex-wrap gap-2">
                    {days.map(day => (
                      <label key={day} className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          checked={newClass.days.includes(day)}
                          onChange={e => {
                            setNewClass(prev => ({
                              ...prev,
                              days: e.target.checked
                                ? [...prev.days, day]
                                : prev.days.filter(d => d !== day)
                            }));
                          }}
                        />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddClass(false)}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewClass}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                >
                  Add Class
                </button>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 opacity-100 animate-bounce">
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;