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
        className="border p-2 w-full"
      >
        <option value="">
          Select Source Segment
        </option>

        {segments.map(seg=>(
          <option key={seg.file} value={seg.file}>
            {seg.name} ({seg.count})
          </option>
        ))}

      </select>

      {/* New name */}
      <input
        placeholder="New Segment Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
        className="border p-2 w-full"
      />

      {/* Remove head */}
      <input
        type="number"
        placeholder="Remove from Head (top)"
        value={removeHead}
        onChange={(e)=>setRemoveHead(Number(e.target.value))}
        className="border p-2 w-full"
      />

      {/* Remove tail */}
      <input
        type="number"
        placeholder="Remove from Tail (bottom)"
        value={removeTail}
        onChange={(e)=>setRemoveTail(Number(e.target.value))}
        className="border p-2 w-full"
      />

      {/* Button */}
      <button
        onClick={submit}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded"
      >
        {loading ? "Processing..." : "Create Trimmed Segment"}
      </button>

    </div>

  );

}