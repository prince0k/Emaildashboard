"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

type Segment = {
  name: string
  file: string
  count: number
}

export default function SegmentTrim(){

  const [segments,setSegments] = useState<Segment[]>([]);

  const [sourceSegment,setSourceSegment] = useState("");
  const [name,setName] = useState("");

  const [removeHead,setRemoveHead] = useState<number | "">("");
  const [removeTail,setRemoveTail] = useState<number | "">("");

  const [loading,setLoading] = useState(false);

  async function loadSegments(){

    try{

      const res = await api.get("/segments/list");

      setSegments(res.data || []);

    }catch(err){

      console.error("SEGMENT LOAD ERROR",err);

    }

  }

  useEffect(()=>{
    loadSegments();
  },[]);

  async function submit(){

    if(!name){
      alert("Segment name required");
      return;
    }

    if(!sourceSegment){
      alert("Select source segment");
      return;
    }

    try{

      setLoading(true);

      const res = await api.post("/segments/trim",{
        name,
        sourceSegment,
        removeHead: removeHead || 0,
        removeTail: removeTail || 0
      });

      alert(
        `Segment created\n\nName: ${res.data.segment}\nEmails: ${res.data.count}`
      );

      setName("");
      setRemoveHead("");
      setRemoveTail("");

    }catch(err){

      console.error("TRIM ERROR",err);

      alert("Trim failed");

    }finally{
      setLoading(false);
    }

  }

  return(

    <div className="space-y-4">

      {/* Source segment */}
      <select
        value={sourceSegment}
        onChange={(e)=>setSourceSegment(e.target.value)}
        className="border border-border bg-card text-foreground px-3 py-2 rounded-lg outline-none focus:border-primary transition-colors cursor-pointer w-full"
      >
        <option value="" className="bg-card text-foreground">
          Select Source Segment
        </option>

        {segments.map(seg=>(
          <option key={seg.file} value={seg.file} className="bg-card text-foreground">
            {seg.name} ({seg.count})
          </option>
        ))}

      </select>

      {/* New name */}
      <input
        placeholder="New Segment Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
        className="border border-border bg-card text-foreground px-3 py-2 rounded-lg outline-none focus:border-primary transition-colors w-full"
      />

      {/* Remove head */}
      <input
        type="number"
        placeholder="Remove from Head (top)"
        value={removeHead}
        onChange={(e)=>setRemoveHead(Number(e.target.value))}
        className="border border-border bg-card text-foreground px-3 py-2 rounded-lg outline-none focus:border-primary transition-colors w-full"
      />

      {/* Remove tail */}
      <input
        type="number"
        placeholder="Remove from Tail (bottom)"
        value={removeTail}
        onChange={(e)=>setRemoveTail(Number(e.target.value))}
        className="border border-border bg-card text-foreground px-3 py-2 rounded-lg outline-none focus:border-primary transition-colors w-full"
      />

      {/* Button */}
      <button
        onClick={submit}
        disabled={loading}
        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg disabled:bg-muted disabled:text-text-muted disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading ? "Processing..." : "Create Trimmed Segment"}
      </button>

    </div>

  );

}