import Wards from "@/modules/Candidates/Wards/Wards";
import PrivateRoute from "../context/PrivateRoute";
import Voters from "@/modules/Candidates/voters/Voters";
import Events from "@/modules/Candidates/Events/Events";
import Banners from "@/modules/Candidates/Banners/Banners";
import Dashboard from "@/modules/Candidates/Dashboard/Dashboard";
import Teams from "@/modules/Candidates/Teams/Teams";
import Reports from "@/modules/Candidates/Reports/Reports";
import Joinus from "@/modules/Candidates/Joinus/Joinus";

export const candidateRoutes = [
  {
    path: '/candidate-dashboard',
    element: <PrivateRoute allowedRole="candidate"><Dashboard/></PrivateRoute>,
  },
  {
    path: '/candidate-dashboard/streets-wards',
    element: <PrivateRoute allowedRole="candidate"><Wards/></PrivateRoute>,
  },
  {
    path: '/candidate-dashboard/voters',
    element: <PrivateRoute allowedRole="candidate"><Voters/></PrivateRoute>,
  },
  {
    path: '/candidate-dashboard/events',
    element: <PrivateRoute allowedRole="candidate"><Events/></PrivateRoute>,
  },
  {
    path: '/candidate-dashboard/banner',
    element: <PrivateRoute allowedRole="candidate"><Banners/></PrivateRoute>,
  },
  {
    path: '/candidate-dashboard/teams',
    element: <PrivateRoute allowedRole="candidate"><Teams/></PrivateRoute>,
  },
  {
    path: '/candidate-dashboard/reports',
    element: <PrivateRoute allowedRole="candidate"><Reports/></PrivateRoute>,
  },
  {
    path: '/candidate-dashboard/joinus',
    element: <PrivateRoute allowedRole="candidate"><Joinus/></PrivateRoute>,
  },
];