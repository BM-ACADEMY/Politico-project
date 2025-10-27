import PrivateRoute from "../context/PrivateRoute";

export const candidateRoutes = [
  {
    path: '/candidate-dashboard',
    element: <PrivateRoute allowedRole="candidate"><>Dash</></PrivateRoute>,
  },
//   {
//     path: '/candidate-dashboard/campaign',
//     element: <PrivateRoute allowedRole="candidate"><Campaign /></PrivateRoute>,
//   },
//   {
//     path: '/candidate-dashboard/schedule',
//     element: <PrivateRoute allowedRole="candidate"><Schedule /></PrivateRoute>,
//   },
//   {
//     path: '/candidate-dashboard/profile',
//     element: <PrivateRoute allowedRole="candidate"><Profile /></PrivateRoute>,
//   },
];