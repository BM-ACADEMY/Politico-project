import Voters from "@/modules/Volunteers/Voters";
import PrivateRoute from "../context/PrivateRoute";


export const volunteerRoutes = [
  {
    path: '/volunteers-dashboard',
    element: <PrivateRoute allowedRole="volunteers"><>Dash</></PrivateRoute>,
  },
  {
    path: '/volunteers-dashboard/voters',
    element: <PrivateRoute allowedRole="volunteers"><Voters/></PrivateRoute>,
  },

];