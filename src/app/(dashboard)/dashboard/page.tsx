"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  CopyButton,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBuildingStore,
  IconCash,
  IconChartBar,
  IconClipboard,
  IconClipboardCheck,
  IconShoppingCart,
  IconUsers,
  IconBottle,
  IconTrendingUp,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageContainer } from "@/components/PageContainer/PageContainer";

interface OverviewData {
  activeUsers: number;
  totalUsers: number;
  totalOutlets: number;
  totalOrders: number;
  totalOrderAmount: number;
  totalVaultOrders: number;
  totalVaultOrderAmount: number;
}

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}) {
  return (
    <Card withBorder radius="md" p="lg" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text c="dimmed" size="xs" fw={600} tt="uppercase">
            {label}
          </Text>
          {loading ? (
            <Skeleton height={28} width={120} />
          ) : (
            <Title order={3}>{value}</Title>
          )}
        </Stack>
        <ThemeIcon variant="light" color={color} size={42} radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const res = await api.get<OverviewData>("/dashboard");
      return res.data;
    },
  });

  const recentOrdersQ = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const res = await api.get("/dashboard/recent-orders?limit=5");
      return res.data || [];
    },
  });

  const outletStatsQ = useQuery({
    queryKey: ["outlets-stats"],
    queryFn: async () => {
      const res = await api.get("/dashboard/outlets-stats");
      return res.data || [];
    },
  });

  const growthQ = useQuery({
    queryKey: ["growth"],
    queryFn: async () => {
      const res = await api.get("/dashboard/growth");
      return res.data as any;
    },
  });
  const growth = growthQ.data;

  const summaryText = growth
    ? `Liquidity Daily Summary — ${growth.yesterday.date}\n\nYesterday's revenue: ₹${growth.yesterday.revenue.toLocaleString()}\nOrders: ${growth.yesterday.orderCount}\nTop outlet: ${growth.yesterday.topOutlet ? `${growth.yesterday.topOutlet.name} (₹${growth.yesterday.topOutlet.totalSales.toLocaleString()}, ${growth.yesterday.topOutlet.orderCount} orders)` : "—"}\n\nThis week vs last week:\nRevenue ₹${growth.weekOverWeek.thisWeekRevenue.toLocaleString()} (${growth.weekOverWeek.growthPct >= 0 ? "+" : ""}${growth.weekOverWeek.growthPct}%)\nOrders ${growth.weekOverWeek.thisWeekOrders} (${growth.weekOverWeek.orderGrowthPct >= 0 ? "+" : ""}${growth.weekOverWeek.orderGrowthPct}%)\n\nKeep it flowing! 🥃`
    : "";

  return (
    <PageContainer title="Dashboard Overview">
      <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing="md">
        <StatCard
          label="Total Users"
          value={data?.totalUsers ?? 0}
          icon={<IconUsers size={22} />}
          color="blue"
          loading={isLoading}
        />
        <StatCard
          label="Active Users"
          value={data?.activeUsers ?? 0}
          icon={<IconUsers size={22} />}
          color="green"
          loading={isLoading}
        />
        <StatCard
          label="Total Outlets"
          value={data?.totalOutlets ?? 0}
          icon={<IconBuildingStore size={22} />}
          color="grape"
          loading={isLoading}
        />
        <StatCard
          label="Total Orders"
          value={data?.totalOrders ?? 0}
          icon={<IconShoppingCart size={22} />}
          color="orange"
          loading={isLoading}
        />
        <StatCard
          label="Order Revenue"
          value={`₹${(data?.totalOrderAmount ?? 0).toLocaleString()}`}
          icon={<IconCash size={22} />}
          color="teal"
          loading={isLoading}
        />
        <StatCard
          label="Vault Orders"
          value={data?.totalVaultOrders ?? 0}
          icon={<IconBottle size={22} />}
          color="cyan"
          loading={isLoading}
        />
        <StatCard
          label="Vault Revenue"
          value={`₹${(data?.totalVaultOrderAmount ?? 0).toLocaleString()}`}
          icon={<IconCash size={22} />}
          color="indigo"
          loading={isLoading}
        />
        <StatCard
          label="Gross Revenue"
          value={`₹${(
            (data?.totalOrderAmount ?? 0) + (data?.totalVaultOrderAmount ?? 0)
          ).toLocaleString()}`}
          icon={<IconChartBar size={22} />}
          color="pink"
          loading={isLoading}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" mt="lg">
        <Card withBorder radius="md" p="lg" data-testid="card-growth">
          <Group justify="space-between" mb="xs">
            <Title order={5}>
              <Group gap={6}>
                <IconTrendingUp size={20} /> Week-over-Week Growth
              </Group>
            </Title>
          </Group>
          {growthQ.isLoading || !growth ? (
            <Skeleton height={120} />
          ) : (
            <Stack gap="sm">
              <Group justify="space-between" align="flex-end">
                <Box>
                  <Text size="xs" c="dimmed">This week revenue</Text>
                  <Title order={3}>
                    ₹{growth.weekOverWeek.thisWeekRevenue.toLocaleString()}
                  </Title>
                  <Text size="xs" c="dimmed">
                    Last week: ₹
                    {growth.weekOverWeek.prevWeekRevenue.toLocaleString()}
                  </Text>
                </Box>
                <Badge
                  size="xl"
                  color={growth.weekOverWeek.growthPct >= 0 ? "green" : "red"}
                  variant="light"
                  leftSection={
                    growth.weekOverWeek.growthPct >= 0 ? (
                      <IconArrowUpRight size={16} />
                    ) : (
                      <IconArrowDownRight size={16} />
                    )
                  }
                  data-testid="growth-revenue-pct"
                >
                  {growth.weekOverWeek.growthPct >= 0 ? "+" : ""}
                  {growth.weekOverWeek.growthPct}%
                </Badge>
              </Group>
              <Group justify="space-between" align="flex-end">
                <Box>
                  <Text size="xs" c="dimmed">Orders this week</Text>
                  <Title order={4}>
                    {growth.weekOverWeek.thisWeekOrders}
                  </Title>
                  <Text size="xs" c="dimmed">
                    Last week: {growth.weekOverWeek.prevWeekOrders}
                  </Text>
                </Box>
                <Badge
                  size="lg"
                  color={
                    growth.weekOverWeek.orderGrowthPct >= 0 ? "green" : "red"
                  }
                  variant="light"
                  data-testid="growth-orders-pct"
                >
                  {growth.weekOverWeek.orderGrowthPct >= 0 ? "+" : ""}
                  {growth.weekOverWeek.orderGrowthPct}%
                </Badge>
              </Group>
            </Stack>
          )}
        </Card>

        <Card withBorder radius="md" p="lg" data-testid="card-daily-summary">
          <Group justify="space-between" mb="xs" wrap="nowrap">
            <Title order={5}>Daily Summary — Yesterday</Title>
            {growth && (
              <CopyButton value={summaryText}>
                {({ copied, copy }) => (
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={
                      copied ? (
                        <IconClipboardCheck size={14} />
                      ) : (
                        <IconClipboard size={14} />
                      )
                    }
                    onClick={copy}
                    data-testid="copy-summary-btn"
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                )}
              </CopyButton>
            )}
          </Group>
          {growthQ.isLoading || !growth ? (
            <Skeleton height={120} />
          ) : (
            <Stack gap="xs">
              <Text size="xs" c="dimmed">{growth.yesterday.date}</Text>
              <Group justify="space-between">
                <Text size="sm">Revenue</Text>
                <Text fw={600}>
                  ₹{growth.yesterday.revenue.toLocaleString()}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Orders</Text>
                <Text fw={600}>{growth.yesterday.orderCount}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Top outlet</Text>
                <Text fw={600}>
                  {growth.yesterday.topOutlet
                    ? `${growth.yesterday.topOutlet.name} · ₹${growth.yesterday.topOutlet.totalSales.toLocaleString()}`
                    : "—"}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt={4}>
                Tip: click <b>Copy</b> to paste this into an email or WhatsApp
                broadcast to your outlet owners.
              </Text>
            </Stack>
          )}
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" mt="lg">
        <Card withBorder radius="md" p="lg" data-testid="card-recent-orders">
          <Title order={5} mb="md">
            Recent Orders
          </Title>
          {recentOrdersQ.isLoading ? (
            <Skeleton height={200} />
          ) : (recentOrdersQ.data as any[])?.length ? (
            <Stack gap="xs">
              {(recentOrdersQ.data as any[]).slice(0, 5).map((o) => (
                <Group key={o._id} justify="space-between">
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>
                      {o.outlet?.name || "Outlet"}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {new Date(o.createdAt).toLocaleDateString()} · {o.status}
                    </Text>
                  </Stack>
                  <Text size="sm" fw={600}>
                    ₹{(o.totalAmount ?? 0).toLocaleString()}
                  </Text>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" size="sm">
              No recent orders
            </Text>
          )}
        </Card>

        <Card withBorder radius="md" p="lg" data-testid="card-outlet-stats">
          <Title order={5} mb="md">
            Top Outlets
          </Title>
          {outletStatsQ.isLoading ? (
            <Skeleton height={200} />
          ) : (outletStatsQ.data as any[])?.length ? (
            <Stack gap="xs">
              {(outletStatsQ.data as any[]).slice(0, 5).map((o) => (
                <Group key={o.outletId} justify="space-between">
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>
                      {o.outletName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {o.totalOrders} orders
                    </Text>
                  </Stack>
                  <Text size="sm" fw={600}>
                    ₹{(o.totalSales ?? 0).toLocaleString()}
                  </Text>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" size="sm">
              No outlet data yet
            </Text>
          )}
        </Card>
      </SimpleGrid>
    </PageContainer>
  );
}
