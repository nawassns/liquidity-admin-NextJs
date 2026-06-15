"use client";

import {
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

export default function RevenuePage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const overview = useQuery({
    queryKey: ["revenue", startDate, endDate],
    queryFn: async () =>
      api.get(`/revenue${buildQuery({ startDate, endDate })}`),
  });
  const data = overview.data?.data;

  const outletWise = useQuery({
    queryKey: ["revenue-outlet-wise"],
    queryFn: async () => api.get(`/revenue/outlet-wise`),
  });
  const outletData = (outletWise.data?.data as any[]) || [];

  return (
    <PageContainer title="Liquidity Revenue">
      <Card withBorder radius="md" p="md" mb="md">
        <Group wrap="wrap">
          <TextInput
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.currentTarget.value)}
          />
          <TextInput
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.currentTarget.value)}
          />
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md">
        <Card withBorder p="md" radius="md">
          <Text size="xs" c="dimmed">Order Gross</Text>
          <Title order={4}>₹{(data?.orderGross ?? 0).toLocaleString()}</Title>
          <Text size="xs" c="dimmed">{data?.orderCount ?? 0} orders</Text>
        </Card>
        <Card withBorder p="md" radius="md">
          <Text size="xs" c="dimmed">Vault Gross</Text>
          <Title order={4}>₹{(data?.vaultGross ?? 0).toLocaleString()}</Title>
          <Text size="xs" c="dimmed">{data?.vaultCount ?? 0} orders</Text>
        </Card>
        <Card withBorder p="md" radius="md">
          <Text size="xs" c="dimmed">Gross Revenue</Text>
          <Title order={4}>₹{(data?.grossRevenue ?? 0).toLocaleString()}</Title>
        </Card>
        <Card withBorder p="md" radius="md">
          <Text size="xs" c="dimmed">Net Revenue</Text>
          <Title order={4} c="green">
            ₹{(data?.netRevenue ?? 0).toLocaleString()}
          </Title>
          <Text size="xs" c="dimmed">
            Paid to outlets: ₹{(data?.paidToOutlets ?? 0).toLocaleString()}
          </Text>
        </Card>
      </SimpleGrid>

      <Card withBorder p="md" radius="md">
        <Title order={5} mb="md">Outlet-wise Revenue Breakdown</Title>
        <DataTable
          testId="revenue-outlet-table"
          data={outletData}
          loading={outletWise.isLoading}
          rowKey={(r: any) => r.outletId || r._id}
          columns={[
            { key: "name", label: "Outlet" },
            {
              key: "orderRevenue",
              label: "Order Revenue",
              render: (r: any) => `₹${(r.orderRevenue ?? 0).toLocaleString()}`,
            },
            {
              key: "outletShare",
              label: "Outlet Share",
              render: (r: any) => `₹${(r.outletShare ?? 0).toLocaleString()}`,
            },
            {
              key: "liquidityShare",
              label: "Liquidity Share",
              render: (r: any) => `₹${(r.liquidityShare ?? 0).toLocaleString()}`,
            },
            {
              key: "paidToOutlet",
              label: "Paid",
              render: (r: any) => `₹${(r.paidToOutlet ?? 0).toLocaleString()}`,
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
}
