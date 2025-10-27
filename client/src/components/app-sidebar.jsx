// src/components/AppSidebar.jsx
// import { IconInnerShadowTopLeft } from "@tabler/icons-react";
import { NavMain } from "@/components/nav-main";
import { Link } from "react-router-dom";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
// import { AuthContext } from "@/context/AuthContext";
// import { sidebarMenuItems, validRoles } from "@/utils/SidebarMenuitem";
import { useContext } from "react";
import { AuthContext } from "@/modules/Common/context/AuthContext";
import { sidebarMenuItems, validRoles } from "@/modules/Common/utils/SidebarMenuitem";

export function AppSidebar({ ...props }) {
  const { user } = useContext(AuthContext);

  const role = user?.role?.name && validRoles.includes(user.role.name) ? user.role.name : null;
  const navMainItems = role ? sidebarMenuItems[role] : [];

  const userData = user
    ? {
        name: user.name || "User",
        email: user.email || "No email",
        avatar: user.profileImage || "/avatars/default.jpg",
      }
    : { name: "Guest", email: "", avatar: "/avatars/default.jpg" };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/">
                {/* <IconInnerShadowTopLeft/> */}
                <span className="text-base font-semibold">Politico 360</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}