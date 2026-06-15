"use client";

import {
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
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable, StatusBadge } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

interface Referral {
  _id: string;
  referrer?: { _id: string; name: string };
  referred?: { _id: string; name: string };
  rewardAmount?: number;
  status: string;
  createdAt: string;
}

export default function ReferralsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>("");
  const [modalOpen, setModalOpen] = useState(false);

  const query = buildQuery({ page, limit: 10, status: statusFilter });
  const { data, isLoading } = useQuery({
    queryKey: ["referrals", page, statusFilter],
    queryFn: async () => api.get(`/referrals${query}`),
  });
  const referrals = (data?.data as Referral[]) || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const statsQ = useQuery({
    queryKey: ["referral-stats"],
    queryFn: async () => api.get(`/referrals/stats`),
  });
  const stats = statsQ.data?.data;

  const usersQ = useQuery({
    queryKey: ["users-list-r"],
    queryFn: async () => api.get(`/users?limit=200`),
  });

  const form = useForm({
    initialValues: { userId: "", amount: 100, referralId: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: typeof form.values) =>
      api.post(`/referrals/credit`, values),
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Credited" });
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["referrals"] });
    },
  });

  const userOptions =
    ((usersQ.data?.data as any[]) || []).map((u) => ({
      value: u._id,
      label: u.name,
    })) || [];

  return (
    <PageContainer title="Referrals">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
        <Card withBorder p="md" radius="md">
          <Text size="xs" c="dimmed">Total Referrals</Text>
          <Title order={4}>{stats?.totalReferrals ?? 0}</Title>
        </Card>
        <Card withBorder p="md" radius="md">
          <Text size="xs" c="dimmed">Completed</Text>
          <Title order={4}>{stats?.completedReferrals ?? 0}</Title>
        </Card>
        <Card withBorder p="md" radius="md">
          <Text size="xs" c="dimmed">Total Rewards</Text>
          <Title order={4}>₹{(stats?.totalRewards ?? 0).toLocaleString()}</Title>
        </Card>
      </SimpleGrid>

      <Card withBorder p="md" radius="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <Select
            placeholder="All Status"
            value={statusFilter}
            onChange={setStatusFilter}
            data={["", "Pending", "Completed", "Cancelled"]}
            clearable
            w={200}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>
            Credit Referral
          </Button>
        </Group>

        <DataTable<Referral>
          testId="referrals-table"
          data={referrals}
          loading={isLoading}
          columns={[
            {
              key: "referrer",
              label: "Referrer",
              render: (r) => r.referrer?.name || "—",
            },
            {
              key: "referred",
              label: "Referred",
              render: (r) => r.referred?.name || "—",
            },
            {
              key: "rewardAmount",
              label: "Reward",
              render: (r) => `₹${(r.rewardAmount ?? 0).toLocaleString()}`,
            },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
            {
              key: "createdAt",
              label: "Date",
              render: (r) => new Date(r.createdAt).toLocaleDateString(),
            },
          ]}
        />
        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination value={page} onChange={setPage} total={totalPages} />
          </Group>
        )}
      </Card>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Credit Referral Reward" centered>
        <form onSubmit={form.onSubmit((v) => mutation.mutate(v))}>
          <Stack>
            <Select label="User" data={userOptions} searchable required {...form.getInputProps("userId")} />
            <NumberInput label="Amount" {...form.getInputProps("amount")} />
            <Button type="submit" loading={mutation.isPending}>
              Credit
            </Button>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
}
