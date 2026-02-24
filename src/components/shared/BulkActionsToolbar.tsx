import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import {
  ChevronDown,
  Mail,
  UserPlus,
  Trash2,
  Download,
  Tag,
  MessageSquare,
  Phone,
  Calendar,
  Archive
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkActionsToolbarProps {
  selectedItems: string[];
  entityType: 'leads' | 'contacts' | 'accounts' | 'opportunities' | 'tasks';
  onClearSelection: () => void;
  onBulkAction: (action: string, data?: Record<string, unknown>) => Promise<void>;
  className?: string;
}

export function BulkActionsToolbar({
  selectedItems,
  entityType,
  onClearSelection,
  onBulkAction,
  className = ''
}: BulkActionsToolbarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');

  if (selectedItems.length === 0) return null;

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    setIsLoading(true);
    setCurrentAction(action);

    try {
      await onBulkAction(action, data);
      toast.success(`Bulk ${action} completed successfully`);
      onClearSelection();
    } catch (error) {
      toast.error(`Failed to perform bulk ${action}`);
      console.error('Bulk action error:', error);
    } finally {
      setIsLoading(false);
      setCurrentAction('');
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    handleAction('delete');
  };

  const getEntityActions = () => {
    const commonActions = [
      {
        label: 'Export Selected',
        icon: Download,
        action: 'export',
        variant: 'default' as const
      },
      {
        label: 'Add Tags',
        icon: Tag,
        action: 'add-tags',
        variant: 'default' as const
      }
    ];

    const entitySpecificActions = {
      leads: [
        {
          label: 'Assign to User',
          icon: UserPlus,
          action: 'assign',
          variant: 'default' as const
        },
        {
          label: 'Send Email',
          icon: Mail,
          action: 'send-email',
          variant: 'default' as const
        },
        {
          label: 'Send WhatsApp',
          icon: MessageSquare,
          action: 'send-whatsapp',
          variant: 'default' as const
        },
        {
          label: 'Schedule Follow-up',
          icon: Calendar,
          action: 'schedule-followup',
          variant: 'default' as const
        },
        {
          label: 'Convert to Contacts',
          icon: UserPlus,
          action: 'convert',
          variant: 'default' as const
        }
      ],
      contacts: [
        {
          label: 'Send Email',
          icon: Mail,
          action: 'send-email',
          variant: 'default' as const
        },
        {
          label: 'Send WhatsApp',
          icon: MessageSquare,
          action: 'send-whatsapp',
          variant: 'default' as const
        },
        {
          label: 'Schedule Call',
          icon: Phone,
          action: 'schedule-call',
          variant: 'default' as const
        },
        {
          label: 'Add to Campaign',
          icon: Mail,
          action: 'add-to-campaign',
          variant: 'default' as const
        }
      ],
      accounts: [
        {
          label: 'Assign Owner',
          icon: UserPlus,
          action: 'assign-owner',
          variant: 'default' as const
        },
        {
          label: 'Update Status',
          icon: Tag,
          action: 'update-status',
          variant: 'default' as const
        },
        {
          label: 'Archive',
          icon: Archive,
          action: 'archive',
          variant: 'default' as const
        }
      ],
      opportunities: [
        {
          label: 'Update Stage',
          icon: Tag,
          action: 'update-stage',
          variant: 'default' as const
        },
        {
          label: 'Assign Owner',
          icon: UserPlus,
          action: 'assign-owner',
          variant: 'default' as const
        },
        {
          label: 'Generate Quotes',
          icon: Download,
          action: 'generate-quotes',
          variant: 'default' as const
        }
      ],
      tasks: [
        {
          label: 'Mark Complete',
          icon: Tag,
          action: 'mark-complete',
          variant: 'default' as const
        },
        {
          label: 'Reassign',
          icon: UserPlus,
          action: 'reassign',
          variant: 'default' as const
        },
        {
          label: 'Update Priority',
          icon: Tag,
          action: 'update-priority',
          variant: 'default' as const
        }
      ]
    };

    return [...entitySpecificActions[entityType], ...commonActions];
  };

  const actions = getEntityActions();

  return (
    <>
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between bg-primary/5 border border-primary/10 rounded-lg p-3 gap-3 mb-4 ${className}`}>
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="text-sm font-medium text-primary whitespace-nowrap">
            {selectedItems.length} {entityType} selected
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-primary/70 hover:text-primary hover:bg-primary/10 h-8 px-2 text-xs"
          >
            Clear selection
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto h-9"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                    {currentAction}...
                  </>
                ) : (
                  <>
                    Bulk Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.action}
                    onClick={() => handleAction(action.action)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>



      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${selectedItems.length} ${entityType}?`}
        description={`This action cannot be undone. This will permanently delete the selected ${entityType} and remove all associated data.`}
        confirmText={`Delete ${selectedItems.length} ${entityType}`}
        isDeleting={isLoading && currentAction === 'delete'}
      />
    </>
  );
}