import Dashbaord from "@/modules/RootAdmin/Dashboard/Dashbaord";
import PrivateRoute from "../context/PrivateRoute";
import Parties from "@/modules/RootAdmin/Parties/Parties";
import Candidates from "@/modules/RootAdmin/candidates/Candidates";
export const rootAdminRoutes = [
  {
    path: '/root-admin-dashboard',
    element: <PrivateRoute allowedRole="root_admin"><Dashbaord/></PrivateRoute>,
  },
  {
    path: '/root-admin-dashboard/parties',
    element: <PrivateRoute allowedRole="root_admin"><Parties/></PrivateRoute>,
  },
  {
    path: '/root-admin-dashboard/candidates',
    element: <PrivateRoute allowedRole="root_admin"><Candidates /></PrivateRoute>,
  },
//   {
//     path: '/root-admin-dashboard/roles',
//     element: <PrivateRoute allowedRole="root_admin"><RolesPermissions /></PrivateRoute>,
//   },
//   {
//     path: '/root-admin-dashboard/system-logs',
//     element: <PrivateRoute allowedRole="root_admin"><SystemLogs /></PrivateRoute>,
//   },
];