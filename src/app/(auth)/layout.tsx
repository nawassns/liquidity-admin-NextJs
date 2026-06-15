"use client";

import { Box } from "@mantine/core";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #ecefff 0%, #f7f8ff 50%, #ecefff 100%)",
        padding: "1rem",
      }}
    >
      {children}
    </Box>
  );
}
