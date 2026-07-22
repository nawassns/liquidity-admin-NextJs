"use client";

import {
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Pagination,
  Select,
  Stack,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable, StatusBadge } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

interface WalletTx {
  _id: string;
  user?: { _id: string; name: string };
  type: string;
  amount: number;
  description?: string;
  createdAt: string;
}

export default function WalletPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | null>("");
  const [modalOpen, setModalOpen] = useState<"credit" | "debit" | null>(null);

  const query = buildQuery({ page, limit: 10, type: typeFilter });
  const { data, isLoading } = useQuery({
    queryKey: ["wallet-tx", page, typeFilter],
    queryFn: async () => api.get(`/wallet/transactions${query}`),
  });
  const txs = (data?.data as WalletTx[]) || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const usersQ = useQuery({
    queryKey: ["users-list-w"],
    queryFn: async () => api.get(`/users?limit=200`),
  });

  const form = useForm({
    initialValues: { userId: "", amount: 0, description: "" },
    validate: {
      userId: (value) => (value ? null : "Please select a user"),
      amount: (value) =>
        Number(value) > 0 ? null : "Amount must be greater than 0",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (!modalOpen) return { success: false, message: "Select credit or debit" };
      return api.post(`/wallet/${modalOpen}`, {
        ...values,
        amount: Number(values.amount),
      });
    },
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({
          color: "red",
          title: res.message || "Wallet update failed",
          message: res.error || "Please check the selected user and amount.",
        });
        return;
      }
      notifications.show({
        color: "green",
        message: res.message || "Wallet balance updated successfully",
      });
      setModalOpen(null);
      form.reset();
      qc.invalidateQueries({ queryKey: ["wallet-tx"] });
      qc.invalidateQueries({ queryKey: ["users-list-w"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      notifications.show({
        color: "red",
        title: "Could not reach the wallet API",
        message: error instanceof Error ? error.message : "Network request failed",
      });
    },
  });

  const userOptions =
    ((usersQ.data?.data as any[]) || []).map((u) => ({
      value: u._id,
      label: `${u.name} (${u.email || u.mobile || u._id.slice(-6)}) — Balance ₹${Number(u.walletBalance || 0).toLocaleString()}`,
    })) || [];

  return (
    <PageContainer title="Wallet Transactions">
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <Select
            placeholder="All Types"
            value={typeFilter}
            onChange={setTypeFilter}
            data={["Credit", "Debit"]}
            clearable
            w={200}
          />
          <Group>
            <Button
              leftSection={<IconArrowUp size={16} />}
              color="green"
              onClick={() => {
                form.reset();
                setModalOpen("credit");
              }}
              data-testid="wallet-credit-btn"
            >
              Credit
            </Button>
            <Button
              leftSection={<IconArrowDown size={16} />}
              color="red"
              variant="light"
              onClick={() => {
                form.reset();
                setModalOpen("debit");
              }}
              data-testid="wallet-debit-btn"
            >
              Debit
            </Button>
          </Group>
        </Group>

        <DataTable<WalletTx>
          testId="wallet-table"
          data={txs}
          loading={isLoading}
          columns={[
            { key: "user", label: "User", render: (r) => r.user?.name || "—" },
            { key: "type", label: "Type", render: (r) => <StatusBadge status={r.type} /> },
            {
              key: "amount",
              label: "Amount",
              render: (r) => `₹${r.amount.toLocaleString()}`,
            },
            { key: "description", label: "Description" },
            {
              key: "createdAt",
              label: "Date",
              render: (r) => new Date(r.createdAt).toLocaleString(),
            },
          ]}
        />

        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination value={page} onChange={setPage} total={totalPages} />
          </Group>
        )}
      </Card>

      <Modal
        opened={!!modalOpen}
        onClose={() => {
          setModalOpen(null);
          form.reset();
        }}
        title={modalOpen === "credit" ? "Credit Wallet" : "Debit Wallet"}
        centered
      >
        <form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
          <Stack>
            <Select
              label="User"
              data={userOptions}
              searchable
              required
              {...form.getInputProps("userId")}
            />
            <NumberInput
              label="Amount"
              min={1}
              required
              {...form.getInputProps("amount")}
            />
            <Textarea label="Description" {...form.getInputProps("description")} />
            <Button type="submit" loading={mutation.isPending}>
              {modalOpen === "credit" ? "Credit" : "Debit"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
}
