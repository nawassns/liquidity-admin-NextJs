"use client";

import { ScrollArea, Stack } from "@mantine/core";
import type { NavItem } from "@/types/nav-item";
import { NavLinksGroup } from "./NavLinksGroup";
import { useAuth } from "@/lib/auth";
import { UserButton } from "@/components/UserButton/UserButton";
import classes from "./Navbar.module.css";

interface Props {
  data: NavItem[];
  hidden?: boolean;
}

export function Navbar({ data }: Props) {
  const { user } = useAuth();
  const links = data.map((item) => (
    <NavLinksGroup key={item.label} {...item} />
  ));

  return (
    <>
      <ScrollArea className={classes.links}>
        <Stack gap={4} className={classes.linksInner}>
          {links}
        </Stack>
      </ScrollArea>

      <div className={classes.footer}>
        <UserButton
          image=""
          name={user?.name || "Admin"}
          email={user?.email || ""}
        />
      </div>
    </>
  );
}
