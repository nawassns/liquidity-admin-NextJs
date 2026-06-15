"use client";

import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  Pagination,
  PasswordInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable, StatusBadge } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

interface Admin {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function AdminsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Admin | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const query = buildQuery({ page, limit: 10, search });
  const { data, isLoading } = useQuery({
    queryKey: ["admins", page, search],
    queryFn: async () => api.get(`/admins${query}`),
  });

  const admins = (data?.data as Admin[]) || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
      role: "admin",
      status: "Active",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  };

  const openEdit = (a: Admin) => {
    setEditing(a);
    form.setValues({
      name: a.name,
      email: a.email,
      password: "",
      role: a.role,
      status: a.status,
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (editing) {
        const payload: any = { ...values };
        if (!payload.password) delete payload.password;
        return api.put(`/admins/${editing._id}`, payload);
      }
      return api.post(`/admins`, values);
    },
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: editing ? "Updated" : "Created" });
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["admins"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admins/${id}`),
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Deleted" });
      qc.invalidateQueries({ queryKey: ["admins"] });
    },
  });

  return (
    <PageContainer title="Admins">
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <TextInput
            placeholder="Search admins..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            data-testid="admins-search"
            w={{ base: "100%", sm: 280 }}
          />
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={openCreate}
            data-testid="admins-create-btn"
          >
            Add Admin
          </Button>
        </Group>

        <DataTable<Admin>
          testId="admins-table"
          data={admins}
          loading={isLoading}
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role", render: (r) => <span>{r.role}</span> },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusBadge status={r.status} />,
            },
          ]}
          actions={(row) => (
            <>
              <ActionIcon
                variant="light"
                color="blue"
                onClick={() => openEdit(row)}
                data-testid={`admins-edit-${row._id}`}
              >
                <IconEdit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="red"
                onClick={() => {
                  if (confirm(`Delete admin ${row.name}?`))
                    deleteMutation.mutate(row._id);
                }}
                data-testid={`admins-delete-${row._id}`}
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

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Admin" : "Create Admin"}
        centered
      >
        <form
          onSubmit={form.onSubmit((values) => saveMutation.mutate(values))}
        >
          <Stack>
            <TextInput
              label="Name"
              required
              {...form.getInputProps("name")}
              data-testid="admin-form-name"
            />
            <TextInput
              label="Email"
              required
              type="email"
              {...form.getInputProps("email")}
              data-testid="admin-form-email"
            />
            <PasswordInput
              label={editing ? "Password (leave blank to keep)" : "Password"}
              required={!editing}
              {...form.getInputProps("password")}
              data-testid="admin-form-password"
            />
            <Select
              label="Role"
              data={["super_admin", "admin", "manager"]}
              {...form.getInputProps("role")}
              data-testid="admin-form-role"
            />
            <Select
              label="Status"
              data={["Active", "Inactive"]}
              {...form.getInputProps("status")}
              data-testid="admin-form-status"
            />
            <Button
              type="submit"
              loading={saveMutation.isPending}
              data-testid="admin-form-submit"
            >
              {editing ? "Update" : "Create"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
}
