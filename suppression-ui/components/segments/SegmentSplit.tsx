"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

type Segment = {
  name:string
  file:string
  count:number
};

export default function SegmentSplit(){

  const [segments,setSegments] = useState<Segment[]>([]);
  const [segment,setSegment] = useState("");
  const [parts,setParts] = useState(2);
  const [loading,setLoading] = useState(false);

  async function load(){

    const res = await api.get("/segments/list");

    setSegments(res.data || []);

  }

  async function split(){

    try{

      setLoading(true);

      await api.post("/segments/split",{
        segment,
        parts
      });

      alert("Segment split successfully");

    }catch(err){

      console.error(err);
      alert("Split failed");

    }finally{
      setLoading(false);
    }

  }

  useEffect(()=>{
    load();
  },[]);

  return(

    <div className="space-y-4">

      <h2 className="text-lg font-semibold">
        Split Segment
      </h2>

      <select
        value={segment}
        onChange={(e)=>setSegment(e.target.value)}
        className="border p-2"
      >

        <option value="">
          Select Segment
        </option>

        {segments.map(seg=>(
          <option key={seg.file} value={seg.file}>
            {seg.name} ({seg.count})
          </option>
        ))}

      </select>

      <input
        type="number"
        value={parts}
        onChange={(e)=>setParts(Number(e.target.value))}
        className="border p-2"
        min={2}
      />

      <button
        onClick={split}
        disabled={!segment || loading}
        className="border px-4 py-2"
      >
        Split Segment
      </button>

    </div>

  );

}