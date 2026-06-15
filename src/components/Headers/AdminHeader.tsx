"use client";

import { ActionIcon, Box, Menu, Text } from "@mantine/core";
import {
  IconLogout,
  IconUserCircle,
  IconBuildingStore,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import classes from "./AdminHeader.module.css";
import { useAuth } from "@/lib/auth";

interface Props {
  burger?: React.ReactNode;
}

export function AdminHeader({ burger }: Props) {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <header className={classes.header} data-testid="admin-header">
      {burger && burger}
      <Box style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <IconBuildingStore size={26} color="#3a4bdd" />
        <Text fw={700} size="lg">
          Liquidity Admin
        </Text>
      </Box>
      <Box style={{ flex: 1 }} />
      <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="subtle" size="lg" data-testid="user-menu-btn">
            <IconUserCircle size="1.5rem" />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>
            <Text size="xs" fw={600}>
              {user?.name || "Admin"}
            </Text>
            <Text size="xs" c="dimmed">
              {user?.email}
            </Text>
          </Menu.Label>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconUserCircle size={14} />}
            onClick={() => router.push("/dashboard/profile")}
            data-testid="menu-profile"
          >
            Profile
          </Menu.Item>
          <Menu.Item
            color="red"
            leftSection={<IconLogout size={14} />}
            onClick={logout}
            data-testid="menu-logout"
          >
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </header>
  );
}
