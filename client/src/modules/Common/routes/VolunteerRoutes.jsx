import Voters from "@/modules/Volunteers/Voters/Voters";
import PrivateRoute from "../context/PrivateRoute";
import Task from "@/modules/Volunteers/Task/Task";
import Events from "@/modules/Volunteers/Events/Event"

export const volunteerRoutes = [
  {
    path: '/volunteers-dashboard',
    element: <PrivateRoute allowedRole="volunteers"><>Dash</></PrivateRoute>,
  },
  {
    path: '/volunteers-dashboard/task',
    element: <PrivateRoute allowedRole="volunteers"><Task/></PrivateRoute>,
  },
  {
    path: '/volunteers-dashboard/voters',
    element: <PrivateRoute allowedRole="volunteers"><Voters/></PrivateRoute>,
  },
   {
    path: '/volunteers-dashboard/events',
    element: <PrivateRoute allowedRole="volunteers"><Events/></PrivateRoute>,
  },

];