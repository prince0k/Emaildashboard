"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getPmtaStats } from "@/lib/pmtaApi"
import ServerCard from "@/components/pmta/ServerCard"

export default function StatsPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPmtaStats()
        setData(res || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  const uniqueData = Object.values(
    data.reduce((acc: any, item: any) => {
      const key = item.server?.name || item.server

      if (
        !acc[key] ||
        new Date(item.createdAt) > new Date(acc[key].createdAt)
      ) {
        acc[key] = item
      }

      return acc
    }, {})
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        PMTA Monitoring
      </h1>

      <div className="grid grid-cols-3 gap-4">
        {uniqueData.map((item: any, i: number) => (
          <div
            key={item._id || i}
            onClick={() =>
              router.push(`/pmta/server/${item.server?.name || item.server}`)
            }
          >
            <ServerCard item={item} />
          </div>
        ))}
      </div>
    </div>
  )
}
