// src/utils/SidebarMenuitem.jsx
import { 
  MdDashboard, 
  MdPerson, 
  MdPersonAdd, 
  MdEvent, 
  MdChecklist 
} from "react-icons/md";
import { FaBriefcase } from "react-icons/fa";
import { MdPlaylistAdd } from "react-icons/md";
import { Award, Badge, Calendar, ChartColumn, ChartLine, Image, LayoutDashboard, MapPin, NotepadText, User, User2Icon, Users, Vote } from "lucide-react";

import { RiTeamLine } from "react-icons/ri";
import { LuImageUp } from "react-icons/lu";

export const sidebarMenuItems = {
  root_admin: [
    { url: "/root-admin-dashboard", title: "Dashboard", icon: MdDashboard },
    { url: "/root-admin-dashboard/parties", title: "Parties", icon: MdPlaylistAdd },
    { url: "/root-admin-dashboard/candidates", title: "Candidates", icon: User },
  ],
  admin: [
    { url: "/admin-dashboard", title: "Dashboard", icon: MdDashboard },
    { url: "/admin-dashboard/streets-wards", title: "Streets / Wards", icon: MdChecklist },
  ],
  candidate: [
    { url: "/candidate-dashboard", title: "Dashboard", icon: LayoutDashboard  },
    { url: "/candidate-dashboard/streets-wards", title: "Streets / Wards", icon: MapPin },
    { url: "/candidate-dashboard/joinus", title: "My Join us", icon: Award },
    { url: "/candidate-dashboard/events", title: "My Events", icon: Calendar },
    { url: "/candidate-dashboard/voters", title: "My Voters", icon: Vote },
    { url: "/candidate-dashboard/teams", title: "My Teams", icon: RiTeamLine },
    { url: "/candidate-dashboard/reports", title: "My Reports", icon: ChartLine },
    { url: "/candidate-dashboard/banner", title: "Banners", icon: LuImageUp },
  ],
  volunteers: [
    { url: "/volunteers-dashboard", title: "Dashboard", icon: MdDashboard },
    { url: "/volunteers-dashboard/voters", title: "My Voters", icon: Vote },
    { url: "/volunteers-dashboard/task", title: "My Task", icon: NotepadText },

  ],
};

export const validRoles = ["root_admin", "admin", "candidate", "volunteers"];
