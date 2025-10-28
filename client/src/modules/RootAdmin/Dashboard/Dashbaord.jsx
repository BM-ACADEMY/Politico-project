'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, UserCheck, Loader2 } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import axiosInstance from '@/modules/Common/axios/axios'

// -------------------------------------------------------------
// Normalize line chart data
// -------------------------------------------------------------
function normalizeLineData(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const map = new Map()
  raw.forEach((item) => {
    const key = item.name
    if (!map.has(key)) {
      map.set(key, { name: key, parties: 0, candidates: 0 })
    }
    const entry = map.get(key)
    if ('parties' in item) entry.parties = item.parties
    if ('candidates' in item) entry.candidates = item.candidates
  })
  return Array.from(map.values())
}

// -------------------------------------------------------------
// Normalize bar chart data
// -------------------------------------------------------------
function normalizeBarData(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return []
  const map = new Map()
  raw.forEach((item) => {
    const key = item.name
    if (!map.has(key)) {
      map.set(key, { name: key, parties: 0, candidates: 0 })
    }
    const entry = map.get(key)
    if ('parties' in item) entry.parties = item.parties
    if ('candidates' in item) entry.candidates = item.candidates
  })
  return Array.from(map.values())
}

export default function Dashboard() {
  const [stats, setStats] = useState({ totalParties: 0, totalCandidates: 0 })
  const [lineData, setLineData] = useState([])
  const [barData, setBarData] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, lineRes, barRes] = await Promise.all([
        axiosInstance.get('/rootdashboard/stats'),
        axiosInstance.get('/rootdashboard/chart/line'),
        axiosInstance.get('/rootdashboard/chart/bar'),
      ])
      setStats(statsRes.data)
      setLineData(normalizeLineData(lineRes.data))
      setBarData(normalizeBarData(barRes.data))
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Root Dashboard</h1>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Parties</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="inline h-6 w-6 animate-spin" /> : stats.totalParties}
              </div>
              <p className="text-xs text-muted-foreground">All Time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Loader2 className="inline h-6 w-6 animate-spin" /> : stats.totalCandidates}
              </div>
              <p className="text-xs text-muted-foreground">All Time</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="line" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="line">Line Chart (Last 30 Days)</TabsTrigger>
                <TabsTrigger value="bar">Bar Chart (Last 12 Weeks)</TabsTrigger>
              </TabsList>

              {/* Line Chart */}
              <TabsContent value="line" className="mt-6">
                {loading ? (
                  <div className="flex h-[350px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : lineData.length === 0 ? (
                  <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="parties" stroke="#8884d8" strokeWidth={2} name="Parties" />
                      <Line type="monotone" dataKey="candidates" stroke="#82ca9d" strokeWidth={2} name="Candidates" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </TabsContent>

              {/* Bar Chart */}
              <TabsContent value="bar" className="mt-6">
                {loading ? (
                  <div className="flex h-[350px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : barData.length === 0 ? (
                  <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="parties" fill="#8884d8" radius={[4, 4, 0, 0]} name="Parties" />
                      <Bar dataKey="candidates" fill="#82ca9d" radius={[4, 4, 0, 0]} name="Candidates" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}