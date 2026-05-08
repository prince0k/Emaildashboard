"use client"

import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 Tooltip,
 CartesianGrid,
 ResponsiveContainer
} from "recharts"

type Row = {
 day:string
 delivered:number
 opens:number
 clicks:number
 unsub:number
 optout:number
}

type Props = {
 data:Row[]
}

export default function SenderStatsChart({data}:Props){

 // sort latest → oldest
 const chartData = [...data].sort(
  (a,b)=> new Date(b.day).getTime() - new Date(a.day).getTime()
 )

 return(

  <div className="h-64 w-full">

   <ResponsiveContainer>

    <LineChart data={chartData}>

     <CartesianGrid strokeDasharray="3 3" />

     <XAxis dataKey="day" />
     <YAxis />

     <Tooltip />

     <Line type="monotone" dataKey="delivered" stroke="#2563eb" strokeWidth={2}/>
     <Line type="monotone" dataKey="opens" stroke="#16a34a" strokeWidth={2}/>
     <Line type="monotone" dataKey="clicks" stroke="#ea580c" strokeWidth={2}/>
     <Line type="monotone" dataKey="unsub" stroke="#dc2626" strokeWidth={2}/>
     <Line type="monotone" dataKey="optout" stroke="#9333ea" strokeWidth={2}/>

    </LineChart>

   </ResponsiveContainer>

  </div>

 )

}