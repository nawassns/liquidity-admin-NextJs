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
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconPlus, IconToggleLeft, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, buildQuery } from "@/lib/api";
import { DataTable, StatusBadge } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";

interface Event {
  _id: string;
  name: string;
  outlet?: { _id: string; name: string };
  startDate: string;
  endDate?: string;
  maxCapacity?: number;
  status: string;
}

export default function EventsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Event | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const query = buildQuery({ page, limit: 10, search });
  const { data, isLoading } = useQuery({
    queryKey: ["events", page, search],
    queryFn: async () => api.get(`/events${query}`),
  });
  const events = (data?.data as Event[]) || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const outletsQ = useQuery({
    queryKey: ["outlets-list-e"],
    queryFn: async () => api.get(`/outlets?limit=200`),
  });

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      outlet: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      startTime: "20:00",
      endTime: "23:00",
      image: "",
      maxCapacity: 100,
      status: "Active",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  };
  const openEdit = (e: any) => {
    setEditing(e);
    form.setValues({
      ...form.values,
      ...e,
      outlet: e.outlet?._id || "",
      startDate: e.startDate?.slice(0, 10) || "",
      endDate: e.endDate?.slice(0, 10) || "",
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (editing) return api.put(`/events/${editing._id}`, values);
      return api.post(`/events`, values);
    },
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Saved" });
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.patch(`/events/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => {
      notifications.show({ color: "green", message: "Deleted" });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const outletOptions =
    ((outletsQ.data?.data as any[]) || []).map((o) => ({
      value: o._id,
      label: o.name,
    })) || [];

  return (
    <PageContainer title="Events">
      <Card withBorder p="md" radius="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <TextInput
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={{ base: "100%", sm: 280 }}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Add Event
          </Button>
        </Group>

        <DataTable<Event>
          testId="events-table"
          data={events}
          loading={isLoading}
          columns={[
            { key: "name", label: "Name" },
            { key: "outlet", label: "Outlet", render: (r) => r.outlet?.name || "—" },
            {
              key: "startDate",
              label: "Start",
              render: (r) => new Date(r.startDate).toLocaleDateString(),
            },
            { key: "maxCapacity", label: "Max Capacity" },
            { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Event" : "Create Event"} size="lg" centered>
        <form onSubmit={form.onSubmit((v) => saveMutation.mutate(v))}>
          <Stack>
            <TextInput label="Name" required {...form.getInputProps("name")} />
            <Textarea label="Description" {...form.getInputProps("description")} />
            <Select label="Outlet" data={outletOptions} searchable required {...form.getInputProps("outlet")} />
            <Group grow>
              <TextInput label="Start Date" type="date" {...form.getInputProps("startDate")} />
              <TextInput label="End Date" type="date" {...form.getInputProps("endDate")} />
            </Group>
            <Group grow>
              <TextInput label="Start Time" {...form.getInputProps("startTime")} />
              <TextInput label="End Time" {...form.getInputProps("endTime")} />
            </Group>
            <NumberInput label="Max Capacity" {...form.getInputProps("maxCapacity")} />
            <TextInput label="Image URL" {...form.getInputProps("image")} />
            <Select label="Status" data={["Active", "Inactive", "Completed", "Cancelled"]} {...form.getInputProps("status")} />
            <Button type="submit" loading={saveMutation.isPending}>Save</Button>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
}
