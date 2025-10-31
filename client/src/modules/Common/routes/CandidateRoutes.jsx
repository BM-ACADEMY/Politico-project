import Wards from "@/modules/Candidates/Wards/Wards";
import PrivateRoute from "../context/PrivateRoute";
import Voters from "@/modules/Candidates/voters/Voters";

export const candidateRoutes = [
  {
    path: '/candidate-dashboard',
    element: <PrivateRoute allowedRole="candidate"><>Dash</></PrivateRoute>,
  },
  {
    path: '/candidate-dashboard/streets-wards',
    element: <PrivateRoute allowedRole="candidate"><Wards/></PrivateRoute>,
  },
  {
    path: '/candidate-dashboard/voters',
    element: <PrivateRoute allowedRole="candidate"><Voters/></PrivateRoute>,
  },

];