import PrivateRoute from "../context/PrivateRoute";
export const rootAdminRoutes = [
  {
    path: '/root-admin-dashboard',
    element: <PrivateRoute allowedRole="root_admin"><>Dashboard</></PrivateRoute>,
  },
//   {
//     path: '/root-admin-dashboard/users',
//     element: <PrivateRoute allowedRole="root_admin"><ManageUsers /></PrivateRoute>,
//   },
//   {
//     path: '/root-admin-dashboard/roles',
//     element: <PrivateRoute allowedRole="root_admin"><RolesPermissions /></PrivateRoute>,
//   },
//   {
//     path: '/root-admin-dashboard/system-logs',
//     element: <PrivateRoute allowedRole="root_admin"><SystemLogs /></PrivateRoute>,
//   },
];