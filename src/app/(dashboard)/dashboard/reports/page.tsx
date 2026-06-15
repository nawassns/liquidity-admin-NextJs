"use client";

import { Card, Group, Tabs, TextInput } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

function DateFilters({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: {
  startDate: string;
  endDate: string;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
}) {
  return (
    <Group mb="md" wrap="wrap">
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
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<string | null>("daily");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dailyQ = useQuery({
    queryKey: ["report-daily", date],
    queryFn: async () => api.get(`/reports/daily${buildQuery({ date })}`),
    enabled: activeTab === "daily",
  });

  const dateWiseQ = useQuery({
    queryKey: ["report-date-wise", startDate, endDate],
    queryFn: async () =>
      api.get(`/reports/date-wise${buildQuery({ startDate, endDate })}`),
    enabled: activeTab === "date-wise",
  });

  const outletWiseQ = useQuery({
    queryKey: ["report-outlet-wise", startDate, endDate],
    queryFn: async () =>
      api.get(`/reports/outlet-wise${buildQuery({ startDate, endDate })}`),
    enabled: activeTab === "outlet-wise",
  });

  const categoryWiseQ = useQuery({
    queryKey: ["report-category-wise", startDate, endDate],
    queryFn: async () =>
      api.get(`/reports/category-wise${buildQuery({ startDate, endDate })}`),
    enabled: activeTab === "category-wise",
  });

  const vaultOrdersQ = useQuery({
    queryKey: ["report-vault-orders", startDate, endDate],
    queryFn: async () =>
      api.get(`/reports/vault-orders${buildQuery({ startDate, endDate })}`),
    enabled: activeTab === "vault-orders",
  });

  return (
    <PageContainer title="Reports">
      <Card withBorder p="md" radius="md">
        <Tabs value={activeTab} onChange={setActiveTab} variant="outline">
          <Tabs.List>
            <Tabs.Tab value="daily">Daily</Tabs.Tab>
            <Tabs.Tab value="date-wise">Date-wise</Tabs.Tab>
            <Tabs.Tab value="outlet-wise">Outlet-wise</Tabs.Tab>
            <Tabs.Tab value="category-wise">Category-wise</Tabs.Tab>
            <Tabs.Tab value="vault-orders">Vault Orders</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="daily" pt="md">
            <Group mb="md" wrap="wrap">
              <TextInput
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.currentTarget.value)}
              />
            </Group>
            <DataTable
              testId="report-daily-table"
              data={(dailyQ.data?.data as any[]) || []}
              loading={dailyQ.isLoading}
              rowKey={(r: any) => r._id || r.outletName || JSON.stringify(r)}
              columns={[
                { key: "outletName", label: "Outlet" },
                { key: "orderCount", label: "Orders" },
                {
                  key: "totalSales",
                  label: "Sales",
                  render: (r: any) => `₹${(r.totalSales ?? 0).toLocaleString()}`,
                },
              ]}
            />
          </Tabs.Panel>

          <Tabs.Panel value="date-wise" pt="md">
            <DateFilters
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
            <DataTable
              testId="report-date-wise-table"
              data={(dateWiseQ.data?.data as any[]) || []}
              loading={dateWiseQ.isLoading}
              rowKey={(r: any) => r._id || r.date || JSON.stringify(r)}
              columns={[
                { key: "_id", label: "Date" },
                { key: "orderCount", label: "Orders" },
                {
                  key: "totalSales",
                  label: "Sales",
                  render: (r: any) => `₹${(r.totalSales ?? 0).toLocaleString()}`,
                },
              ]}
            />
          </Tabs.Panel>

          <Tabs.Panel value="outlet-wise" pt="md">
            <DateFilters
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
            <DataTable
              testId="report-outlet-wise-table"
              data={(outletWiseQ.data?.data as any[]) || []}
              loading={outletWiseQ.isLoading}
              rowKey={(r: any) => r.outletId || r._id}
              columns={[
                { key: "outletName", label: "Outlet" },
                { key: "totalOrders", label: "Orders" },
                {
                  key: "totalSales",
                  label: "Sales",
                  render: (r: any) => `₹${(r.totalSales ?? 0).toLocaleString()}`,
                },
              ]}
            />
          </Tabs.Panel>

          <Tabs.Panel value="category-wise" pt="md">
            <DateFilters
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
            <DataTable
              testId="report-category-wise-table"
              data={(categoryWiseQ.data?.data as any[]) || []}
              loading={categoryWiseQ.isLoading}
              rowKey={(r: any) => r._id || r.category}
              columns={[
                { key: "_id", label: "Category" },
                { key: "totalItems", label: "Items" },
                {
                  key: "totalSales",
                  label: "Sales",
                  render: (r: any) => `₹${(r.totalSales ?? 0).toLocaleString()}`,
                },
              ]}
            />
          </Tabs.Panel>

          <Tabs.Panel value="vault-orders" pt="md">
            <DateFilters
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />
            <DataTable
              testId="report-vault-orders-table"
              data={(vaultOrdersQ.data?.data as any[]) || []}
              loading={vaultOrdersQ.isLoading}
              rowKey={(r: any) => r._id}
              columns={[
                { key: "_id", label: "ID", render: (r: any) => String(r._id).slice(-6) },
                {
                  key: "totalAmount",
                  label: "Amount",
                  render: (r: any) => `₹${(r.totalAmount ?? 0).toLocaleString()}`,
                },
                { key: "status", label: "Status" },
              ]}
            />
          </Tabs.Panel>
        </Tabs>
      </Card>
    </PageContainer>
  );
}
