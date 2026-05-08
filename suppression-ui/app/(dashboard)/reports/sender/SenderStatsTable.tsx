"use client"

import { useState, Fragment } from "react"
import useSenderStats from "./useSenderStats"
import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 Tooltip,
 CartesianGrid,
 ResponsiveContainer
} from "recharts"

type Props = {
 days: number
}

type Row = {
 day: string
 sender: string
 delivered: number
 opens: number
 clicks: number
 unsub: number
 optout: number
}

export default function SenderStatsTable({ days }: Props){

 const {data,loading} = useSenderStats(days)
 const [openSender,setOpenSender] = useState<string | null>(null)

 if(loading){
  return <div className="p-6 text-muted-foreground">Loading...</div>
 }

 /* ======================
    GROUP BY SENDER
 ====================== */

 const grouped = data.reduce((acc:Record<string,Row[]>,row:Row)=>{

  if(!acc[row.sender]){
   acc[row.sender] = []
  }

  acc[row.sender].push(row)

  return acc

 },{})

 return(

  <div className="card-glass p-4 overflow-x-auto">

  <table className="w-full text-sm">

   <thead>

    <tr className="border-b border-border text-muted-foreground text-left">

     <th className="py-3 px-3">Sender</th>
     <th className="py-3 px-3">Date</th>
     <th className="py-3 px-3">Delivered</th>
     <th className="py-3 px-3">Opens</th>
     <th className="py-3 px-3">Clicks</th>
     <th className="py-3 px-3">Unsub</th>
     <th className="py-3 px-3">Optout</th>

    </tr>

   </thead>

   <tbody>

   {Object.entries(grouped).map(([sender,rows])=>{
    const sortedRows = [...rows].sort(
        (a,b)=> new Date(a.day).getTime() - new Date(b.day).getTime()
        )
    return(

     <Fragment key={sender}>

     {/* Sender Row */}

     <tr
      key={sender}
      className="cursor-pointer border-b border-border hover:bg-muted transition"
      onClick={()=>setOpenSender(
       openSender === sender ? null : sender
      )}
     >

      <td className="py-3 px-3 font-semibold text-primary">
       {sender}
      </td>

      <td colSpan={6} className="text-muted-foreground">
       Click to view graph
      </td>

     </tr>

     {/* Date Rows */}

     {rows.map((row)=>(

      <tr
       key={sender + row.day}
       className="border-b border-border hover:bg-muted/50 transition"
      >

       <td></td>

       <td className="py-2 px-3">{row.day}</td>
       <td className="py-2 px-3">{row.delivered}</td>
       <td className="py-2 px-3">{row.opens}</td>
       <td className="py-2 px-3">{row.clicks}</td>
       <td className="py-2 px-3">{row.unsub}</td>
       <td className="py-2 px-3">{row.optout}</td>

      </tr>

     ))}

     {/* Graph */}

     {openSender === sender && (

      <tr>

       <td colSpan={7} className="p-6">

        <div className="h-72 card-glass p-4">

         <ResponsiveContainer width="100%" height="100%">

          <LineChart data={sortedRows}>

           <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />

           <XAxis
            dataKey="day"
            stroke="var(--muted-foreground)"
            angle={-35}
            textAnchor="end"
            />

           <YAxis stroke="var(--muted-foreground)" />

           <Tooltip />

           <Line
            type="monotone"
            dataKey="delivered"
            stroke="var(--primary)"
            strokeWidth={2}
           />

           <Line
            type="monotone"
            dataKey="opens"
            stroke="#22c55e"
            strokeWidth={2}
           />

           <Line
            type="monotone"
            dataKey="clicks"
            stroke="#f97316"
            strokeWidth={2}
           />

           <Line
            type="monotone"
            dataKey="unsub"
            stroke="#ef4444"
            strokeWidth={2}
           />

           <Line
            type="monotone"
            dataKey="optout"
            stroke="#a855f7"
            strokeWidth={2}
           />

          </LineChart>

         </ResponsiveContainer>

        </div>

       </td>

      </tr>

     )}

     </Fragment>

    )

   })}

   </tbody>

  </table>

  </div>

 )

}