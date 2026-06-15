"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Pagination,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconEye } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable, StatusBadge } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

interface Order {
  _id: string;
  orderNumber?: string;
  outlet?: { _id: string; name: string };
  user?: { _id: string; name: string };
  totalAmount?: number;
  status: string;
  createdAt: string;
}

const STATUSES = ["New Order", "Accepted", "Served", "Cancelled", "No Show"];

export default function OrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const query = buildQuery({ page, limit: 10, search, status: statusFilter });
  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, search, statusFilter],
    queryFn: async () => api.get(`/orders${query}`),
  });
  const orders = (data?.data as Order[]) || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const countsQ = useQuery({
    queryKey: ["orders-status-counts"],
    queryFn: async () => api.get(`/orders/status-counts`),
  });

  const statusForm = useForm({ initialValues: { status: "Accepted", notes: "" } });

  const statusMutation = useMutation({
    mutationFn: async (values: typeof statusForm.values) =>
      api.patch(`/orders/${activeOrder?._id}/status`, values),
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Status updated" });
      setStatusOpen(false);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orders-status-counts"] });
    },
  });

  return (
    <PageContainer title="Orders">
      <Group mb="md" wrap="wrap" gap="xs">
        {Object.entries((countsQ.data?.data as Record<string, number>) || {}).map(
          ([key, count]) => (
            <Badge size="lg" key={key} variant="light">
              {key === "all" ? "Total" : key}: {count}
            </Badge>
          ),
        )}
      </Group>

      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <Group wrap="wrap">
            <TextInput
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              w={{ base: "100%", sm: 240 }}
              data-testid="orders-search"
            />
            <Select
              placeholder="All Status"
              value={statusFilter}
              onChange={setStatusFilter}
              data={["", ...STATUSES]}
              clearable
              w={180}
            />
          </Group>
        </Group>

        <DataTable<Order>
          testId="orders-table"
          data={orders}
          loading={isLoading}
          columns={[
            {
              key: "_id",
              label: "Order #",
              render: (r) =>
                r.orderNumber || r._id.slice(-6).toUpperCase(),
            },
            {
              key: "outlet",
              label: "Outlet",
              render: (r) => r.outlet?.name || "—",
            },
            {
              key: "user",
              label: "User",
              render: (r) => r.user?.name || "—",
            },
            {
              key: "totalAmount",
              label: "Amount",
              render: (r) => `₹${(r.totalAmount ?? 0).toLocaleString()}`,
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusBadge status={r.status} />,
            },
            {
              key: "createdAt",
              label: "Date",
              render: (r) => new Date(r.createdAt).toLocaleDateString(),
            },
          ]}
          actions={(row) => (
            <>
              <ActionIcon
                variant="light"
                color="blue"
                onClick={() => {
                  setActiveOrder(row);
                  setViewOpen(true);
                }}
              >
                <IconEye size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="orange"
                onClick={() => {
                  setActiveOrder(row);
                  statusForm.setValues({ status: row.status, notes: "" });
                  setStatusOpen(true);
                }}
                data-testid={`orders-status-${row._id}`}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </>
          )}
        />

        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination value={page} onChange={setPage} total={totalPages} />
          </Group>
        )}
      </Card>

      <Modal opened={statusOpen} onClose={() => setStatusOpen(false)} title="Update Order Status" centered>
        <form onSubmit={statusForm.onSubmit((v) => statusMutation.mutate(v))}>
          <Stack>
            <Select label="Status" data={STATUSES} {...statusForm.getInputProps("status")} />
            <Textarea label="Notes" {...statusForm.getInputProps("notes")} />
            <Button type="submit" loading={statusMutation.isPending}>
              Update
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal opened={viewOpen} onClose={() => setViewOpen(false)} title="Order Details" size="lg">
        {activeOrder && (
          <Stack>
            <Text>
              <b>Order ID:</b> {activeOrder._id}
            </Text>
            <Text>
              <b>Outlet:</b> {activeOrder.outlet?.name || "—"}
            </Text>
            <Text>
              <b>User:</b> {activeOrder.user?.name || "—"}
            </Text>
            <Text>
              <b>Amount:</b> ₹{(activeOrder.totalAmount ?? 0).toLocaleString()}
            </Text>
            <Text>
              <b>Status:</b> <StatusBadge status={activeOrder.status} />
            </Text>
            <Text>
              <b>Created:</b>{" "}
              {new Date(activeOrder.createdAt).toLocaleString()}
            </Text>
          </Stack>
        )}
      </Modal>
    </PageContainer>
  );
}
