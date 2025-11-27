import { Link } from "@tanstack/react-router"
import { formatDistanceToNow } from "date-fns"
import { TrashIcon } from "lucide-react"
import { Checkbox } from "./ui/checkbox"
import { IconButton } from "./ui/icon-button"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface WebhookListItemProps {
  webhook: {
    id: string
    method: string
    pathname: string
    createdAt: Date
  },
  onWebhookChecked: (webhookId: string) => void
  isWebhookChecked: boolean
}

export function WebhookListItem({ webhook, onWebhookChecked, isWebhookChecked }: WebhookListItemProps) {
  const queryClient = useQueryClient()

  const { mutate: deleteWebhook } = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`http://localhost:3333/api/webhooks/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['webhooks'],
      })
    },
  })

  return (
    <div className="group rounded-lg transition-colors duration-150 hover:bg-zinc-700/30"> 
      <div className="flex items-start gap-3 px-4 py-2.5">
        <Checkbox
          onCheckedChange={() => onWebhookChecked(webhook.id)}
          checked={isWebhookChecked}
        />
        <Link to="/webhook/$id" params={{ id: webhook.id }} className="flex flex-1 min-w-0 items-start gap-3">
          <span className="w-12 shrink-0 font-mono text-xs font-semibold text-zinc-300 text-right">
            {webhook.method}
          </span>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs text-zinc-200 leading-tight font-mono">
              {webhook.pathname}
            </p>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              {formatDistanceToNow(webhook.createdAt, { addSuffix: true })}
            </p>
          </div>
        </Link>
        <IconButton 
          icon={<TrashIcon className="size-3.5"/>}
          className="opacity-0 transition-opacity group-hover:opacity-100"  
          onClick={() => deleteWebhook(webhook.id)}
        />
      </div>
    </div>
  )
}