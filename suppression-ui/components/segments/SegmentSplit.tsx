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
        className="border border-border bg-card text-foreground px-3 py-2 rounded-lg outline-none focus:border-primary transition-colors cursor-pointer w-full max-w-md block"
      >

        <option value="" className="bg-card text-foreground">
          Select Segment
        </option>

        {segments.map(seg=>(
          <option key={seg.file} value={seg.file} className="bg-card text-foreground">
            {seg.name} ({seg.count})
          </option>
        ))}

      </select>

      <input
        type="number"
        value={parts}
        onChange={(e)=>setParts(Number(e.target.value))}
        className="border border-border bg-card text-foreground px-3 py-2 rounded-lg outline-none focus:border-primary transition-colors block w-24"
        min={2}
      />

      <button
        onClick={split}
        disabled={!segment || loading}
        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg disabled:bg-muted disabled:text-text-muted disabled:cursor-not-allowed transition-colors cursor-pointer block"
      >
        Split Segment
      </button>

    </div>

  );

}