import { useMemo,useState } from 'react';

// Generic interface for table data
export interface DataTableProps<TData> {
  data: TData[];
  columns: {
    key: string;
    title: string;
    width?: number;
    render?: (value: any, record: TData) => React.ReactNode;
  }[];
  title?: string;
  loading?: boolean;
  error?: Error | null;
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyText?: string;
  className?: string;
}

export function DataTable<TData>({
  data,
  columns,
  title,
  loading = false,
  searchable = true,
  searchPlaceholder = "Search...",
  pagination = true,
  pageSize = 5,
  pageSizeOptions = [5, 8, 12, 20, 50, 100],
  emptyText = "No data found",
  className,
}: DataTableProps<TData>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter((item: any) => {
      return Object.values(item).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    
    const startIndex = (currentPage - 1) * pageSizeState;
    const endIndex = startIndex + pageSizeState;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSizeState, pagination]);

  const totalPages = Math.ceil(filteredData.length / pageSizeState);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSizeState(newPageSize);
    setCurrentPage(1);
  };

  const renderCell = (column: any, record: TData) => {
    const value = (record as any)[column.key];
    
    if (column.render) {
      return column.render(value, record);
    }
    
    return <span className="text-gray-200 text-xs">{String(value)}</span>;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {(title || searchable) && (
        <div className="flex justify-between items-center mb-3 flex-wrap gap-3 flex-shrink-0">
          {title && <h5 className="text-white m-0 text-base font-semibold">{title}</h5>}
          <div className="flex gap-2 items-center flex-wrap">
            {searchable && (
              <div className="min-w-[180px]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[250px] bg-gray-800/80 border border-gray-700/80 text-white rounded-md text-xs px-3 py-2 focus:border-orange-500 focus:outline-none focus:shadow-[0_0_0_2px_rgba(249,115,22,0.2)] placeholder-gray-400"
                  />
                  <button className="absolute right-0 top-0 h-full px-3 bg-orange-600/80 border border-orange-600 rounded-r-md hover:bg-red-600/80 hover:border-red-600 transition-colors">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 flex-1 flex flex-col justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <div className="text-gray-400 mt-3 text-sm">Loading data...</div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="relative flex-1">
            <div className="absolute inset-0 overflow-y-auto bg-gray-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
              <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
                <thead className="sticky top-0 z-10">
                  <tr>
                    {columns.map((column, index) => (
                      <th
                        key={column.key}
                        className={`relative bg-table-header text-gray-300 font-semibold p-2 text-xs text-left transition-colors border-b border-gray-700
                          ${index === 0 ? 'rounded-tl-md' : ''}
                          ${index === columns.length - 1 ? 'rounded-tr-md' : ''}
                        `}
                        style={{ width: column.width }}
                      >
                        <div className="flex items-center gap-1">
                          {column.title}
                        </div>
                        {index < columns.length - 1 && (
                          <div className="absolute top-1/2 right-0 h-1/2 -translate-y-1/2 w-px bg-gray-700"></div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-transparent">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-700/80 transition-colors">
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className="border-b border-gray-700 p-1.5 text-xs"
                          >
                            {renderCell(column, record)}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                        {emptyText}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pagination && filteredData.length > 0 && (
            <div className="mt-3 flex-shrink-0 flex items-center justify-between bg-gray-800 p-2">
              <div className="flex items-center gap-4">
                <span className="text-gray-200 text-xs">
                  {`${(currentPage - 1) * pageSizeState + 1}-${Math.min(currentPage * pageSizeState, filteredData.length)} of ${filteredData.length} items`}
                </span>
                <select
                  className="min-w-[70px] bg-gray-800 border border-orange-500 text-white rounded-md text-xs px-2 py-1 focus:border-orange-500 focus:outline-none"
                  value={pageSizeState}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size} per page</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-gray-200 hover:text-orange-500 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                  ←
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        currentPage === pageNum
                          ? 'text-orange-500'
                          : 'text-gray-200 hover:text-orange-500'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-gray-200 hover:text-orange-500 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 