import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { 
  fetchCases, 
  selectAllCases, 
  selectCasesLoading, 
  selectCasesError,
  selectCasesPagination,
  setFilters
} from '../../../../store/slices/casesSlice';
import { ECaseStatus, ECasePriority } from '../../../../typings/case';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Archive,
  User
} from 'lucide-react';
import { format } from 'date-fns';

const CasesTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const cases = useAppSelector(selectAllCases);
  const loading = useAppSelector(selectCasesLoading);
  const error = useAppSelector(selectCasesError);
  const pagination = useAppSelector(selectCasesPagination);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ECaseStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ECasePriority | 'all'>('all');

  // Load cases on component mount
  useEffect(() => {
    dispatch(fetchCases({}));
  }, [dispatch]);

  // Handle search and filters
  const handleSearch = () => {
    const filters: any = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (priorityFilter !== 'all') filters.priority = priorityFilter;
    
    dispatch(setFilters(filters));
    dispatch(fetchCases(filters));
  };

  // Handle filter changes
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as ECaseStatus | 'all');
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value as ECasePriority | 'all');
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: ECaseStatus) => {
    switch (status) {
      case ECaseStatus.OPEN:
        return 'default';
      case ECaseStatus.IN_PROGRESS:
        return 'secondary';
      case ECaseStatus.UNDER_REVIEW:
        return 'outline';
      case ECaseStatus.CLOSED:
        return 'default';
      case ECaseStatus.ARCHIVED:
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: ECasePriority) => {
    switch (priority) {
      case ECasePriority.LOW:
        return 'secondary';
      case ECasePriority.MEDIUM:
        return 'default';
      case ECasePriority.HIGH:
        return 'destructive';
      case ECasePriority.CRITICAL:
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: ECaseStatus) => {
    switch (status) {
      case ECaseStatus.OPEN:
        return <Clock className="h-4 w-4" />;
      case ECaseStatus.IN_PROGRESS:
        return <User className="h-4 w-4" />;
      case ECaseStatus.UNDER_REVIEW:
        return <Eye className="h-4 w-4" />;
      case ECaseStatus.CLOSED:
        return <CheckCircle className="h-4 w-4" />;
      case ECaseStatus.ARCHIVED:
        return <Archive className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Case Management</h2>
          <p className="text-muted-foreground">
            Manage compliance cases and track investigation progress
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Case
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={ECaseStatus.OPEN}>Open</SelectItem>
                  <SelectItem value={ECaseStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={ECaseStatus.UNDER_REVIEW}>Under Review</SelectItem>
                  <SelectItem value={ECaseStatus.CLOSED}>Closed</SelectItem>
                  <SelectItem value={ECaseStatus.ARCHIVED}>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value={ECasePriority.LOW}>Low</SelectItem>
                  <SelectItem value={ECasePriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={ECasePriority.HIGH}>High</SelectItem>
                  <SelectItem value={ECasePriority.CRITICAL}>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cases ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cases found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((caseItem) => (
                  <TableRow key={caseItem._id}>
                    <TableCell className="font-mono text-sm">
                      {caseItem.caseNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{caseItem.title}</div>
                        {caseItem.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {caseItem.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {caseItem.clientId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(caseItem.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(caseItem.status)}
                        {caseItem.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(caseItem.priority)}>
                        {caseItem.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {caseItem.assignedTo ? (
                        <div>
                          <div className="font-medium">{caseItem.assignedTo.name}</div>
                          <div className="text-sm text-muted-foreground">{caseItem.assignedTo.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {caseItem.totalAmount ? `$${caseItem.totalAmount.toLocaleString()}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(caseItem.openedAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CasesTab;