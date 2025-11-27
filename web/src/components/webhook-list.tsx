import { WebhookListItem } from "./webhook-list-item";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { webhookListSchema } from "../http/schemas/webhook";
import { Loader2, Wand2 } from "lucide-react"
import { useRef, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog"
import { CodeBlock } from "./ui/code-block";

export function WebhookList() {
  const [checkedWebhookIds, setCheckedWebhookIds] = useState<string[]>([])
  const [generatedHandlerCode, setGeneratedHandlerCode] = useState<string | null>(null)

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery({
    queryKey: ['webhooks'],
    queryFn: async ({ pageParam }) => { 
      const url = new URL('http://localhost:3333/api/webhooks')

      if (pageParam) {
        url.searchParams.set('cursor', pageParam)
      }

      const response = await fetch(url)
      const data = await response.json()

      return webhookListSchema.parse(data)
    },

    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  })

  const webhooks = data.pages.flatMap((page) => page.webhooks)

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver((entries) => {
      const entry = entries[0]

      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }, {
      threshold: 0.1
    })

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isFetchingNextPage, hasNextPage, fetchNextPage])

  const handleCheckWebhook = (checkedWebhookId: string) => {
    if (checkedWebhookIds.includes(checkedWebhookId)) {
      setCheckedWebhookIds((prev) => prev.filter((id) => id !== checkedWebhookId))
    } else {
      setCheckedWebhookIds((prev) => [...prev, checkedWebhookId])
    }
  }

  const hasAnyWebhookChecked = checkedWebhookIds.length > 0

  const handleGenerateHandler = async () => {
    const response = await fetch('http://localhost:3333/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ webhookIds: checkedWebhookIds }),
    })

    type GenerateHandlerResponse = { code: string }

    const data: GenerateHandlerResponse = await response.json()

    setGeneratedHandlerCode(data.code)
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 p-2">
          <button 
            className="bg-indigo-400 size-8 w-full rounded-lg disabled:opacity-50 flex items-center gap-2 justify-center font-medium text-sm mb-3"
            disabled={!hasAnyWebhookChecked}
            onClick={() => handleGenerateHandler()}
          >
            <Wand2 className="size-4" />
            Generate Handler
          </button>

          {webhooks.map((webhook) => (
            <WebhookListItem 
              key={webhook.id} 
              webhook={webhook} 
              isWebhookChecked={checkedWebhookIds.includes(webhook.id)}
              onWebhookChecked={handleCheckWebhook}
            />
          ))}
        </div>

        {hasNextPage && (
          <div className="p-2" ref={loadMoreRef}>
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="animate-spin size-5 text-zinc-500" />
              </div>
            )}
          </div>
        )}  
      </div>

      {!!generatedHandlerCode && (
        <Dialog.Root defaultOpen>
          <Dialog.Overlay className="bg-black/60 inset-0 fixed z-20"/>
          <Dialog.Content className="flex items-center justify-center fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -translate-z-1/2 max-h-[85vh] w-[90vw] z-50">
            <div className="bg-zinc-900 w-[500px] max-h-[400px] overflow-y-auto p-4 rounded-lg border border-zinc-800">
              <CodeBlock language="typescript" code={generatedHandlerCode}/>
            </div>
          </Dialog.Content>
        </Dialog.Root>
      )}
    </>
  )
}