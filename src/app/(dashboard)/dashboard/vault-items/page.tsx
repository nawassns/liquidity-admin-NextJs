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

interface VaultItem {
  _id: string;
  name: string;
  category: string;
  basePrice: number;
  volume?: string;
  brand?: string;
  status: string;
}

const CATEGORIES = [
  "Tennessee Whiskey",
  "Scotch Whisky",
  "Bourbon",
  "Vodka",
  "Rum",
  "Gin",
  "Tequila",
  "Wine",
  "Beer",
  "Other",
];

export default function VaultItemsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>("");
  const [editing, setEditing] = useState<VaultItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const query = buildQuery({ page, limit: 10, search, category });
  const { data, isLoading } = useQuery({
    queryKey: ["vault-items", page, search, category],
    queryFn: async () => api.get(`/vault-items${query}`),
  });
  const items = (data?.data as VaultItem[]) || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const form = useForm({
    initialValues: {
      name: "",
      category: "Tennessee Whiskey",
      description: "",
      basePrice: 0,
      alcoholPercentage: 40,
      volume: "750ml",
      brand: "",
      origin: "",
      status: "Active",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  };
  const openEdit = (it: any) => {
    setEditing(it);
    form.setValues({ ...form.values, ...it });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (editing) return api.put(`/vault-items/${editing._id}`, values);
      return api.post(`/vault-items`, values);
    },
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Saved" });
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["vault-items"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.patch(`/vault-items/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vault-items"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/vault-items/${id}`),
    onSuccess: () => {
      notifications.show({ color: "green", message: "Deleted" });
      qc.invalidateQueries({ queryKey: ["vault-items"] });
    },
  });

  return (
    <PageContainer title="Vault Items">
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <Group wrap="wrap">
            <TextInput
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              w={{ base: "100%", sm: 240 }}
              data-testid="vault-items-search"
            />
            <Select
              placeholder="All Categories"
              value={category}
              onChange={setCategory}
              data={["", ...CATEGORIES]}
              clearable
              w={200}
            />
          </Group>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate} data-testid="vault-items-create-btn">
            Add Item
          </Button>
        </Group>

        <DataTable<VaultItem>
          testId="vault-items-table"
          data={items}
          loading={isLoading}
          columns={[
            { key: "name", label: "Name" },
            { key: "category", label: "Category" },
            { key: "brand", label: "Brand" },
            { key: "volume", label: "Volume" },
            {
              key: "basePrice",
              label: "Base Price",
              render: (r) => `₹${(r.basePrice ?? 0).toLocaleString()}`,
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
                  if (confirm(`Delete ${row.name}?`)) deleteMutation.mutate(row._id);
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Item" : "Create Item"} size="lg" centered>
        <form onSubmit={form.onSubmit((v) => saveMutation.mutate(v))}>
          <Stack>
            <Group grow>
              <TextInput label="Name" required {...form.getInputProps("name")} />
              <Select label="Category" data={CATEGORIES} {...form.getInputProps("category")} />
            </Group>
            <Group grow>
              <TextInput label="Brand" {...form.getInputProps("brand")} />
              <TextInput label="Origin" {...form.getInputProps("origin")} />
            </Group>
            <Group grow>
              <NumberInput label="Base Price (₹)" {...form.getInputProps("basePrice")} />
              <NumberInput label="Alcohol %" {...form.getInputProps("alcoholPercentage")} />
              <TextInput label="Volume" {...form.getInputProps("volume")} />
            </Group>
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
