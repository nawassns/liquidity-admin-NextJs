"use client";

import {
  ActionIcon,
  Badge,
  Group,
  ScrollArea,
  Table,
  Text,
} from "@mantine/core";

export interface DataColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  width?: number | string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
  testId?: string;
}

export function DataTable<T extends { _id?: string; id?: string }>({
  data,
  columns,
  loading,
  emptyMessage = "No records found",
  rowKey = (row) => row._id || row.id || JSON.stringify(row),
  actions,
  testId,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <Text c="dimmed" p="md" data-testid={`${testId}-loading`}>
        Loading...
      </Text>
    );
  }

  if (!data?.length) {
    return (
      <Text c="dimmed" ta="center" p="lg" data-testid={`${testId}-empty`}>
        {emptyMessage}
      </Text>
    );
  }

  return (
    <ScrollArea>
      <Table
        striped
        highlightOnHover
        withTableBorder
        verticalSpacing="sm"
        miw={600}
        data-testid={testId}
      >
        <Table.Thead>
          <Table.Tr>
            {columns.map((c) => (
              <Table.Th key={c.key} style={{ width: c.width }}>
                {c.label}
              </Table.Th>
            ))}
            {actions && <Table.Th style={{ width: 140 }}>Actions</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.map((row) => (
            <Table.Tr key={rowKey(row)} data-testid={`row-${rowKey(row)}`}>
              {columns.map((c) => (
                <Table.Td key={c.key}>
                  {c.render
                    ? c.render(row)
                    : String((row as any)[c.key] ?? "—")}
                </Table.Td>
              ))}
              {actions && (
                <Table.Td>
                  <Group gap={6}>{actions(row)}</Group>
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, string> = {
    Active: "green",
    Inactive: "gray",
    Blocked: "red",
    Pending: "yellow",
    Completed: "green",
    Failed: "red",
    Cancelled: "red",
    "No Show": "red",
    "New Order": "blue",
    Accepted: "blue",
    Served: "green",
    "Out of Stock": "orange",
    CREDIT: "green",
    DEBIT: "red",
  };
  return <Badge color={map[status] || "blue"}>{status}</Badge>;
}
