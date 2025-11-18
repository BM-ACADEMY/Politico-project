import Voters from "@/modules/Volunteers/Voters/Voters";
import PrivateRoute from "../context/PrivateRoute";
import Task from "@/modules/Volunteers/Task/Task";


export const volunteerRoutes = [
  {
    path: '/volunteers-dashboard',
    element: <PrivateRoute allowedRole="volunteers"><>Dash</></PrivateRoute>,
  },
  {
    path: '/volunteers-dashboard/task',
    element: <PrivateRoute allowedRole="volunteers"><Task/></PrivateRoute>,
  },
  // {
  //   path: '/volunteers-dashboard/voters',
  //   element: <PrivateRoute allowedRole="volunteers"><Voters/></PrivateRoute>,
  // },

];