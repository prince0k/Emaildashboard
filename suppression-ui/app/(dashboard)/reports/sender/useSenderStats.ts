import { useEffect, useState } from "react"

type SenderStats = {
  day: string
  sender: string
  delivered: number
  opens: number
  clicks: number
  unsub: number
  optout: number
}

export default function useSenderStats(days = 5) {

  const [data,setData] = useState<SenderStats[]>([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    async function load(){

      const res = await fetch(
        `/api/reports/senderDailyStats?days=${days}`
      )

      const json = await res.json()

      setData(json.data || [])
      setLoading(false)
    }

    load()

  },[days])

  return { data, loading }

}