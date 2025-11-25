// components/Event.jsx or pages/Event.jsx
import React, { useState, useEffect } from 'react';

const Event = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublishedEvents = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/events/published'); // adjust URL
        const result = await response.json();

        if (result.success) {
          setEvents(result.data);
        } else {
          setError('Failed to load events');
        }
      } catch (err) {
        setError('Network error. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublishedEvents();
  }, []);

  if (loading) return <div className="text-center p-8">Loading events...</div>;
  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upcoming Public Events</h1>

      {events.length === 0 ? (
        <p className="text-gray-600">No published events yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event._id} className="border rounded-lg p-6 shadow hover:shadow-lg transition">
              <h2 className="text-xl font-semibold text-blue-600">{event.eventTitle}</h2>
              <p className="text-sm text-gray-500 capitalize">{event.eventType}</p>

              <div className="mt-3 space-y-2 text-sm">
                <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {event.time}</p>
                <p><strong>Venue:</strong> {event.venue}</p>
                <p><strong>Target:</strong> {event.targetAttendance} attendees</p>
                {event.actualAttendance > 0 && (
                  <p><strong>Actual:</strong> {event.actualAttendance} attended</p>
                )}
              </div>

              {event.description && (
                <p className="mt-4 text-gray-700 text-sm">{event.description}</p>
              )}

              <div className="mt-4 text-xs text-gray-500">
                Organized by: {event.createdBy?.name || 'Unknown'}
              </div>

              <span className={`inline-block mt-3 px-3 py-1 text-xs rounded-full ${
                event.status === 'completed' ? 'bg-green-100 text-green-800' :
                event.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {event.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Event;