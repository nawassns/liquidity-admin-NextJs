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
  Switch,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconPlus, IconToggleLeft, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable, StatusBadge } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

interface Outlet {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  status: string;
  payablePercentageToOutlets?: number;
  taxRate?: number;
}

export default function OutletsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Outlet | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const query = buildQuery({ page, limit: 10, search });
  const { data, isLoading } = useQuery({
    queryKey: ["outlets", page, search],
    queryFn: async () => api.get(`/outlets${query}`),
  });
  const outlets = (data?.data as Outlet[]) || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      followsFixedPrice: true,
      payablePercentageToOutlets: 70,
      taxRate: 13,
      openingTime: "10:00",
      closingTime: "23:00",
      description: "",
      status: "Active",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  };
  const openEdit = (o: any) => {
    setEditing(o);
    form.setValues({ ...form.values, ...o });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (editing) return api.put(`/outlets/${editing._id}`, values);
      return api.post(`/outlets`, values);
    },
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Saved" });
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["outlets"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.patch(`/outlets/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["outlets"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/outlets/${id}`),
    onSuccess: () => {
      notifications.show({ color: "green", message: "Deleted" });
      qc.invalidateQueries({ queryKey: ["outlets"] });
    },
  });

  return (
    <PageContainer title="Outlets">
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <TextInput
            placeholder="Search outlets..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={{ base: "100%", sm: 320 }}
            data-testid="outlets-search"
          />
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate} data-testid="outlets-create-btn">
            Add Outlet
          </Button>
        </Group>

        <DataTable<Outlet>
          testId="outlets-table"
          data={outlets}
          loading={isLoading}
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "city", label: "City" },
            {
              key: "taxRate",
              label: "Tax %",
              render: (r) => `${r.taxRate ?? 0}%`,
            },
            {
              key: "status",
              label: "Status",
              render: (r) => <StatusBadge status={r.status} />,
            },
          ]}
          actions={(row) => (
            <>
              <ActionIcon variant="light" color="blue" onClick={() => openEdit(row)}>
                <IconEdit size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                color="orange"
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
                  if (confirm(`Delete outlet ${row.name}?`)) deleteMutation.mutate(row._id);
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Outlet" : "Create Outlet"} size="lg" centered>
        <form onSubmit={form.onSubmit((values) => saveMutation.mutate(values))}>
          <Stack>
            <Group grow>
              <TextInput label="Name" required {...form.getInputProps("name")} />
              <TextInput label="Email" type="email" {...form.getInputProps("email")} />
            </Group>
            <Group grow>
              <TextInput label="Phone" {...form.getInputProps("phone")} />
              <TextInput label="City" {...form.getInputProps("city")} />
            </Group>
            <Textarea label="Address" {...form.getInputProps("address")} />
            <Group grow>
              <TextInput label="State" {...form.getInputProps("state")} />
              <TextInput label="Country" {...form.getInputProps("country")} />
              <TextInput label="Postal Code" {...form.getInputProps("postalCode")} />
            </Group>
            <Group grow>
              <NumberInput
                label="Tax Rate (%)"
                {...form.getInputProps("taxRate")}
              />
              <NumberInput
                label="Payable % to Outlet"
                {...form.getInputProps("payablePercentageToOutlets")}
              />
            </Group>
            <Group grow>
              <TextInput label="Opening Time" {...form.getInputProps("openingTime")} />
              <TextInput label="Closing Time" {...form.getInputProps("closingTime")} />
            </Group>
            <Switch
              label="Follows Fixed Price"
              {...form.getInputProps("followsFixedPrice", { type: "checkbox" })}
            />
            <Textarea label="Description" {...form.getInputProps("description")} />
            <Select label="Status" data={["Active", "Inactive"]} {...form.getInputProps("status")} />
            <Button type="submit" loading={saveMutation.isPending}>
              {editing ? "Update" : "Create"}
            </Button>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
}
