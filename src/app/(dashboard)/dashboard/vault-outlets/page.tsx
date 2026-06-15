"use client";

import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable, StatusBadge } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

interface VaultOutlet {
  _id: string;
  outlet?: { _id: string; name: string };
  vaultItem?: { _id: string; name: string };
  price: number;
  stock: number;
  status: string;
}

export default function VaultOutletsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<VaultOutlet | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["vault-outlets"],
    queryFn: async () => api.get(`/vault-outlets${buildQuery({})}`),
  });
  const records = (data?.data as VaultOutlet[]) || [];

  const outletsQ = useQuery({
    queryKey: ["outlets-list"],
    queryFn: async () => api.get(`/outlets?limit=200`),
  });
  const itemsQ = useQuery({
    queryKey: ["vault-items-list"],
    queryFn: async () => api.get(`/vault-items?limit=200`),
  });

  const form = useForm({
    initialValues: {
      outlet: "",
      vaultItem: "",
      price: 0,
      stock: 0,
      minStock: 5,
      isAvailable: true,
      status: "Active",
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
      outlet: r.outlet?._id || "",
      vaultItem: r.vaultItem?._id || "",
      price: r.price,
      stock: r.stock,
      minStock: r.minStock || 5,
      isAvailable: r.isAvailable,
      status: r.status,
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (editing) return api.put(`/vault-outlets/${editing._id}`, values);
      return api.post(`/vault-outlets`, values);
    },
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Saved" });
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["vault-outlets"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/vault-outlets/${id}`),
    onSuccess: () => {
      notifications.show({ color: "green", message: "Deleted" });
      qc.invalidateQueries({ queryKey: ["vault-outlets"] });
    },
  });

  const outletOptions =
    ((outletsQ.data?.data as any[]) || []).map((o) => ({
      value: o._id,
      label: o.name,
    })) || [];
  const itemOptions =
    ((itemsQ.data?.data as any[]) || []).map((i) => ({
      value: i._id,
      label: i.name,
    })) || [];

  return (
    <PageContainer title="Vault Outlet Pricing">
      <Card withBorder radius="md" p="md">
        <Group justify="space-between" mb="md">
          <span />
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Add Mapping
          </Button>
        </Group>

        <DataTable<VaultOutlet>
          testId="vault-outlets-table"
          data={records}
          loading={isLoading}
          columns={[
            {
              key: "outlet",
              label: "Outlet",
              render: (r) => r.outlet?.name || "—",
            },
            {
              key: "item",
              label: "Item",
              render: (r) => r.vaultItem?.name || "—",
            },
            {
              key: "price",
              label: "Price",
              render: (r) => `₹${(r.price ?? 0).toLocaleString()}`,
            },
            { key: "stock", label: "Stock" },
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
                color="red"
                onClick={() => {
                  if (confirm(`Delete mapping?`)) deleteMutation.mutate(row._id);
                }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </>
          )}
        />
      </Card>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Pricing" : "Add Pricing"} centered>
        <form onSubmit={form.onSubmit((v) => saveMutation.mutate(v))}>
          <Stack>
            <Select
              label="Outlet"
              data={outletOptions}
              searchable
              required
              {...form.getInputProps("outlet")}
            />
            <Select
              label="Vault Item"
              data={itemOptions}
              searchable
              required
              {...form.getInputProps("vaultItem")}
            />
            <NumberInput label="Price (₹)" {...form.getInputProps("price")} />
            <NumberInput label="Stock" {...form.getInputProps("stock")} />
            <NumberInput label="Min Stock" {...form.getInputProps("minStock")} />
            <Switch
              label="Available"
              {...form.getInputProps("isAvailable", { type: "checkbox" })}
            />
            <Select
              label="Status"
              data={["Active", "Inactive", "Out of Stock"]}
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
