"use client";

import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Modal,
  NumberInput,
  Pagination,
  PasswordInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconEdit,
  IconKey,
  IconPlus,
  IconToggleLeft,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DataTable, StatusBadge } from "@/components/DataTable/DataTable";
import { PageContainer } from "@/components/PageContainer/PageContainer";
import { api, buildQuery } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Outlet {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  status: "Active" | "Inactive";
  followsFixedPrice?: boolean;
  payablePercentageToOutlets?: number;
  taxRate?: number;
  openingTime?: string;
  closingTime?: string;
  description?: string;
  credentialsConfigured?: boolean;
  passwordUpdatedAt?: string | null;
}

export default function OutletsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Outlet | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [credentialOutlet, setCredentialOutlet] = useState<Outlet | null>(null);

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
      password: "",
      confirmPassword: "",
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
    validate: {
      name: (value) => (value.trim() ? null : "Outlet name is required"),
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim())
          ? null
          : "Enter a valid email address",
      password: (value) =>
        editing || value.length >= 8
          ? null
          : "Password must be at least 8 characters",
      confirmPassword: (value, values) =>
        editing || value === values.password
          ? null
          : "Passwords do not match",
      phone: (value) => (value.trim() ? null : "Phone is required"),
      address: (value) => (value.trim() ? null : "Address is required"),
    },
  });

  const credentialsForm = useForm({
    initialValues: {
      email: "",
      newPassword: "",
      confirmPassword: "",
    },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim())
          ? null
          : "Enter a valid email address",
      newPassword: (value) =>
        !value || value.length >= 8
          ? null
          : "Password must be at least 8 characters",
      confirmPassword: (value, values) =>
        value === values.newPassword ? null : "Passwords do not match",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset();
    setModalOpen(true);
  };

  const openEdit = (outlet: Outlet) => {
    setEditing(outlet);
    form.setValues({
      name: outlet.name || "",
      email: outlet.email || "",
      password: "",
      confirmPassword: "",
      phone: outlet.phone || "",
      address: outlet.address || "",
      city: outlet.city || "",
      state: outlet.state || "",
      country: outlet.country || "",
      postalCode: outlet.postalCode || "",
      followsFixedPrice: outlet.followsFixedPrice ?? true,
      payablePercentageToOutlets:
        outlet.payablePercentageToOutlets ?? 70,
      taxRate: outlet.taxRate ?? 13,
      openingTime: outlet.openingTime || "10:00",
      closingTime: outlet.closingTime || "23:00",
      description: outlet.description || "",
      status: outlet.status || "Active",
    });
    setModalOpen(true);
  };

  const openCredentials = (outlet: Outlet) => {
    credentialsForm.reset();
    credentialsForm.setValues({
      email: outlet.email || "",
      newPassword: "",
      confirmPassword: "",
    });
    setCredentialOutlet(outlet);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form.values) => {
      const { confirmPassword: _confirmPassword, ...payload } = values;

      if (editing) {
        const { password: _password, ...profilePayload } = payload;
        return api.put(`/outlets/${editing._id}`, profilePayload);
      }

      return api.post("/outlets", payload);
    },
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({
          color: "red",
          title: "Could not save outlet",
          message: res.message || "Please check the form and try again.",
        });
        return;
      }

      notifications.show({
        color: "green",
        title: editing ? "Outlet updated" : "Outlet created",
        message:
          res.message ||
          (editing
            ? "Outlet details were updated."
            : "The outlet can now use its email and password to log in."),
      });
      setModalOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["outlets"] });
    },
  });

  const credentialsMutation = useMutation({
    mutationFn: async (values: typeof credentialsForm.values) => {
      if (!credentialOutlet) {
        return { success: false, message: "No outlet selected" };
      }

      const payload: { email: string; newPassword?: string } = {
        email: values.email.trim(),
      };
      if (values.newPassword) payload.newPassword = values.newPassword;

      return api.patch(
        `/outlets/${credentialOutlet._id}/credentials`,
        payload,
      );
    },
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({
          color: "red",
          title: "Credentials were not updated",
          message: res.message || "Please try again.",
        });
        return;
      }

      notifications.show({
        color: "green",
        title: "Outlet login updated",
        message: res.message || "The outlet can use the new login details.",
      });
      setCredentialOutlet(null);
      credentialsForm.reset();
      qc.invalidateQueries({ queryKey: ["outlets"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "Active" | "Inactive";
    }) => api.patch(`/outlets/${id}/status`, { status }),
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({
          color: "red",
          title: "Status was not changed",
          message: res.message || "Please try again.",
        });
        return;
      }

      notifications.show({
        color: "green",
        title: "Outlet login status updated",
        message: res.message || "The outlet status was updated.",
      });
      qc.invalidateQueries({ queryKey: ["outlets"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/outlets/${id}`),
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({
          color: "red",
          title: "Outlet was not deleted",
          message: res.message || "Please try again.",
        });
        return;
      }

      notifications.show({ color: "green", message: "Outlet deleted" });
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
            onChange={(event) => setSearch(event.currentTarget.value)}
            w={{ base: "100%", sm: 320 }}
            data-testid="outlets-search"
          />
          {isSuperAdmin ? (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={openCreate}
              data-testid="outlets-create-btn"
            >
              Add Outlet
            </Button>
          ) : (
            <Text size="sm" c="dimmed">
              Only Super Admin can manage outlet login access.
            </Text>
          )}
        </Group>

        <DataTable<Outlet>
          testId="outlets-table"
          data={outlets}
          loading={isLoading}
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Login Email" },
            { key: "phone", label: "Phone" },
            { key: "city", label: "City" },
            {
              key: "credentialsConfigured",
              label: "Login",
              render: (row) => (
                <Badge
                  color={row.credentialsConfigured ? "teal" : "orange"}
                  variant="light"
                >
                  {row.credentialsConfigured ? "Configured" : "Password needed"}
                </Badge>
              ),
            },
            {
              key: "status",
              label: "Access",
              render: (row) => <StatusBadge status={row.status} />,
            },
          ]}
          actions={
            isSuperAdmin
              ? (row) => (
                  <>
                    <Tooltip label="Edit outlet details">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        aria-label={`Edit ${row.name}`}
                        onClick={() => openEdit(row)}
                        data-testid={`outlets-edit-${row._id}`}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Change login email or reset password">
                      <ActionIcon
                        variant="light"
                        color="violet"
                        aria-label={`Manage login for ${row.name}`}
                        onClick={() => openCredentials(row)}
                        data-testid={`outlets-credentials-${row._id}`}
                      >
                        <IconKey size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip
                      label={
                        row.status === "Active"
                          ? "Deactivate and block login"
                          : "Activate and allow login"
                      }
                    >
                      <ActionIcon
                        variant="light"
                        color={row.status === "Active" ? "orange" : "green"}
                        aria-label={
                          row.status === "Active"
                            ? `Deactivate ${row.name}`
                            : `Activate ${row.name}`
                        }
                        loading={statusMutation.isPending}
                        onClick={() => {
                          const nextStatus =
                            row.status === "Active" ? "Inactive" : "Active";
                          const action =
                            nextStatus === "Inactive"
                              ? "block this outlet from logging in"
                              : "allow this outlet to log in";
                          if (confirm(`Do you want to ${action}?`)) {
                            statusMutation.mutate({
                              id: row._id,
                              status: nextStatus,
                            });
                          }
                        }}
                        data-testid={`outlets-status-${row._id}`}
                      >
                        <IconToggleLeft size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete outlet">
                      <ActionIcon
                        variant="light"
                        color="red"
                        aria-label={`Delete ${row.name}`}
                        loading={deleteMutation.isPending}
                        onClick={() => {
                          if (confirm(`Delete outlet ${row.name}?`)) {
                            deleteMutation.mutate(row._id);
                          }
                        }}
                        data-testid={`outlets-delete-${row._id}`}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </>
                )
              : undefined
          }
        />

        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination value={page} onChange={setPage} total={totalPages} />
          </Group>
        )}
      </Card>

      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit Outlet" : "Create Outlet & Login"}
        size="lg"
        centered
      >
        <form onSubmit={form.onSubmit((values) => saveMutation.mutate(values))}>
          <Stack>
            <Group grow align="flex-start">
              <TextInput
                label="Outlet Name"
                required
                {...form.getInputProps("name")}
                data-testid="outlet-form-name"
              />
              <TextInput
                label="Login Email"
                type="email"
                required
                {...form.getInputProps("email")}
                data-testid="outlet-form-email"
              />
            </Group>

            {!editing && (
              <Group grow align="flex-start">
                <PasswordInput
                  label="Login Password"
                  description="Minimum 8 characters"
                  required
                  autoComplete="new-password"
                  {...form.getInputProps("password")}
                  data-testid="outlet-form-password"
                />
                <PasswordInput
                  label="Confirm Password"
                  required
                  autoComplete="new-password"
                  {...form.getInputProps("confirmPassword")}
                  data-testid="outlet-form-confirm-password"
                />
              </Group>
            )}

            <Group grow align="flex-start">
              <TextInput
                label="Phone"
                required
                {...form.getInputProps("phone")}
                data-testid="outlet-form-phone"
              />
              <TextInput label="City" {...form.getInputProps("city")} />
            </Group>
            <Textarea
              label="Address"
              required
              {...form.getInputProps("address")}
              data-testid="outlet-form-address"
            />
            <Group grow>
              <TextInput label="State" {...form.getInputProps("state")} />
              <TextInput label="Country" {...form.getInputProps("country")} />
              <TextInput
                label="Postal Code"
                {...form.getInputProps("postalCode")}
              />
            </Group>
            <Group grow>
              <NumberInput
                label="Tax Rate (%)"
                min={0}
                max={100}
                {...form.getInputProps("taxRate")}
              />
              <NumberInput
                label="Payable % to Outlet"
                min={0}
                max={100}
                {...form.getInputProps("payablePercentageToOutlets")}
              />
            </Group>
            <Group grow>
              <TextInput
                label="Opening Time"
                type="time"
                {...form.getInputProps("openingTime")}
              />
              <TextInput
                label="Closing Time"
                type="time"
                {...form.getInputProps("closingTime")}
              />
            </Group>
            <Switch
              label="Follows Fixed Price"
              {...form.getInputProps("followsFixedPrice", {
                type: "checkbox",
              })}
            />
            <Textarea
              label="Description"
              {...form.getInputProps("description")}
            />
            <Select
              label="Login Status"
              description="Inactive outlets cannot log in"
              data={["Active", "Inactive"]}
              {...form.getInputProps("status")}
            />
            <Button
              type="submit"
              loading={saveMutation.isPending}
              data-testid="outlet-form-submit"
            >
              {editing ? "Update Outlet" : "Create Outlet & Login"}
            </Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={Boolean(credentialOutlet)}
        onClose={() => {
          setCredentialOutlet(null);
          credentialsForm.reset();
        }}
        title={`Manage Login${credentialOutlet ? ` — ${credentialOutlet.name}` : ""}`}
        centered
      >
        <form
          onSubmit={credentialsForm.onSubmit((values) =>
            credentialsMutation.mutate(values),
          )}
        >
          <Stack>
            <Text size="sm" c="dimmed">
              You can change the outlet login email or set a new password.
              Existing passwords are securely hashed and cannot be displayed.
            </Text>
            <TextInput
              label="Login Email"
              type="email"
              required
              {...credentialsForm.getInputProps("email")}
              data-testid="outlet-credentials-email"
            />
            <PasswordInput
              label="New Password"
              description="Leave blank to keep the current password"
              autoComplete="new-password"
              {...credentialsForm.getInputProps("newPassword")}
              data-testid="outlet-credentials-password"
            />
            <PasswordInput
              label="Confirm New Password"
              autoComplete="new-password"
              {...credentialsForm.getInputProps("confirmPassword")}
              data-testid="outlet-credentials-confirm-password"
            />
            <Button
              type="submit"
              leftSection={<IconKey size={16} />}
              loading={credentialsMutation.isPending}
              data-testid="outlet-credentials-submit"
            >
              Update Login
            </Button>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
}
