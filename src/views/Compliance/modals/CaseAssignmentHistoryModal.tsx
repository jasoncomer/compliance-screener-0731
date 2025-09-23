import React, { useEffect,useState } from 'react';

import { 
  ArrowRight, 
  Clock, 
  History,
  User, 
  UserCheck,
  UserX
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useAppSelector } from '../../../store/hooks';
import { selectActiveOrgMembersMap } from '../../../store/slices/organizationsSlice';
import { IComplianceTransaction } from '../../../typings/compliance';
import { getUserDisplayName } from '../../../utils/display-labels';

interface AssignmentHistoryEntry {
  id: string;
  assignedTo: string | null;
  assignedBy: string | null;
  assignedAt: Date;
  unassignedAt?: Date;
  notes?: string;
  status: 'assigned' | 'unassigned' | 'reassigned';
}

interface CaseAssignmentHistoryModalProps {
  isVisible: boolean;
  onClose: () => void;
  transaction: IComplianceTransaction | null;
}

export const CaseAssignmentHistoryModal: React.FC<CaseAssignmentHistoryModalProps> = ({
  isVisible,
  onClose,
  transaction
}) => {
  const organizationMembers = useAppSelector(selectActiveOrgMembersMap);
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistoryEntry[]>([]);

  // Generate assignment history from statusHistory
  useEffect(() => {
    if (!transaction || !isVisible) return;

    const generateAssignmentHistory = () => {
      const history: AssignmentHistoryEntry[] = [];
      
      // Sort statusHistory by timestamp
      const sortedStatusHistory = [...(transaction.statusHistory || [])].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Track assignment changes
      let currentAssignee: string | null = null;
      let assignmentStartTime: Date | null = null;

      sortedStatusHistory.forEach((entry, index) => {
        // If this entry has a reviewer and it's different from current assignee
        if (entry.reviewer && entry.reviewer !== currentAssignee) {
          // If there was a previous assignee, mark them as unassigned
          if (currentAssignee && assignmentStartTime) {
            history.push({
              id: `unassigned-${index}`,
              assignedTo: null,
              assignedBy: entry.reviewer, // The new reviewer is doing the reassignment
              assignedAt: assignmentStartTime,
              unassignedAt: new Date(entry.timestamp),
              status: 'reassigned'
            });
          }

          // Add new assignment
          history.push({
            id: `assigned-${index}`,
            assignedTo: entry.reviewer,
            assignedBy: entry.reviewer, // For now, assume self-assignment
            assignedAt: new Date(entry.timestamp),
            status: 'assigned'
          });

          currentAssignee = entry.reviewer;
          assignmentStartTime = new Date(entry.timestamp);
        }
      });

      // Add current assignment if exists
      if (transaction.reviewerId && transaction.reviewTimestamp) {
        const currentAssignmentExists = history.some(entry => 
          entry.assignedTo === transaction.reviewerId && 
          !entry.unassignedAt
        );

        if (!currentAssignmentExists) {
          history.push({
            id: 'current-assignment',
            assignedTo: transaction.reviewerId,
            assignedBy: transaction.reviewerId,
            assignedAt: new Date(transaction.reviewTimestamp),
            status: 'assigned'
          });
        }
      }

      // Sort by assignment date (newest first)
      history.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
      
      setAssignmentHistory(history);
    };

    generateAssignmentHistory();
  }, [transaction, isVisible]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'unassigned':
        return <UserX className="h-4 w-4 text-red-600" />;
      case 'reassigned':
        return <ArrowRight className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Assigned</Badge>;
      case 'unassigned':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Unassigned</Badge>;
      case 'reassigned':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Reassigned</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (assignedAt: Date, unassignedAt?: Date) => {
    const endTime = unassignedAt || new Date();
    const duration = endTime.getTime() - new Date(assignedAt).getTime();
    const days = Math.floor(duration / (1000 * 60 * 60 * 24));
    const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes}m`;
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Case Assignment History
          </DialogTitle>
          <DialogDescription>
            Track all assignment changes for this compliance case
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {assignmentHistory.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <History className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">
                    No assignment history available for this case.
                  </p>
                </CardContent>
              </Card>
            ) : (
              assignmentHistory.map((entry, index) => (
                <Card key={entry.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(entry.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(entry.status)}
                            <span className="text-sm text-gray-500">
                              {formatDate(entry.assignedAt)}
                            </span>
                          </div>
                          {entry.unassignedAt && (
                            <span className="text-xs text-gray-400">
                              Duration: {getDuration(entry.assignedAt, entry.unassignedAt)}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          {entry.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Assigned to:</span>
                              <span className="font-medium text-gray-900">
                                {getUserDisplayName(organizationMembers[entry.assignedTo]) || 'Unknown User'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <UserX className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Unassigned</span>
                            </div>
                          )}

                          {entry.assignedBy && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Assigned by:</span>
                              <span className="font-medium text-gray-900">
                                {getUserDisplayName(organizationMembers[entry.assignedBy]) || 'Unknown User'}
                              </span>
                            </div>
                          )}

                          {entry.unassignedAt && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Unassigned on:</span>
                              <span className="text-sm text-gray-900">
                                {formatDate(entry.unassignedAt)}
                              </span>
                            </div>
                          )}
                        </div>

                        {entry.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                            {entry.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  
                  {index < assignmentHistory.length - 1 && (
                    <div className="absolute left-6 top-full w-px h-4 bg-gray-200" />
                  )}
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaseAssignmentHistoryModal;