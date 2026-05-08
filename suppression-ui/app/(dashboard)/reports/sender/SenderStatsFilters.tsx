"use client";

import { useState } from "react";

type Props = {
  onChange: (days: number) => void;
};

export default function SenderStatsFilters({ onChange }: Props) {

 const [days,setDays] = useState(5);

 const handleChange = (value:number) => {
  setDays(value);
  onChange(value);
 };

 return(
  <div className="flex gap-4 items-center">

   <label>Last days</label>

   <select
    value={days}
    onChange={(e)=>handleChange(Number(e.target.value))}
    className="border p-2 rounded"
   >
    <option value={5}>5</option>
    <option value={7}>7</option>
    <option value={14}>14</option>
    <option value={30}>30</option>
   </select>

  </div>
 );
}