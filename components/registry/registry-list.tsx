import { MCPServerWithReviewSummary } from "@/lib/registry"
import RegistryCard from "./registry-card"

interface RegistryListProps {
  items: MCPServerWithReviewSummary[]
}

export default function RegistryList({ items }: RegistryListProps) {
  return (
    <div className="flex flex-col sm:grid gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
      {items.map((item, index) => (
        <div
          key={item.identifier || item["@id"] || item.name}
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          className="h-full"
        >
          <meta itemProp="position" content={(index + 1).toString()} />
          <div itemProp="item" className="h-full">
            <RegistryCard item={item} />
          </div>
        </div>
      ))}
    </div>
  )
}
