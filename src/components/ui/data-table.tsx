import * as React from "react"

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "./button"
import { Checkbox } from "./checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

// Types
export interface Column<T = any> {
  key: string
  title: React.ReactNode
  dataIndex?: string
  render?: (value: any, record: T, index: number) => React.ReactNode
  sorter?: boolean | ((a: T, b: T) => number)
  fixed?: "left" | "right"
  width?: number | string
  align?: "left" | "center" | "right"
  ellipsis?: boolean
  className?: string
  onCell?: (record: T, index: number) => React.HTMLAttributes<HTMLElement>
}

export interface DataTableProps<T = any> {
  columns: Column<T>[]
  dataSource: T[]
  rowKey?: string | ((record: T) => string)
  loading?: boolean
  pagination?: false | PaginationProps
  onChange?: (pagination: PaginationProps, sorter: SorterResult<T>) => void
  rowSelection?: RowSelectionProps<T>
  scroll?: { x?: number | string; y?: number | string }
  size?: "small" | "default" | "large"
  bordered?: boolean
  showHeader?: boolean
  title?: () => React.ReactNode
  footer?: () => React.ReactNode
  expandable?: ExpandableProps<T>
  className?: string
  locale?: {
    emptyText?: React.ReactNode
    loading?: React.ReactNode
  }
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLElement>
}

export interface PaginationProps {
  current?: number
  pageSize?: number
  total?: number
  showSizeChanger?: boolean
  pageSizeOptions?: number[]
  showTotal?: (total: number, range: [number, number]) => React.ReactNode
  onChange?: (page: number, pageSize: number) => void
  onShowSizeChange?: (current: number, size: number) => void
}

export interface SorterResult<T> {
  column?: Column<T>
  order?: "ascend" | "descend" | null
  field?: string
  columnKey?: string
}

export interface RowSelectionProps<T> {
  selectedRowKeys?: React.Key[]
  onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void
  getCheckboxProps?: (record: T) => Partial<React.ComponentProps<typeof Checkbox>>
  type?: "checkbox" | "radio"
  columnWidth?: number | string
  fixed?: boolean
  renderHeader?: () => React.ReactNode
}

export interface ExpandableProps<T> {
  expandedRowRender?: (record: T, index: number, indent: number, expanded: boolean) => React.ReactNode
  expandedRowKeys?: React.Key[]
  onExpand?: (expanded: boolean, record: T) => void
  onExpandedRowsChange?: (expandedRows: React.Key[]) => void
  rowExpandable?: (record: T) => boolean
  expandIcon?: (props: {
    expanded: boolean
    onExpand: (record: T, e: React.MouseEvent) => void
    record: T
  }) => React.ReactNode
}

// Helper function to get nested property
const getNestedProperty = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, part) => acc?.[part], obj)
}

// DataTable Component
export function DataTable<T extends Record<string, any>>({
  columns,
  dataSource,
  rowKey = "id",
  loading = false,
  pagination = false,
  onChange,
  rowSelection,
  scroll,
  size = "default",
  bordered = false,
  showHeader = true,
  title,
  footer,
  expandable,
  className,
  locale = {},
  onRow,
}: DataTableProps<T>) {
  // State
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortOrder, setSortOrder] = React.useState<"ascend" | "descend" | null>(null)
  const [currentPage, setCurrentPage] = React.useState(pagination ? pagination.current || 1 : 1)
  const [pageSize, setPageSize] = React.useState(
    pagination ? pagination.pageSize || 10 : dataSource.length
  )
  const [selectedKeys, setSelectedKeys] = React.useState<React.Key[]>(
    rowSelection?.selectedRowKeys || []
  )
  const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>(
    expandable?.expandedRowKeys || []
  )

  // Get row key
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(record)
    }
    return getNestedProperty(record, rowKey) || index.toString()
  }

  // Handle sorting
  const handleSort = (column: Column<T>) => {
    if (!column.sorter) return

    const newOrder =
      sortColumn === column.key
        ? sortOrder === "ascend"
          ? "descend"
          : sortOrder === "descend"
          ? null
          : "ascend"
        : "ascend"

    setSortColumn(newOrder ? column.key : null)
    setSortOrder(newOrder)

    if (onChange) {
      onChange(
        { current: currentPage, pageSize, total: pagination ? pagination.total : dataSource.length },
        {
          column,
          order: newOrder,
          field: column.dataIndex || column.key,
          columnKey: column.key,
        }
      )
    }
  }

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortOrder) return dataSource

    const column = columns.find((col) => col.key === sortColumn)
    if (!column?.sorter) return dataSource

    const sorted = [...dataSource]
    if (typeof column.sorter === "function") {
      sorted.sort(column.sorter)
    } else {
      sorted.sort((a, b) => {
        const aVal = getNestedProperty(a, column.dataIndex || column.key)
        const bVal = getNestedProperty(b, column.dataIndex || column.key)

        if (aVal === bVal) return 0
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        if (typeof aVal === "string" && typeof bVal === "string") {
          return aVal.localeCompare(bVal)
        }

        return aVal < bVal ? -1 : 1
      })
    }

    if (sortOrder === "descend") {
      sorted.reverse()
    }

    return sorted
  }, [dataSource, sortColumn, sortOrder, columns])

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!pagination) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, pagination])

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = paginatedData.map((record, index) => getRowKey(record, index))
      setSelectedKeys(allKeys)
      rowSelection?.onChange?.(allKeys, paginatedData)
    } else {
      setSelectedKeys([])
      rowSelection?.onChange?.([], [])
    }
  }

  const handleSelectRow = (key: React.Key, _record: T, checked: boolean) => {
    const newSelectedKeys = checked
      ? [...selectedKeys, key]
      : selectedKeys.filter((k) => k !== key)

    setSelectedKeys(newSelectedKeys)

    if (rowSelection?.onChange) {
      const selectedRows = sortedData.filter((record, index) =>
        newSelectedKeys.includes(getRowKey(record, index))
      )
      rowSelection.onChange(newSelectedKeys, selectedRows)
    }
  }

  // Handle expansion
  const handleExpand = (key: React.Key, record: T) => {
    const isExpanded = expandedKeys.includes(key)
    const newExpandedKeys = isExpanded
      ? expandedKeys.filter((k) => k !== key)
      : [...expandedKeys, key]

    setExpandedKeys(newExpandedKeys)
    expandable?.onExpand?.(!isExpanded, record)
    expandable?.onExpandedRowsChange?.(newExpandedKeys)
  }

  // Size classes
  const sizeClasses = {
    small: "text-xs",
    default: "text-sm",
    large: "text-base",
  }

  const paddingClasses = {
    small: "px-2 py-1",
    default: "px-3 py-2",
    large: "px-4 py-3",
  }

  // Render empty state
  if (!loading && dataSource.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        {title && <div className="mb-4">{title()}</div>}
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          {locale.emptyText || "No data"}
        </div>
        {footer && <div className="mt-4">{footer()}</div>}
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {title && <div className="mb-4">{title()}</div>}

      <div className={cn("w-full overflow-auto rounded-lg border border-gray-200 dark:border-gray-700", scroll?.x && "overflow-x-auto")}>
        <Table className={cn(bordered && "border border-gray-200 dark:border-gray-700")}>
          {showHeader && (
            <TableHeader className="sticky top-0 z-20 bg-gray-100 dark:bg-gray-800">
              <TableRow>
                {rowSelection && (
                  <TableHead
                    className={cn(
                      "w-12",
                      paddingClasses[size],
                      rowSelection.fixed && "sticky left-0 bg-background z-10"
                    )}
                    style={{ width: rowSelection.columnWidth }}
                  >
                    {rowSelection.renderHeader ? (
                      rowSelection.renderHeader()
                    ) : (
                      rowSelection.type === "checkbox" && (
                        <Checkbox
                          checked={
                            paginatedData.length > 0 &&
                            paginatedData.every((record, index) =>
                              selectedKeys.includes(getRowKey(record, index))
                            )
                          }
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      )
                    )}
                  </TableHead>
                )}

                {expandable && (
                  <TableHead className={cn("w-12", paddingClasses[size])}>
                    {/* Expand column header */}
                  </TableHead>
                )}

                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      paddingClasses[size],
                      column.align && `text-${column.align}`,
                      column.className,
                      column.fixed === "left" && "sticky left-0 bg-background z-10",
                      column.fixed === "right" && "sticky right-0 bg-background z-10",
                      column.sorter && "cursor-pointer select-none hover:bg-muted/50"
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sorter && handleSort(column)}
                  >
                    <div className="flex items-center gap-1">
                      {column.title}
                      {column.sorter && (
                        <span className="ml-1">
                          {sortColumn === column.key ? (
                            sortOrder === "ascend" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0)}
                  className="text-center py-12"
                >
                  {locale.loading || "Loading..."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((record, index) => {
                const key = getRowKey(record, index)
                const isSelected = selectedKeys.includes(key)
                const isExpanded = expandedKeys.includes(key)
                const isExpandable = expandable?.rowExpandable
                  ? expandable.rowExpandable(record)
                  : !!expandable?.expandedRowRender

                return (
                  <React.Fragment key={key}>
                    <TableRow
                      className={cn(
                        isSelected && "bg-muted/50",
                        "hover:bg-muted/30 transition-colors",
                        // Alternating row colors for better readability
                        index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-100 dark:bg-gray-800"
                      )}
                      {...onRow?.(record, index)}
                    >
                      {rowSelection && (
                        <TableCell
                          className={cn(
                            paddingClasses[size],
                            rowSelection.fixed && "sticky left-0 bg-background z-10"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleSelectRow(key, record, checked as boolean)
                            }
                            {...rowSelection.getCheckboxProps?.(record)}
                            aria-label={`Select row ${index + 1}`}
                          />
                        </TableCell>
                      )}

                      {expandable && (
                        <TableCell className={cn(paddingClasses[size])}>
                          {isExpandable &&
                            (expandable.expandIcon ? (
                              expandable.expandIcon({
                                expanded: isExpanded,
                                onExpand: () => handleExpand(key, record),
                                record,
                              })
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleExpand(key, record)}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            ))}
                        </TableCell>
                      )}

                      {columns.map((column) => {
                        const value = column.dataIndex
                          ? getNestedProperty(record, column.dataIndex)
                          : record[column.key]

                        return (
                          <TableCell
                            key={column.key}
                            className={cn(
                              paddingClasses[size],
                              sizeClasses[size],
                              column.align && `text-${column.align}`,
                              column.ellipsis && "truncate",
                              column.className,
                              column.fixed === "left" && "sticky left-0 bg-background z-10",
                              column.fixed === "right" && "sticky right-0 bg-background z-10"
                            )}
                            {...column.onCell?.(record, index)}
                          >
                            {column.render ? column.render(value, record, index) : value}
                          </TableCell>
                        )
                      })}
                    </TableRow>

                    {isExpanded && expandable?.expandedRowRender && (
                      <TableRow>
                        <TableCell
                          colSpan={
                            columns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0)
                          }
                          className={cn(paddingClasses[size], "bg-muted/20")}
                        >
                          {expandable.expandedRowRender(record, index, 0, isExpanded)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.total && pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {pagination.showTotal
              ? pagination.showTotal(pagination.total, [
                  (currentPage - 1) * pageSize + 1,
                  Math.min(currentPage * pageSize, pagination.total || 0),
                ])
              : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(
                  currentPage * pageSize,
                  pagination.total
                )} of ${pagination.total} entries`}
          </div>

          <div className="flex items-center gap-2">
            {pagination.showSizeChanger && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Show</span>
                <select
                  className="h-8 px-2 border rounded-md bg-background"
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value)
                    setPageSize(newSize)
                    setCurrentPage(1)
                    pagination.onShowSizeChange?.(1, newSize)
                    pagination.onChange?.(1, newSize)
                  }}
                >
                  {(pagination.pageSizeOptions || [10, 20, 50, 100]).map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span className="text-sm">entries</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1)
                  setCurrentPage(newPage)
                  pagination.onChange?.(newPage, pageSize)
                }}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page numbers */}
              {(() => {
                const totalPages = Math.ceil((pagination.total || 0) / pageSize)
                const pages: number[] = []
                const maxButtons = 5

                if (totalPages <= maxButtons) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i)
                  }
                } else {
                  pages.push(1)
                  if (currentPage > 3) pages.push(-1) // ellipsis

                  const start = Math.max(2, currentPage - 1)
                  const end = Math.min(totalPages - 1, currentPage + 1)

                  for (let i = start; i <= end; i++) {
                    pages.push(i)
                  }

                  if (currentPage < totalPages - 2) pages.push(-1) // ellipsis
                  pages.push(totalPages)
                }

                return pages.map((page, index) =>
                  page === -1 ? (
                    <span key={`ellipsis-${index}`} className="px-2">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setCurrentPage(page)
                        pagination.onChange?.(page, pageSize)
                      }}
                    >
                      {page}
                    </Button>
                  )
                )
              })()}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  const totalPages = Math.ceil((pagination.total || 0) / pageSize)
                  const newPage = Math.min(totalPages, currentPage + 1)
                  setCurrentPage(newPage)
                  pagination.onChange?.(newPage, pageSize)
                }}
                disabled={currentPage === Math.ceil((pagination.total || 1) / pageSize)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {footer && <div className="mt-4">{footer()}</div>}
    </div>
  )
}