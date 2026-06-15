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
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable, StatusBadge } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

interface OutletTx {
  _id: string;
  outletId?: { _id: string; name: string };
  transactionType: string;
  amount: number;
  paymentMode: string;
  status: string;
  paidOn?: string;
  description?: string;
}

export default function OutletTransactionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | null>("");
  const [editing, setEditing] = useState<OutletTx | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const query = buildQuery({ page, limit: 10, type: typeFilter });
  const { data, isLoading } = useQuery({
    queryKey: ["outlet-tx", page, typeFilter],
    queryFn: async () => api.get(`/outlet-transactions${query}`),
  });
  const txs = (data?.data?.transactions as OutletTx[]) || (data?.data as OutletTx[]) || [];
  const summary = data?.data?.summary || {};
  const totalPages = data?.pagination?.totalPages || 1;

  const payableQ = useQuery({
    queryKey: ["amount-payable"],
    queryFn: async () => api.get(`/outlet-transactions/amount-payable`),
  });
  const payable = payableQ.data?.data;

  const outletsQ = useQuery({
    queryKey: ["outlets-list-ot"],
    queryFn: async () => api.get(`/outlets?limit=200`),
  });

  const form = useForm({
    initialValues: {
      outletId: "",
      transactionType: "CREDIT",
      amount: 0,
      paymentMode: "BankTransfer",
      referenceNo: "",
      description: "",
      paidOn: new Date().toISOString().slice(0, 10),
      status: "Completed",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  };
  const openEdit = (r: any) => {
    setEditing(r);
    form.setValues({
      ...form.values,
      outletId: r.outletId?._id || r.outletId || "",
      transactionType: r.transactionType,
      amount: r.amount,
      paymentMode: r.paymentMode,
      referenceNo: r.referenceNo || "",
      description: r.description || "",
      paidOn: r.paidOn?.slice(0, 10) || "",
      status: r.status,
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (editing) return api.put(`/outlet-transactions/${editing._id}`, values);
      return api.post(`/outlet-transactions`, values);
    },
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Saved" });
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["outlet-tx"] });
      qc.invalidateQueries({ queryKey: ["amount-payable"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/outlet-transactions/${id}`),
    onSuccess: () => {
      notifications.show({ color: "green", message: "Deleted" });
      qc.invalidateQueries({ queryKey: ["outlet-tx"] });
    },
  });

  const outletOptions =
    ((outletsQ.data?.data as any[]) || []).map((o) => ({
      value: o._id,
      label: o.name,
    })) || [];

  return (
    <PageContainer title="Outlet Transactions">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md">
        <Card withBorder radius="md" p="md">
          <Text size="xs" c="dimmed">Total Revenue</Text>
          <Title order={4}>₹{(payable?.summary?.totalRevenue ?? 0).toLocaleString()}</Title>
        </Card>
        <Card withBorder radius="md" p="md">
          <Text size="xs" c="dimmed">Total Payable</Text>
          <Title order={4}>₹{(payable?.summary?.totalPayable ?? 0).toLocaleString()}</Title>
        </Card>
        <Card withBorder radius="md" p="md">
          <Text size="xs" c="dimmed">Total Paid</Text>
          <Title order={4}>₹{(payable?.summary?.totalPaid ?? 0).toLocaleString()}</Title>
        </Card>
        <Card withBorder radius="md" p="md">
          <Text size="xs" c="dimmed">Balance Due</Text>
          <Title order={4} c="red">₹{(payable?.summary?.totalBalance ?? 0).toLocaleString()}</Title>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="md" p="md" mb="md">
        <Title order={5} mb="sm">Amount Payable Per Outlet</Title>
        <DataTable
          testId="amount-payable-table"
          data={(payable?.outlets as any[]) || []}
          loading={payableQ.isLoading}
          rowKey={(r: any) => r.outletId}
          columns={[
            { key: "name", label: "Outlet" },
            {
              key: "totalRevenue",
              label: "Revenue",
              render: (r: any) => `₹${(r.totalRevenue ?? 0).toLocaleString()}`,
            },
            {
              key: "totalPayable",
              label: "Payable",
              render: (r: any) => `₹${(r.totalPayable ?? 0).toLocaleString()}`,
            },
            {
              key: "totalPaid",
              label: "Paid",
              render: (r: any) => `₹${(r.totalPaid ?? 0).toLocaleString()}`,
            },
            {
              key: "balanceDue",
              label: "Balance Due",
              render: (r: any) => (
                <Text c={r.balanceDue > 0 ? "red" : "green"} fw={600}>
                  ₹{(r.balanceDue ?? 0).toLocaleString()}
                </Text>
              ),
            },
          ]}
        />
      </Card>

      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <Group>
            <Select
              placeholder="All Types"
              value={typeFilter}
              onChange={setTypeFilter}
              data={["", "CREDIT", "DEBIT"]}
              clearable
              w={180}
            />
            {summary.CREDIT !== undefined && (
              <Text size="sm">
                Credit: ₹{(summary.CREDIT ?? 0).toLocaleString()} | Debit: ₹
                {(summary.DEBIT ?? 0).toLocaleString()}
              </Text>
            )}
          </Group>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Add Transaction
          </Button>
        </Group>

        <DataTable<OutletTx>
          testId="outlet-tx-table"
          data={txs}
          loading={isLoading}
          columns={[
            {
              key: "outletId",
              label: "Outlet",
              render: (r: any) => r.outletId?.name || "—",
            },
            {
              key: "transactionType",
              label: "Type",
              render: (r) => <StatusBadge status={r.transactionType} />,
            },
            {
              key: "amount",
              label: "Amount",
              render: (r) => `₹${r.amount.toLocaleString()}`,
            },
            { key: "paymentMode", label: "Mode" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            {
              key: "paidOn",
              label: "Paid On",
              render: (r) =>
                r.paidOn ? new Date(r.paidOn).toLocaleDateString() : "—",
            },
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
                  if (confirm("Delete?")) deleteMutation.mutate(row._id);
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Transaction" : "Add Transaction"} centered>
        <form onSubmit={form.onSubmit((v) => saveMutation.mutate(v))}>
          <Stack>
            <Select
              label="Outlet"
              data={outletOptions}
              searchable
              required
              {...form.getInputProps("outletId")}
            />
            <Select
              label="Type"
              data={["CREDIT", "DEBIT"]}
              {...form.getInputProps("transactionType")}
            />
            <NumberInput label="Amount" required {...form.getInputProps("amount")} />
            <Select
              label="Payment Mode"
              data={["BankTransfer", "Cash", "Cheque", "UPI", "Other"]}
              {...form.getInputProps("paymentMode")}
            />
            <TextInput label="Reference No" {...form.getInputProps("referenceNo")} />
            <TextInput label="Paid On" type="date" {...form.getInputProps("paidOn")} />
            <Textarea label="Description" {...form.getInputProps("description")} />
            <Select
              label="Status"
              data={["Pending", "Completed", "Failed"]}
              {...form.getInputProps("status")}
            />
            <Button type="submit" loading={saveMutation.isPending}>
              Save
            </Button>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
}
