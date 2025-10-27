import PrivateRoute from "../context/PrivateRoute";

export const adminRoutes = [
  {
    path: '/admin-dashboard',
    element: <PrivateRoute allowedRole="admin"><>Dash</></PrivateRoute>,
  },
//   {
//     path: '/admin-dashboard/streets-wards',
//     element: <PrivateRoute allowedRole="admin"><StreetsWards /></PrivateRoute>,
//   },
//   {
//     path: '/admin-dashboard/candidates',
//     element: <PrivateRoute allowedRole="admin"><Candidates /></PrivateRoute>,
//   },
//   {
//     path: '/admin-dashboard/voters',
//     element: <PrivateRoute allowedRole="admin"><Voters /></PrivateRoute>,
//   },
];