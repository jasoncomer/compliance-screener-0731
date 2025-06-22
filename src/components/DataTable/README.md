# DataTable Component

A reusable table component built with TanStack React Table and Ant Design, providing advanced features like sorting, filtering, pagination, and search.

## Features

- ✅ Type-safe with TypeScript generics
- ✅ Built-in sorting for all columns
- ✅ Global search functionality
- ✅ Pagination with configurable page sizes
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ Dark theme styling
- ✅ Row click handlers
- ✅ Refresh functionality

## Usage

```tsx
import { DataTable } from '../../components/DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ getValue }) => <span>{getValue() as string}</span>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ getValue }) => <span>{getValue() as string}</span>,
  },
  {
    accessorKey: 'age',
    header: 'Age',
    cell: ({ getValue }) => <span>{getValue() as number}</span>,
  },
];

function MyComponent() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <DataTable
      data={data}
      columns={columns}
      title="Users"
      loading={loading}
      searchable={true}
      searchPlaceholder="Search users..."
      pagination={true}
      pageSize={10}
      pageSizeOptions={[5, 10, 20, 50]}
      sortable={true}
      onRowClick={(user) => console.log('Clicked user:', user)}
      onRefresh={() => fetchData()}
      emptyText="No users found"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `TData[]` | - | Array of data to display |
| `columns` | `ColumnDef<TData, any>[]` | - | Column definitions using TanStack React Table |
| `title` | `string` | - | Optional title for the table |
| `loading` | `boolean` | `false` | Loading state |
| `error` | `Error \| null` | `null` | Error state |
| `searchable` | `boolean` | `true` | Enable global search |
| `searchPlaceholder` | `string` | `"Search..."` | Placeholder for search input |
| `searchFields` | `(keyof TData)[]` | `[]` | Specific fields to search in |
| `pagination` | `boolean` | `true` | Enable pagination |
| `pageSize` | `number` | `10` | Default page size |
| `pageSizeOptions` | `number[]` | `[10, 20, 50, 100]` | Available page size options |
| `sortable` | `boolean` | `true` | Enable column sorting |
| `onRowClick` | `(record: TData) => void` | - | Row click handler |
| `onRefresh` | `() => void` | - | Refresh button handler |
| `emptyText` | `string` | `"No data found"` | Text to show when no data |
| `className` | `string` | - | Additional CSS classes |

## Styling

The component uses styled-components and is designed with a dark theme that matches the application's design system. It includes:

- Dark background colors
- Proper contrast for text
- Hover effects
- Responsive design
- Custom pagination styling

## Dependencies

- `@tanstack/react-table` - Core table functionality
- `antd` - UI components
- `styled-components` - Styling
- `@ant-design/icons` - Icons 