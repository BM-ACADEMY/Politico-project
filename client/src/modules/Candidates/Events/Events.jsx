// Events.jsx - Added status badge with background colors and icons
import React, { useState, useEffect, useContext } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Calendar, Clock, MapPin, Check, Camera, Search, ChevronDown, CalendarIcon, Dot, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AuthContext } from '@/modules/Common/context/AuthContext'
import axiosInstance from '@/modules/Common/axios/axios'

const Events = () => {
  const { user } = useContext(AuthContext)
  const [events, setEvents] = useState([])
  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({
    eventTitle: '',
    eventType: '',
    date: '',
    time: '',
    venue: '',
    targetAttendance: '',
    description: '',
    status: 'scheduled'
  })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const now = new Date()

  useEffect(() => {
    if (user) {
      fetchEvents()
    }
  }, [user])

  const fetchEvents = async () => {
    try {
      const response = await axiosInstance.get('/events')
      setEvents(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...formData }
      if (!isEditing) {
        payload.actualAttendance = 0
        delete payload.status // Don't send status for new events, default to scheduled
      }
      if (isEditing) {
        await axiosInstance.put(`/events/${editingEvent._id}`, payload)
      } else {
        await axiosInstance.post('/events', payload)
      }
      setOpen(false)
      setIsEditing(false)
      setEditingEvent(null)
      setFormData({ eventTitle: '', eventType: '', date: '', time: '', venue: '', targetAttendance: '', description: '', status: 'scheduled' })
      fetchEvents()
    } catch (error) {
      console.error('Failed to save event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (event) => {
    setIsEditing(true)
    setEditingEvent(event)
    setFormData({
      eventTitle: event.eventTitle,
      eventType: event.eventType,
      date: new Date(event.date).toISOString().split('T')[0],
      time: event.time,
      venue: event.venue,
      targetAttendance: event.targetAttendance,
      description: event.description || '',
      status: event.status
    })
    setOpen(true)
  }

  const handleComplete = async (eventId) => {
    try {
      await axiosInstance.put(`/events/${eventId}`, { status: 'completed' })
      fetchEvents()
    } catch (error) {
      console.error('Failed to complete event:', error)
    }
  }

  const handleDelete = async (eventId) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await axiosInstance.delete(`/events/${eventId}`)
        fetchEvents()
      } catch (error) {
        console.error('Failed to delete event:', error)
      }
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || event.eventType === filterType
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const totalEvents = events.length
  const completedEvents = events.filter(e => e.status === 'completed').length
  const upcomingEvents = events.filter(e => {
    const eventDateTime = new Date(`${new Date(e.date).toISOString().split('T')[0]}T${e.time}:00`)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return eventDateTime > now && eventDateTime <= thirtyDaysFromNow
  }).length

  const upcomingThisWeek = events.filter(e => {
    const eventDateTime = new Date(`${new Date(e.date).toISOString().split('T')[0]}T${e.time}:00`)
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return eventDateTime > now && eventDateTime <= weekFromNow
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />
      case 'ongoing':
        return <Dot className="h-4 w-4 text-yellow-500" />
      default:
        return <Calendar className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressValue = (event) => {
    if (!event.actualAttendance || !event.targetAttendance) return 0
    return Math.min((event.actualAttendance / event.targetAttendance) * 100, 100)
  }

  const getProgressLabel = (event) => {
    if (event.status === 'scheduled') return `${event.targetAttendance} attendees`
    return `${event.actualAttendance || 0} / ${event.targetAttendance}`
  }

  const getBadgeClass = (type) => {
    switch (type) {
      case 'rally':
        return 'bg-red-100 text-red-800'
      case 'door to door':
        return 'bg-yellow-100 text-yellow-800'
      case 'survey':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return <div className="container mx-auto p-6">Please log in to view events.</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event & Rally Tracker</h1>
          <p className="text-muted-foreground">Manage your campaign events and track attendance</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Create event</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Event' : 'Create Event'}</DialogTitle>
                <DialogDescription>Fill in the event details below.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="eventTitle">Event Title</Label>
                  <Input id="eventTitle" name="eventTitle" value={formData.eventTitle} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={formData.eventType} onValueChange={(value) => handleSelectChange('eventType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rally">Rally</SelectItem>
                      <SelectItem value="door to door">Door-to-Door</SelectItem>
                      <SelectItem value="survey">Survey</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" name="time" type="time" value={formData.time} onChange={handleInputChange} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input id="venue" name="venue" value={formData.venue} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="targetAttendance">Target Attendance</Label>
                  <Input id="targetAttendance" name="targetAttendance" type="number" min="0" value={formData.targetAttendance} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} />
                </div>
                {isEditing && (
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={loading}>{loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">{completedEvents} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Campaign Events</CardTitle>
            <CardDescription>All your scheduled and completed events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="rally">Rally</SelectItem>
                  <SelectItem value="door to door">Door-to-Door</SelectItem>
                  <SelectItem value="survey">Survey</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredEvents.map((event) => {
                return (
                  <div key={event._id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getBadgeClass(event.eventType)}>
                          {event.eventType.replace(' ', '-')}
                        </Badge>
                        <h3 className="font-medium">{event.eventTitle}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(event.status)}
                        <Badge variant="secondary" className={getStatusBadgeClass(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                      <MapPin className="h-4 w-4" />
                      <span>{event.venue}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        {event.status === 'scheduled' ? 'Target Attendees' : 'Attendance Progress'}
                      </div>
                      <Progress value={getProgressValue(event)} className="w-full" />
                      <div className="text-xs text-muted-foreground">{getProgressLabel(event)}</div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {event.status === 'ongoing' && (
                        <Button variant="ghost" size="sm" onClick={() => handleComplete(event._id)}>
                          Complete
                        </Button>
                      )}
                      {event.status !== 'ongoing' && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                          Edit
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(event._id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })}
              {filteredEvents.length === 0 && (
                <p className="text-center text-muted-foreground">No events found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming This Week</CardTitle>
            <CardDescription>Events scheduled for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingThisWeek.slice(0, 3).map((event) => (
              <div key={event._id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                {getStatusIcon(event.status)}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{event.eventTitle}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {event.time} - {event.venue}
                  </p>
                  <div className="text-xs text-muted-foreground">Target {event.targetAttendance} attendees</div>
                </div>
                {event.status === 'ongoing' && <Badge className="text-xs">Live</Badge>}
              </div>
            ))}
            {upcomingThisWeek.length === 0 && (
              <p className="text-center text-muted-foreground text-sm">No upcoming events this week.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Events