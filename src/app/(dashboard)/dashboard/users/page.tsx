"use client";

import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Pagination,
  PasswordInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconPlus,
  IconToggleLeft,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable, StatusBadge } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

interface User {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  walletBalance?: number;
  status: string;
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const query = buildQuery({ page, limit: 10, search });
  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search],
    queryFn: async () => api.get(`/users${query}`),
  });
  const users = (data?.data as User[]) || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      mobile: "",
      password: "",
      status: "Active",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  };
  const openEdit = (u: User) => {
    setEditing(u);
    form.setValues({
      name: u.name,
      email: u.email || "",
      mobile: u.mobile || "",
      password: "",
      status: u.status,
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const payload: any = { ...values };
      if (!payload.password) delete payload.password;
      if (editing) return api.put(`/users/${editing._id}`, payload);
      return api.post(`/users`, payload);
    },
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Saved" });
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.patch(`/users/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      notifications.show({ color: "green", message: "Deleted" });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  return (
    <PageContainer title="Users">
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <TextInput
            placeholder="Search by name, email, mobile..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={{ base: "100%", sm: 320 }}
            data-testid="users-search"
          />
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate} data-testid="users-create-btn">
            Add User
          </Button>
        </Group>

        <DataTable<User>
          testId="users-table"
          data={users}
          loading={isLoading}
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "mobile", label: "Mobile" },
            {
              key: "walletBalance",
              label: "Wallet",
              render: (r) => `₹${(r.walletBalance ?? 0).toLocaleString()}`,
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusBadge status={r.status} />,
            },
          ]}
          actions={(row) => (
            <>
              <ActionIcon variant="light" color="blue" onClick={() => openEdit(row)} data-testid={`users-edit-${row._id}`}>
                <IconEdit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="orange"
                title="Toggle Status"
                onClick={() =>
                  statusMutation.mutate({
                    id: row._id,
                    status: row.status === "Active" ? "Inactive" : "Active",
                  })
                }
              >
                <IconToggleLeft size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                onClick={() => {
                  if (confirm(`Delete user ${row.name}?`)) deleteMutation.mutate(row._id);
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit User" : "Create User"} centered>
        <form onSubmit={form.onSubmit((values) => saveMutation.mutate(values))}>
          <Stack>
            <TextInput label="Name" required {...form.getInputProps("name")} data-testid="user-form-name" />
            <TextInput label="Email" type="email" {...form.getInputProps("email")} data-testid="user-form-email" />
            <TextInput label="Mobile" {...form.getInputProps("mobile")} data-testid="user-form-mobile" />
            <PasswordInput
              label={editing ? "Password (leave blank to keep)" : "Password"}
              {...form.getInputProps("password")}
            />
            <Select label="Status" data={["Active", "Inactive", "Blocked"]} {...form.getInputProps("status")} />
            <Button type="submit" loading={saveMutation.isPending} data-testid="user-form-submit">
              {editing ? "Update" : "Create"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
}
