import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

import {
  ColorSchemeScript,
  DirectionProvider,
  MantineProvider,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { theme } from "@/styles/theme";
import { AppProvider } from "./provider";

export const metadata = {
  title: { default: "Liquidity Admin", template: "%s | Liquidity Admin" },
  description: "Liquidity Bars — Super Admin Dashboard",
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <head>
        <ColorSchemeScript />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </head>
      <body>
        <DirectionProvider>
          <MantineProvider theme={theme} defaultColorScheme="light">
            <ModalsProvider>
              <AppProvider>{children}</AppProvider>
            </ModalsProvider>
            <Notifications position="top-right" />
          </MantineProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
