import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import StatsCard from '@/components/StatsCard';
import AttendanceCard from '@/components/AttendanceCard';
import RecentActivity from '@/components/RecentActivity';
import { BookOpen, Users, Calendar, TrendingUp } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [totalSubjects, setTotalSubjects] = useState(0);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!user) return;
      const attendanceCol = collection(db, 'users', user.uid, 'attendance');
      const subjectsSnap = await getDocs(attendanceCol);
      const data: any[] = [];

      for (const subjectDoc of subjectsSnap.docs) {
        const subjectName = subjectDoc.id;
        const recordsCol = collection(db, 'users', user.uid, 'attendance', subjectName, 'records');
        const recordsSnap = await getDocs(recordsCol);

        let attended = 0;
        let missed = 0;
        let cancelled = 0;
        let proxy = 0;
        let lastDate = '';
        let nextClass = '';
        let allDates: string[] = [];

        recordsSnap.forEach(recordDoc => {
          const rec = recordDoc.data();
          allDates.push(rec.date);
          if (rec.status === 'attending') attended++;
          else if (rec.status === 'missed') missed++;
          else if (rec.status === 'cancelled') cancelled++;
          else if (rec.status === 'proxy') proxy++;
        });

        // Calculate total classes (attended + missed + cancelled)
        const totalClasses = attended + missed + cancelled + proxy;
        const attendedClasses = attended + proxy;
        const attendance = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
        const canBunk = attendance > 75;

        // Find next class (future date, sorted)
        if (subjectDoc.data().days && Array.isArray(subjectDoc.data().days)) {
          // Find the next class day from today
          const today = new Date();
          let minDiff = Infinity;
          subjectDoc.data().days.forEach(day => {
            // Find next date for this day
            const dayIndex = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(day);
            if (dayIndex === -1) return;
            const diff = (dayIndex + 7 - today.getDay()) % 7;
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + diff);
            if (diff < minDiff) {
              minDiff = diff;
              nextClass = `${day} ${nextDate.toLocaleDateString('en-GB')}`;
            }
          });
        }

        data.push({
          name: subjectName,
          attendance,
          totalClasses,
          attendedClasses,
          nextClass,
          canBunk
        });
      }
      setAttendanceData(data);
    };

    const fetchTotalSubjects = async () => {
      if (!user) return;
      const attendanceCol = collection(db, 'users', user.uid, 'attendance');
      const subjectsSnap = await getDocs(attendanceCol);
      setTotalSubjects(subjectsSnap.size);
    };

    fetchAttendanceData();
    fetchTotalSubjects();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation currentPath="/" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back to <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">CampusMate</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Your academic companion for a smarter college life</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Subjects"
            value={totalSubjects.toString()}
            icon={BookOpen}
            color="purple"
          />
          <StatsCard
            title="Study Sessions"
            value="12"
            change="+3 this week"
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Avg Attendance"
            value="82%"
            change="+5% from last month"
            icon={Calendar}
            color="green"
          />
          <StatsCard
            title="Resources Shared"
            value="24"
            change="+8 this week"
            icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Attendance Cards */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Attendance Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {attendanceData.map((subject, index) => (
                <AttendanceCard key={index} subject={subject} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <RecentActivity />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors">
              <BookOpen className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Upload Notes</span>
            </button>
            <button className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors">
              <Users className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Find Study Buddy</span>
            </button>
            <button className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors">
              <Calendar className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">Check Attendance</span>
            </button>
            <button className="bg-white/10 hover:bg-white/20 rounded-lg p-4 text-center transition-colors">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm font-medium">View Stats</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
