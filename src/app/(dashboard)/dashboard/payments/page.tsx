"use client";

import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Pagination,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable, StatusBadge } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

interface Payment {
  _id: string;
  outlet?: { _id: string; name: string };
  amount: number;
  paymentMethod: string;
  status: string;
  paymentDate: string;
  referenceNumber?: string;
}

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>("");
  const [editing, setEditing] = useState<Payment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const query = buildQuery({ page, limit: 10, status: statusFilter });
  const { data, isLoading } = useQuery({
    queryKey: ["payments", page, statusFilter],
    queryFn: async () => api.get(`/payments${query}`),
  });
  const payments = (data?.data as Payment[]) || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const outletsQ = useQuery({
    queryKey: ["outlets-list-p"],
    queryFn: async () => api.get(`/outlets?limit=200`),
  });

  const form = useForm({
    initialValues: {
      outlet: "",
      amount: 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "Bank Transfer",
      referenceNumber: "",
      notes: "",
      status: "Completed",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    form.setValues({
      ...form.values,
      outlet: p.outlet?._id || "",
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      referenceNumber: p.referenceNumber || "",
      notes: p.notes || "",
      status: p.status,
      paymentDate: p.paymentDate?.slice(0, 10) || "",
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (editing) return api.put(`/payments/${editing._id}`, values);
      return api.post(`/payments`, values);
    },
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Saved" });
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/payments/${id}`),
    onSuccess: () => {
      notifications.show({ color: "green", message: "Deleted" });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  const outletOptions =
    ((outletsQ.data?.data as any[]) || []).map((o) => ({
      value: o._id,
      label: o.name,
    })) || [];

  return (
    <PageContainer title="Payments">
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <Select
            placeholder="All Status"
            value={statusFilter}
            onChange={setStatusFilter}
            data={["", "Pending", "Completed", "Failed"]}
            clearable
            w={200}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate} data-testid="payments-create-btn">
            Add Payment
          </Button>
        </Group>

        <DataTable<Payment>
          testId="payments-table"
          data={payments}
          loading={isLoading}
          columns={[
            { key: "outlet", label: "Outlet", render: (r) => r.outlet?.name || "—" },
            {
              key: "amount",
              label: "Amount",
              render: (r) => `₹${r.amount.toLocaleString()}`,
            },
            { key: "paymentMethod", label: "Method" },
            { key: "referenceNumber", label: "Reference" },
            {
              key: "paymentDate",
              label: "Date",
              render: (r) =>
                r.paymentDate
                  ? new Date(r.paymentDate).toLocaleDateString()
                  : "—",
            },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
          actions={(row) => (
            <>
              <ActionIcon variant="light" color="blue" onClick={() => openEdit(row)}>
                <IconEdit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                onClick={() => {
                  if (confirm("Delete payment?")) deleteMutation.mutate(row._id);
                }}
              >
                <IconTrash size={16} />
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Payment" : "Add Payment"} centered>
        <form onSubmit={form.onSubmit((v) => saveMutation.mutate(v))}>
          <Stack>
            <Select
              label="Outlet"
              data={outletOptions}
              searchable
              required
              {...form.getInputProps("outlet")}
            />
            <NumberInput label="Amount" required {...form.getInputProps("amount")} />
            <TextInput
              label="Payment Date"
              type="date"
              {...form.getInputProps("paymentDate")}
            />
            <Select
              label="Method"
              data={["Bank Transfer", "Cheque", "Cash", "Other"]}
              {...form.getInputProps("paymentMethod")}
            />
            <TextInput label="Reference Number" {...form.getInputProps("referenceNumber")} />
            <Textarea label="Notes" {...form.getInputProps("notes")} />
            <Select
              label="Status"
              data={["Pending", "Completed", "Failed"]}
              {...form.getInputProps("status")}
            />
            <Button type="submit" loading={saveMutation.isPending}>Save</Button>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
}
