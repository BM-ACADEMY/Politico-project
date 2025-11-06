import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AuthContext } from '@/modules/Common/context/AuthContext';
import axiosInstance from '@/modules/Common/axios/axios';

const Reports = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [rawData, setRawData] = useState({
    voters: [],
    volunteers: [],
    wards: [],
  });
  const [filterPeriod, setFilterPeriod] = useState('today'); // today, yesterday, week, month

  // Fetch data only on mount (initial load)
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        // Fetch without period param initially, or use default
        const response = await axiosInstance.get('/reports');
        if (response.data.success) {
          setStats(response.data.stats);
          setRawData(response.data.rawData);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        // Handle error (e.g., toast notification)
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchReports();
    }
  }, [user]); // Only on user change (initial load)

  // Compute progressData client-side based on filterPeriod and voters
  const progressData = useMemo(() => {
    const voters = rawData.voters;
    const now = new Date();
    let data = [];

    switch (filterPeriod) {
      case 'today':
        const todayCount = voters.filter(v => {
          const created = new Date(v.createdAt);
          return created.toDateString() === now.toDateString();
        }).length;
        data = [{ name: 'Today', additions: todayCount }];
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const yesterdayCount = voters.filter(v => {
          const created = new Date(v.createdAt);
          return created.toDateString() === yesterday.toDateString();
        }).length;
        data = [{ name: 'Yesterday', additions: yesterdayCount }];
        break;
      case 'week':
        for (let i = 6; i >= 0; i--) {
          const day = new Date(now);
          day.setDate(now.getDate() - i);
          const dayCount = voters.filter(v => {
            const created = new Date(v.createdAt);
            return created.toDateString() === day.toDateString();
          }).length;
          data.push({ name: day.toLocaleDateString('en-US', { weekday: 'short' }), additions: dayCount });
        }
        break;
      case 'month':
        // Approximate weekly buckets for the last month
        for (let i = 0; i < 4; i++) { // 4 weeks
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const weekCount = voters.filter(v => {
            const created = new Date(v.createdAt);
            return created >= weekStart && created <= weekEnd;
          }).length;
          data.push({ name: `Week ${4 - i}`, additions: weekCount });
        }
        data.reverse();
        break;
      default:
        data = [{ name: 'Total', additions: voters.length }];
    }
    return data;
  }, [filterPeriod, rawData.voters]);

  // Compute sentimentData client-side
  const sentimentData = useMemo(() => {
    const voters = rawData.voters;
    const total = voters.length;
    const counts = {
      supporter: voters.filter(v => v.support === 'supporter').length,
      neutral: voters.filter(v => v.support === 'neutral').length,
      opposition: voters.filter(v => v.support === 'opposition').length,
    };
    return total > 0 ? [
      { name: 'Supporter', value: (counts.supporter / total) * 100, color: '#10B981' },
      { name: 'Neutral', value: (counts.neutral / total) * 100, color: '#F59E0B' },
      { name: 'Opposition', value: (counts.opposition / total) * 100, color: '#EF4444' },
    ] : [];
  }, [rawData.voters]);

  // Compute wardData client-side
  const wardData = useMemo(() => {
    const voters = rawData.voters;
    const wards = rawData.wards;
    return wards.map(ward => {
      const wardVoters = voters.filter(v => v.ward && v.ward._id.toString() === ward._id.toString());
      return {
        ward: `${ward.ward_name} (${ward.ward_number})`,
        supporters: wardVoters.filter(v => v.support === 'supporter').length,
        neutral: wardVoters.filter(v => v.support === 'neutral').length,
        opposition: wardVoters.filter(v => v.support === 'opposition').length,
      };
    }).filter(w => w.supporters + w.neutral + w.opposition > 0);
  }, [rawData.voters, rawData.wards]);

  // Compute ageGroupData client-side
  const ageGroupData = useMemo(() => {
    const voters = rawData.voters;
    const ageGroups = {
      '18-30': { supporters: 0, neutral: 0, opposition: 0 },
      '31-45': { supporters: 0, neutral: 0, opposition: 0 },
      '46-60': { supporters: 0, neutral: 0, opposition: 0 },
      '60+': { supporters: 0, neutral: 0, opposition: 0 },
    };

    voters.forEach(voter => {
      if (voter.dob) {
        const today = new Date();
        const birthDate = new Date(voter.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        let group;
        if (age >= 18 && age <= 30) group = '18-30';
        else if (age >= 31 && age <= 45) group = '31-45';
        else if (age >= 46 && age <= 60) group = '46-60';
        else if (age > 60) group = '60+';

        if (group) {
          ageGroups[group][voter.support]++;
        }
      }
    });

    return Object.entries(ageGroups).map(([age, counts]) => ({
      age,
      supporters: counts.supporters,
      neutral: counts.neutral,
      opposition: counts.opposition,
    }));
  }, [rawData.voters]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Campaign Analytics</h1>
        <p className="text-muted-foreground">Track your campaign performance and voter insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Voters</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVoters?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Across all wards</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supporters</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSupporters?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalVoters ? ((stats.totalSupporters / stats.totalVoters) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volunteers</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
              <path d="M16 21v-2a4 4 0 0 0-8 0v2m-10 0h18M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolunteers?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-2 gap-2 me-auto w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {/* Filter for Progress */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Voter Count Progress</h3>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Side by Side: Line Chart and Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Voter Count Progress</CardTitle>
                <CardDescription>Additions over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="additions" stroke="#10B981" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Voter Sentiment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Voter Sentiment Distribution</CardTitle>
                <CardDescription>Support levels in percentages</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name} ${value.toFixed(0)}%`}
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Ward-wise Stacked Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Ward-wise Performance</CardTitle>
              <CardDescription>Support levels across wards (role-based access)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={wardData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ward" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="supporters" stackId="a" fill="#10B981" />
                  <Bar dataKey="neutral" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="opposition" stackId="a" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="demographics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Support by Age Group</CardTitle>
              <CardDescription>Voter preferences across demographics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageGroupData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="supporters" fill="#10B981" />
                  <Bar dataKey="neutral" fill="#F59E0B" />
                  <Bar dataKey="opposition" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;