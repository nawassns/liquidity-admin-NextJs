"use client";

import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  Pagination,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconEdit } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable, StatusBadge } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

interface VaultOrder {
  _id: string;
  outlet?: { _id: string; name: string };
  user?: { _id: string; name: string };
  totalAmount?: number;
  status: string;
  createdAt: string;
}

const STATUSES = ["Pending", "Completed", "Cancelled"];

export default function VaultOrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>("");
  const [activeOrder, setActiveOrder] = useState<VaultOrder | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const query = buildQuery({ page, limit: 10, status: statusFilter });
  const { data, isLoading } = useQuery({
    queryKey: ["vault-orders", page, statusFilter],
    queryFn: async () => api.get(`/vault-orders${query}`),
  });
  const orders = (data?.data as VaultOrder[]) || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const statusForm = useForm({ initialValues: { status: "Completed", notes: "" } });

  const statusMutation = useMutation({
    mutationFn: async (values: typeof statusForm.values) =>
      api.patch(`/vault-orders/${activeOrder?._id}/status`, values),
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Updated" });
      setStatusOpen(false);
      qc.invalidateQueries({ queryKey: ["vault-orders"] });
    },
  });

  return (
    <PageContainer title="Vault Orders">
      <Card withBorder radius="md" p="md">
        <Group mb="md">
          <Select
            placeholder="All Status"
            value={statusFilter}
            onChange={setStatusFilter}
            data={["", ...STATUSES]}
            clearable
            w={200}
          />
        </Group>
        <DataTable<VaultOrder>
          testId="vault-orders-table"
          data={orders}
          loading={isLoading}
          columns={[
            { key: "_id", label: "Order #", render: (r) => r._id.slice(-6).toUpperCase() },
            { key: "outlet", label: "Outlet", render: (r) => r.outlet?.name || "—" },
            { key: "user", label: "User", render: (r) => r.user?.name || "—" },
            {
              key: "totalAmount",
              label: "Amount",
              render: (r) => `₹${(r.totalAmount ?? 0).toLocaleString()}`,
            },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            {
              key: "createdAt",
              label: "Date",
              render: (r) => new Date(r.createdAt).toLocaleDateString(),
            },
          ]}
          actions={(row) => (
            <ActionIcon
              variant="light"
              color="orange"
              onClick={() => {
                setActiveOrder(row);
                statusForm.setValues({ status: row.status, notes: "" });
                setStatusOpen(true);
              }}
            >
              <IconEdit size={16} />
            </ActionIcon>
          )}
        />
        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination value={page} onChange={setPage} total={totalPages} />
          </Group>
        )}
      </Card>

      <Modal opened={statusOpen} onClose={() => setStatusOpen(false)} title="Update Status" centered>
        <form onSubmit={statusForm.onSubmit((v) => statusMutation.mutate(v))}>
          <Stack>
            <Select label="Status" data={STATUSES} {...statusForm.getInputProps("status")} />
            <Textarea label="Notes" {...statusForm.getInputProps("notes")} />
            <Button type="submit" loading={statusMutation.isPending}>Update</Button>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
}
