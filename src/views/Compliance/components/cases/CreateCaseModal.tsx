import React, { useState } from 'react';
import { useAppDispatch } from '../../../../store/hooks';
import { createCaseFromTransaction } from '../../../../store/slices/casesSlice';
import { ECasePriority, CreateCaseRequest } from '../../../../typings/case';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  transactionTxId: string;
  clientId: string;
  amount: number;
}

const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  transactionId,
  transactionTxId,
  clientId,
  amount
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateCaseRequest>({
    title: `Case for Transaction ${transactionTxId}`,
    description: '',
    priority: ECasePriority.MEDIUM,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await dispatch(createCaseFromTransaction({
        transactionId,
        caseData: formData
      })).unwrap();
      
      onClose();
      // Reset form
      setFormData({
        title: `Case for Transaction ${transactionTxId}`,
        description: '',
        priority: ECasePriority.MEDIUM,
        notes: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Case from Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Transaction Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Transaction Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Transaction ID:</span>
                <p className="font-mono">{transactionTxId}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Client ID:</span>
                <p className="font-mono">{clientId}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <p>${amount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Case Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Case Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter case title"
              required
            />
          </div>

          {/* Case Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter case description"
              rows={3}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value as ECasePriority })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ECasePriority.LOW}>Low</SelectItem>
                <SelectItem value={ECasePriority.MEDIUM}>Medium</SelectItem>
                <SelectItem value={ECasePriority.HIGH}>High</SelectItem>
                <SelectItem value={ECasePriority.CRITICAL}>Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Initial Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter any initial notes or observations"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCaseModal;