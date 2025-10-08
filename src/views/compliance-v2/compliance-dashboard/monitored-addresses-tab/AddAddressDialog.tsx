import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

interface AddAddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddAddressDialog({ open, onOpenChange }: AddAddressDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Monitored Address</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add a new blockchain address to the monitoring system
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Blockchain</Label>
              <Select>
                <SelectTrigger className="bg-gray-800 border-gray-600 mt-1">
                  <SelectValue placeholder="Select blockchain..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="bitcoin">Bitcoin</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="litecoin">Litecoin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400">Category</Label>
              <Select>
                <SelectTrigger className="bg-gray-800 border-gray-600 mt-1">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high_risk">High Risk</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-gray-400">Address</Label>
            <Input className="bg-gray-800 border-gray-600 mt-1" placeholder="Enter blockchain address..." />
          </div>
          <div>
            <Label className="text-gray-400">Label</Label>
            <Input className="bg-gray-800 border-gray-600 mt-1" placeholder="Enter descriptive label..." />
          </div>
          <div>
            <Label className="text-gray-400">Monitoring Reason</Label>
            <Select>
              <SelectTrigger className="bg-gray-800 border-gray-600 mt-1">
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="sanctions">Sanctions screening</SelectItem>
                <SelectItem value="pep">PEP association</SelectItem>
                <SelectItem value="criminal">Criminal activity</SelectItem>
                <SelectItem value="mixer">Mixing service</SelectItem>
                <SelectItem value="investigation">Investigation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-400">Alert Threshold (USD)</Label>
            <Input
              type="number"
              className="bg-gray-800 border-gray-600 mt-1"
              placeholder="Enter alert threshold..."
            />
          </div>
          <div>
            <Label className="text-gray-400">Notes</Label>
            <Textarea className="bg-gray-800 border-gray-600 mt-1" placeholder="Add monitoring notes..." rows={3} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="alerts" />
            <Label htmlFor="alerts" className="text-gray-400">
              Enable alerts for this address
            </Label>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Add Address</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}