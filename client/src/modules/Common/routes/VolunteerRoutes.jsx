import PrivateRoute from "../context/PrivateRoute";


export const volunteerRoutes = [
  {
    path: '/volunteer-dashboard',
    element: <PrivateRoute allowedRole="volunteers"><>Dash</></PrivateRoute>,
  },
//   {
//     path: '/volunteer-dashboard/tasks',
//     element: <PrivateRoute allowedRole="volunteers"><Tasks /></PrivateRoute>,
//   },
//   {
//     path: '/volunteer-dashboard/events',
//     element: <PrivateRoute allowedRole="volunteers"><Events /></PrivateRoute>,
//   },
//   {
//     path: '/volunteer-dashboard/profile',
//     element: <PrivateRoute allowedRole="volunteers"><Profile /></PrivateRoute>,
//   },
];