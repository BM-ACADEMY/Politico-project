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
import { User } from "lucide-react";

export const sidebarMenuItems = {
  root_admin: [
    { url: "/root-admin-dashboard", title: "Dashboard", icon: MdDashboard },
    { url: "/root-admin-dashboard/parties", title: "Parties", icon: MdPlaylistAdd },
    { url: "/root-admin-dashboard/candidates", title: "Candidates", icon: User },
  ],
  admin: [
    { url: "/admin-dashboard", title: "Dashboard", icon: MdDashboard },
    { url: "/admin-dashboard/streets-wards", title: "Streets / Wards", icon: MdChecklist },
    { url: "/admin-dashboard/candidates", title: "Candidates", icon: MdPerson },
    { url: "/admin-dashboard/voters", title: "Voters", icon: MdPersonAdd },
  ],
  candidate: [
    { url: "/candidate-dashboard", title: "Dashboard", icon: MdDashboard },
    { url: "/candidate-dashboard/campaign", title: "Campaign", icon: FaBriefcase },
    { url: "/candidate-dashboard/schedule", title: "Schedule", icon: MdEvent },
    { url: "/candidate-dashboard/profile", title: "Profile", icon: MdPerson },
  ],
  volunteers: [
    { url: "/volunteer-dashboard", title: "Dashboard", icon: MdDashboard },
    { url: "/volunteer-dashboard/tasks", title: "Tasks", icon: MdChecklist },
    { url: "/volunteer-dashboard/events", title: "Events", icon: MdEvent },
    { url: "/volunteer-dashboard/profile", title: "Profile", icon: MdPerson },
  ],
};

export const validRoles = ["root_admin", "admin", "candidate", "volunteers"];
